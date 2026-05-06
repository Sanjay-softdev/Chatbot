// server/index.js  — Express backend for NovaMind
// Handles: chat streaming via Ollama, JWT auth validation
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "mistral:7b";
const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json());

// ── Admin Supabase client (service role) ──────────────────────────────────────
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Auth middleware ────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  const token = auth.slice(7);
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = user;
  req.token = token;
  next();
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: DEFAULT_MODEL, ollama: OLLAMA_URL });
});

// ── Check Ollama availability ─────────────────────────────────────────────────
app.get("/api/ollama/status", async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    res.json({ available: true, models: data.models?.map((m) => m.name) || [] });
  } catch {
    res.json({ available: false, models: [] });
  }
});

// ── GET /api/search ──────────────────────────────────────────────────────────
// Proxy SearXNG (local metasearch engine) — set SEARXNG_URL in .env
app.get("/api/search", requireAuth, async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "q param required" });
  try {
    const url = `${SEARXNG_URL}/search?q=${encodeURIComponent(q)}&format=json&categories=general&language=en`;
    const r = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "NovaMind/1.0" },
    });
    if (!r.ok) throw new Error(`SearXNG returned ${r.status}`);
    const data = await r.json();
    const results = (data.results || []).slice(0, 6).map(item => ({
      title: item.title || "",
      snippet: item.content || item.title || "",
      url: item.url || "",
    }));
    res.json({ query: q, results, engine: "searxng" });
  } catch (e) {
    console.error("SearXNG error:", e.message);
    res.status(502).json({ error: `SearXNG unavailable: ${e.message}. Is it running at ${SEARXNG_URL}?` });
  }
});

// ── POST /api/chat/stream ─────────────────────────────────────────────────────
// Streams Ollama response via SSE, saves assistant message to DB when done
app.post("/api/chat/stream", requireAuth, async (req, res) => {
  const { messages, conversationId, model = DEFAULT_MODEL, systemPrompt, userMessage } = req.body;

  if (!messages?.length || !conversationId) {
    return res.status(400).json({ error: "messages and conversationId required" });
  }

  // ── SSE Headers ──────────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // ── Save user message to DB first (service role → bypasses RLS) ─────────────
  if (userMessage) {
    const { data: savedMsg, error: msgErr } = await adminSupabase
      .from("messages")
      .insert({ conversation_id: conversationId, role: "user", content: userMessage })
      .select()
      .single();
    if (msgErr) {
      console.error("User message DB insert error:", msgErr.message);
      sendEvent({ error: "Failed to save message: " + msgErr.message });
      res.end();
      return;
    }
    // Send the saved message back so the client can use the real DB id
    sendEvent({ userSaved: savedMsg });

    // ── Update conversation timestamp immediately ─────────────────────────────
    await adminSupabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  let fullContent = "";

  try {
    // ── Call Ollama ───────────────────────────────────────────────────────────
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        options: {
          temperature: systemPrompt ? 0.5 : 0.7,
          top_p: 0.9,
          num_predict: systemPrompt ? 4096 : 2048,
        },
      }),
    });

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      sendEvent({ error: `Ollama error: ${err}` });
      res.end();
      return;
    }

    // ── Stream response chunks ─────────────────────────────────────────────────
    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            fullContent += data.message.content;
            sendEvent({ content: data.message.content, done: false });
          }
          if (data.done) {
            // ── Save assistant message to DB ───────────────────────────────────
            const { error: dbErr } = await adminSupabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullContent,
            });

            if (dbErr) {
              console.error("DB insert error:", dbErr.message);
            }

            // ── Update conversation timestamp ──────────────────────────────────
            await adminSupabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);

            sendEvent({ content: "", done: true, totalTokens: data.eval_count || 0 });
          }
        } catch (parseErr) {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (err) {
    console.error("Stream error:", err.message);
    sendEvent({ error: err.message });
  }

  res.end();
});

// ── POST /api/conversations/:id/title ─────────────────────────────────────────
// Update conversation title based on first user message
app.patch("/api/conversations/:id/title", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: "title required" });

  const { data, error } = await adminSupabase
    .from("conversations")
    .update({ title: title.slice(0, 80) })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NovaMind server running at http://localhost:${PORT}`);
  console.log(`   Ollama: ${OLLAMA_URL} (${DEFAULT_MODEL})`);
  console.log(`   Supabase: ${SUPABASE_URL}\n`);
});
