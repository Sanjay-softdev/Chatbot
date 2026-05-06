// server/index.js — Express backend for NovaMind
// Handles: chat streaming, JWT auth, web search, RAG (pgvector)
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// ── Config ─────────────────────────────────────────────────────────────────────
const PORT               = process.env.PORT || 3001;
const SUPABASE_URL       = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const OLLAMA_URL         = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL      = process.env.OLLAMA_MODEL    || "mistral:7b";
const SEARXNG_URL        = process.env.SEARXNG_URL     || "http://localhost:8080";
const EMBED_MODEL        = "nomic-embed-text";
const CHUNK_SIZE         = 1000;
const CHUNK_OVERLAP      = 150;

// ── App setup ──────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ── Admin Supabase client (bypasses RLS) ──────────────────────────────────────
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Auth middleware ────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing authorization header" });
  const token = auth.slice(7);
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
  req.user = user;
  next();
}

// ── RAG helpers ────────────────────────────────────────────────────────────────
async function embedText(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
  const data = await res.json();
  return data.embedding; // float[]
}

function chunkText(text) {
  const chunks = [];
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + CHUNK_SIZE, clean.length);
    if (end < clean.length) {
      const bp = Math.max(clean.lastIndexOf("\n", end), clean.lastIndexOf(". ", end));
      if (bp > i + CHUNK_SIZE / 2) end = bp + 1;
    }
    const chunk = clean.slice(i, end).trim();
    if (chunk.length > 20) chunks.push(chunk);
    i += Math.max(end - i - CHUNK_OVERLAP, 1);
  }
  return chunks;
}

// ── GET /api/health ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", model: DEFAULT_MODEL, ollama: OLLAMA_URL })
);

// ── GET /api/ollama/status ─────────────────────────────────────────────────────
app.get("/api/ollama/status", async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    res.json({ available: true, models: data.models?.map(m => m.name) || [] });
  } catch {
    res.json({ available: false, models: [] });
  }
});

// ── generateSearchQuery: ask Ollama to pick the best search terms ─────────────
// Instead of sending the raw user message to SearXNG (which is often chatty/
// conversational), we ask the model to extract a concise, keyword-focused query.
async function generateSearchQuery(userMessage) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: `You are a search query optimizer. Given a user message, output ONLY the ideal web search query — no explanation, no quotes, no punctuation at the end, just the raw search terms.

Examples:
User: "what is the latest news about Elon Musk and Tesla?"
Query: Elon Musk Tesla latest news 2025

User: "can you explain how black holes form?"
Query: how do black holes form explanation

User: "${userMessage}"
Query:`,
        stream: false,
        options: { temperature: 0.1, num_predict: 40 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json();
    const q = data.response?.trim().replace(/["']/g, "").split("\n")[0].trim();
    return q || userMessage;
  } catch (e) {
    console.error("generateSearchQuery failed:", e.message);
    return userMessage; // fallback to raw message
  }
}

// ── searchWeb: generate query → fetch SearXNG ─────────────────────────────────
async function searchWeb(userMessage) {
  const searchQuery = await generateSearchQuery(userMessage);
  console.log(`🔍 Search query: "${searchQuery}" (from: "${userMessage.slice(0, 60)}...")`);
  const url = `${SEARXNG_URL}/search?q=${encodeURIComponent(searchQuery)}&format=json&categories=general&language=en`;
  const r = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": "NovaMind/1.0" } });
  if (!r.ok) throw new Error(`SearXNG returned ${r.status}`);
  const data = await r.json();
  const results = (data.results || []).slice(0, 6).map(item => ({
    title: item.title || "", snippet: item.content || item.title || "", url: item.url || "",
  }));
  return { searchQuery, results };
}

// ── GET /api/search ────────────────────────────────────────────────────────────
app.get("/api/search", requireAuth, async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "q param required" });
  try {
    const { searchQuery, results } = await searchWeb(q);
    res.json({ userQuery: q, searchQuery, results, engine: "searxng" });
  } catch (e) {
    console.error("SearXNG error:", e.message);
    res.status(502).json({ error: `SearXNG unavailable: ${e.message}` });
  }
});

// ── POST /api/rag/ingest ───────────────────────────────────────────────────────
// Accepts { title, text }, chunks the text, embeds each chunk, stores in DB
// Responds with SSE progress events: { total, done } then { complete, ... }
app.post("/api/rag/ingest", requireAuth, async (req, res) => {
  const { title, text } = req.body;
  const userId = req.user.id;
  if (!title || !text) return res.status(400).json({ error: "title and text required" });

  // Create parent document record
  const { data: doc, error: docErr } = await adminSupabase
    .from("documents")
    .insert({ user_id: userId, title, char_count: text.length })
    .select().single();
  if (docErr) return res.status(500).json({ error: docErr.message });

  const chunks = chunkText(text);

  // Stream progress via SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();
  const prog = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  prog({ total: chunks.length, done: 0, documentId: doc.id });

  let failed = 0;
  for (let idx = 0; idx < chunks.length; idx++) {
    try {
      const embedding = await embedText(chunks[idx]);
      await adminSupabase.from("document_chunks").insert({
        document_id: doc.id, content: chunks[idx], chunk_index: idx,
        embedding: JSON.stringify(embedding),
      });
      prog({ total: chunks.length, done: idx + 1 });
    } catch (e) {
      console.error(`Chunk ${idx} error:`, e.message);
      failed++;
    }
  }
  prog({ complete: true, documentId: doc.id, chunks: chunks.length, failed });
  res.end();
});

// ── GET /api/rag/documents ─────────────────────────────────────────────────────
app.get("/api/rag/documents", requireAuth, async (req, res) => {
  const { data, error } = await adminSupabase
    .from("documents")
    .select("id, title, char_count, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ documents: data });
});

// ── DELETE /api/rag/documents/:id ─────────────────────────────────────────────
app.delete("/api/rag/documents/:id", requireAuth, async (req, res) => {
  const { error } = await adminSupabase
    .from("documents").delete()
    .eq("id", req.params.id).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── POST /api/chat/stream ──────────────────────────────────────────────────────
app.post("/api/chat/stream", requireAuth, async (req, res) => {
  const { messages, conversationId, model = DEFAULT_MODEL, systemPrompt, userMessage, reasoningMode, ragMode, webSearchMode } = req.body;
  if (!messages?.length || !conversationId)
    return res.status(400).json({ error: "messages and conversationId required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const send = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);

  // ── Save user message (service role → bypasses RLS) ────────────────────────
  if (userMessage) {
    const { data: savedMsg, error: msgErr } = await adminSupabase
      .from("messages")
      .insert({ conversation_id: conversationId, role: "user", content: userMessage })
      .select().single();
    if (msgErr) { send({ error: "Failed to save message: " + msgErr.message }); res.end(); return; }
    send({ userSaved: savedMsg });
    await adminSupabase.from("conversations")
      .update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }

  // ── Web search: model → query → SearXNG → context ─────────────────────────
  let webContext = "";
  let webSearchQuery = "";
  if (webSearchMode && userMessage) {
    send({ searching: true });
    try {
      const { searchQuery, results } = await searchWeb(userMessage);
      webSearchQuery = searchQuery;
      if (results.length) {
        send({ webSearchQuery: searchQuery, webSources: results });
        webContext = results.map((x, i) => `[Source ${i+1}] ${x.title}\n${x.snippet}`).join("\n\n");
        console.log(`🌐 Web context: ${results.length} results for "${searchQuery}"`);
      } else {
        send({ webSearchQuery: searchQuery, webSources: [] });
      }
    } catch (e) { console.error("Web search error:", e.message); }
  }

  // ── RAG: embed query → similarity search → inject context ─────────────────
  let ragContext = "";
  let ragSources = [];
  if (ragMode && userMessage) {
    try {
      const qEmbed = await embedText(userMessage);
      const { data: chunks } = await adminSupabase.rpc("match_chunks", {
        query_embedding: JSON.stringify(qEmbed),
        match_count: 5,
        filter_user_id: req.user.id,
      });
      if (chunks?.length) {
        ragSources = [...new Map(chunks.map(c => [c.document_id, c.title])).entries()]
          .map(([id, title]) => ({ id, title }));
        ragContext = "## Knowledge Base Context\n\n"
          + chunks.map((c, i) => `[${i+1}] From "${c.title}":\n${c.content}`).join("\n\n---\n\n");
        send({ ragSources });
        console.log(`RAG: ${chunks.length} chunks from ${ragSources.length} document(s)`);
      }
    } catch (e) { console.error("RAG retrieval error:", e.message); }
  }

  // ── Build Ollama messages ─────────────────────────────────────────────────
  let ollamaMessages = messages.map(m => ({ role: m.role, content: m.content }));
  const lastUserIdx = ollamaMessages.map(m => m.role).lastIndexOf("user");

  // Inject web context first (if any), then RAG context
  if ((webContext || ragContext) && lastUserIdx !== -1) {
    const originalContent = ollamaMessages[lastUserIdx].content;
    let injected = "";
    if (webContext) injected += `## Web Search Results (searched: "${webSearchQuery}")\n\n${webContext}\n\n`;
    if (ragContext) injected += `${ragContext}\n\n`;
    ollamaMessages[lastUserIdx] = {
      role: "user",
      content: `${injected}---\n\nUsing the above context, please answer:\n${originalContent}`,
    };
  }

  const WEB_SYSTEM = `You are an intelligent research assistant with access to real-time web search results.
- Synthesize information from the search results to answer accurately
- Always cite your sources using [Source N] notation
- Mention if results are recent/dated where relevant
- If the search results don't fully answer the question, say so and add what you know`;

  const RAG_SYSTEM = `You are a knowledgeable assistant with access to the user's personal knowledge base.
- Prioritize information from the provided context over your training data
- Always cite which document you used: "According to [document name]..."
- If context is insufficient, say so clearly and supplement with your own knowledge`;

  const activeSystem = webContext ? WEB_SYSTEM : ragContext ? RAG_SYSTEM : systemPrompt;
  let fullContent = "";

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          ...(activeSystem ? [{ role: "system", content: activeSystem }] : []),
          ...ollamaMessages,
        ],
        stream: true,
        options: {
          temperature: webContext ? 0.3 : ragMode ? 0.2 : systemPrompt ? (reasoningMode ? 0.4 : 0.3) : 0.7,
          top_p: 0.9,
          num_predict: systemPrompt ? 8192 : webContext ? 4096 : 2048,
        },
      }),
    });

    if (!ollamaRes.ok) {
      send({ error: `Ollama error: ${await ollamaRes.text()}` });
      res.end(); return;
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          if (d.message?.content) { fullContent += d.message.content; send({ content: d.message.content, done: false }); }
          if (d.done) {
            await adminSupabase.from("messages").insert({ conversation_id: conversationId, role: "assistant", content: fullContent });
            await adminSupabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
            send({ content: "", done: true, totalTokens: d.eval_count || 0 });
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error("Stream error:", err.message);
    send({ error: err.message });
  }
  res.end();
});

// ── PATCH /api/conversations/:id/title ────────────────────────────────────────
app.patch("/api/conversations/:id/title", requireAuth, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const { data, error } = await adminSupabase
    .from("conversations").update({ title: title.slice(0, 80) })
    .eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NovaMind server  →  http://localhost:${PORT}`);
  console.log(`   LLM:     ${OLLAMA_URL} (${DEFAULT_MODEL})`);
  console.log(`   Embed:   ${EMBED_MODEL}`);
  console.log(`   DB:      ${SUPABASE_URL}\n`);
});
