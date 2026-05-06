import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, loadConversations, createConversation, loadMessages, deleteConversation, updateConversationTitle, getProfile, getToken } from "../supabase.js";
import { Icon, ICONS, Avatar, MessageRow, WelcomeScreen } from "./ChatComponents.jsx";

let _id = 1000;
const uid = () => String(++_id);

const REASONING_SYSTEM_PROMPT = `You are a patient, friendly tutor. Explain everything step-by-step as if talking to a curious beginner with no technical background. Use simple everyday analogies, avoid jargon, and if you must use a technical term define it immediately. Break your answer into clearly labelled sections: 1) Simple answer, 2) How it works (with an analogy), 3) Why it matters, 4) A quick example. Be thorough but keep each section easy to follow.`;

function groupByDate(convs) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  return convs.reduce((g, c) => {
    const d = new Date(c.updated_at).toDateString();
    const key = d === today ? "Today" : d === yesterday ? "Yesterday" : "Older";
    g[key] = [...(g[key] || []), c];
    return g;
  }, {});
}

export default function ChatbotUI({ session }) {
  const [convs, setConvs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDrop, setShowDrop] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // ── New feature state ────────────────────────────────────────
  const [reasoningMode, setReasoningMode] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [attachments, setAttachments] = useState([]); // [{name, content}]
  const [searching, setSearching] = useState(false);
  const msgEndRef = useRef(null);
  const taRef = useRef(null);
  const abortRef = useRef(null);
  const fileRef = useRef(null);
  const chatScrollRef = useRef(null);
  const userScrolledUp = useRef(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Load conversations + profile
  useEffect(() => {
    Promise.all([loadConversations(), getProfile()])
      .then(([c, p]) => { setConvs(c || []); setProfile(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load messages on conversation switch
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    loadMessages(activeId).then(msgs =>
      setMessages(msgs.map(m => ({ ...m, streaming: false })))
    );
  }, [activeId]);

  // Only auto-scroll to bottom if user hasn't manually scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Detect user scroll — if near bottom, re-enable auto-scroll
  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom > 120) {
      userScrolledUp.current = true;
      setShowScrollBtn(true);
    } else {
      userScrolledUp.current = false;
      setShowScrollBtn(false);
    }
  }, []);

  const scrollToBottom = () => {
    userScrolledUp.current = false;
    setShowScrollBtn(false);
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const userInitials = (profile?.full_name || session?.user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const newChat = async () => {
    try {
      const conv = await createConversation("New conversation");
      setConvs(p => [conv, ...p]);
      setActiveId(conv.id);
      setMessages([]);
    } catch (e) { setError(e.message); }
  };

  const switchChat = (id) => {
    if (streaming) return;
    setActiveId(id);
  };

  const delChat = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConvs(p => p.filter(c => c.id !== id));
      if (activeId === id) { setActiveId(null); setMessages([]); }
    } catch (e) { setError(e.message); }
  };

  // ── Attachment handler ──────────────────────────────────────
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments(a => [...a, { name: file.name, content: e.target.result, type: file.type }]);
      };
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json") || file.name.endsWith(".csv"))
        reader.readAsText(file);
      else reader.readAsDataURL(file);
    });
  };

  const send = useCallback(async (text) => {
    let t = (text || input).trim();
    if (!t && attachments.length === 0) return;
    if (streaming) return;
    setError("");
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    // Build message text with attachment content appended
    if (attachments.length > 0) {
      const fileTexts = attachments.map(a =>
        a.content.startsWith("data:") ? `[Attached file: ${a.name}]` : `\n\n---\nFile: ${a.name}\n\`\`\`\n${a.content}\n\`\`\``
      ).join("");
      t = (t ? t + fileTexts : fileTexts.trim());
    }
    setAttachments([]);

    // Web search: fetch results and prepend context
    let webContext = "";
    if (webSearchMode) {
      setSearching(true);
      try {
        const token = await getToken();
        const r = await fetch(`/api/search?q=${encodeURIComponent(t)}`, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await r.json();
        if (data.results?.length) {
          webContext = "[Web search results]\n" + data.results.map((x, i) => `${i+1}. ${x.title}: ${x.snippet}`).join("\n") + "\n\nUsing the above context, answer: ";
        }
      } catch { /* ignore search errors */ }
      setSearching(false);
    }

    // Create conversation if none active
    let convId = activeId;
    const isFirst = !convId || messages.length === 0;
    if (!convId) {
      try {
        const conv = await createConversation("New conversation");
        setConvs(p => [conv, ...p]);
        setActiveId(conv.id);
        convId = conv.id;
      } catch (e) { setError(e.message); return; }
    }

    // ── Optimistically show user message in UI right away ───────────────────────
    // (Server will save to DB and send back the real id via userSaved SSE event)
    const tempId = uid();
    setMessages(p => [...p, { id: tempId, role: "user", content: t, streaming: false, created_at: new Date().toISOString() }]);

    // Streaming placeholder
    const streamId = uid();
    setMessages(p => [...p, { id: streamId, role: "assistant", content: "", streaming: true }]);
    setStreaming(true);

    // Update title on first message
    if (isFirst) {
      const title = t.length > 60 ? t.slice(0, 60) + "…" : t;
      updateConversationTitle(convId, title).then(updated => {
        setConvs(p => p.map(c => c.id === convId ? { ...c, title: updated.title } : c));
      });
    }

    // Stream from backend
    try {
      const token = await getToken();
      // Build history: all previous messages (the user message will be added server-side)
      const history = [...messages, { id: tempId, role: "user", content: t, streaming: false }];
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          messages: webContext
            ? [...history.slice(0,-1), { ...history[history.length-1], content: webContext + t }]
            : history,
          conversationId: convId,
          model: "mistral:7b",
          systemPrompt: reasoningMode ? REASONING_SYSTEM_PROMPT : undefined,
          userMessage: t,   // server saves this to DB with service role key
        }),
        signal: ctrl.signal,
      });

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const d = JSON.parse(raw);
            if (d.error) { setError(d.error); break; }
            // Server confirmed user message saved — update tempId to real DB id
            if (d.userSaved) {
              setMessages(p => p.map(m => m.id === tempId ? { ...m, id: d.userSaved.id, created_at: d.userSaved.created_at } : m));
            }
            if (d.content) {
              fullContent += d.content;
              setMessages(p => p.map(m => m.id === streamId ? { ...m, content: fullContent } : m));
            }
            if (d.done) {
              setMessages(p => p.map(m => m.id === streamId ? { ...m, streaming: false } : m));
              // Refresh conversation order
              loadConversations().then(c => setConvs(c || []));
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setError("Connection error: " + e.message);
        setMessages(p => p.filter(m => m.id !== streamId));
      }
    }
    setStreaming(false);
  }, [input, streaming, activeId, messages, attachments, webSearchMode, reasoningMode]);

  const logout = async () => { await supabase.auth.signOut(); };

  const filtered = convs.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const grouped = groupByDate(filtered);
  const SW = 258;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;}
        body{font-family:'DM Sans',sans-serif;background:#0e0e14;color:#e8e8f0;overflow:hidden;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        textarea{scrollbar-width:none;}textarea::-webkit-scrollbar{display:none;}
      `}</style>

      {/* Error toast */}
      {error && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 18px", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans',sans-serif", display: "flex", gap: 10, alignItems: "center", animation: "fadeUp 0.2s ease" }}>
          ⚠ {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      )}

      <div style={{ display: "flex", height: "100vh", background: "#0e0e14" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: sidebarOpen ? SW : 0, flexShrink: 0, background: "#12121a", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.22s ease" }}>

          {/* Sidebar header */}
          <div style={{ padding: "14px 12px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, padding: "6px 8px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
              </div>
              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 16, color: "#e8e8f0", letterSpacing: "-0.01em" }}>NovaMind</span>
            </div>
            <button onClick={newChat} title="New chat" style={{ width: 32, height: 32, background: "none", border: "none", color: "#6b6b85", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#d4d4e8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b6b85"; }}>
              <Icon d={ICONS.plus} size={18} />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: "0 12px 8px", flexShrink: 0, position: "relative" }}>
            <span style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "#4a4a62", pointerEvents: "none" }}><Icon d={ICONS.search} size={14} /></span>
            <input id="sidebar-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats…"
              style={{ width: "100%", padding: "8px 10px 8px 32px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, color: "#d4d4e8", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif" }} />
          </div>

          {/* New chat button */}
          <button id="btn-new-chat" onClick={newChat} style={{ margin: "0 12px 10px", padding: "9px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, color: "#818cf8", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}>
            <Icon d={ICONS.plus} size={16} />New chat
          </button>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {loading && <div style={{ padding: 20, textAlign: "center", color: "#4a4a62", fontSize: 13 }}>Loading…</div>}
            {!loading && convs.length === 0 && (
              <div style={{ padding: "20px 12px", color: "#4a4a62", fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>No conversations yet.<br />Start a new chat!</div>
            )}
            {["Today", "Yesterday", "Older"].map(label => {
              const items = grouped[label];
              if (!items?.length) return null;
              return (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a52", textTransform: "uppercase", letterSpacing: "0.07em", padding: "12px 8px 5px" }}>{label}</div>
                  {items.map(item => (
                    <div key={item.id} id={`conv-${item.id}`} onClick={() => switchChat(item.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, cursor: streaming ? "not-allowed" : "pointer", marginBottom: 1, background: activeId === item.id ? "rgba(99,102,241,0.1)" : "none", border: activeId === item.id ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent", transition: "all 0.12s", position: "relative" }}
                      onMouseEnter={e => { if (activeId !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.querySelector(".ha").style.display = "flex"; }}
                      onMouseLeave={e => { if (activeId !== item.id) e.currentTarget.style.background = "none"; e.currentTarget.querySelector(".ha").style.display = "none"; }}>
                      <Icon d={ICONS.chat} size={14} />
                      <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: activeId === item.id ? "#c4c4dc" : "#7c7c9a" }}>{item.title}</span>
                      <div className="ha" style={{ display: "none", gap: 3 }}>
                        <button id={`del-${item.id}`} onClick={e => delChat(e, item.id)} style={{ width: 22, height: 22, background: "none", border: "none", color: "#6b6b85", cursor: "pointer", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon d={ICONS.trash} size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* User footer */}
          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, position: "relative" }}>
            <div id="user-menu-btn" onClick={() => setShowDrop(d => !d)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Avatar initials={userInitials} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#d4d4e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.full_name || session?.user?.email?.split("@")[0] || "User"}</div>
                <div style={{ fontSize: 11, color: "#4a4a62" }}>mistral:7b · Local</div>
              </div>
              <Icon d={ICONS.dots} size={15} strokeWidth={2.5} />
            </div>

            {showDrop && (
              <div style={{ position: "absolute", bottom: 68, left: 12, right: 12, background: "#1c1c26", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, overflow: "hidden", zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "slideUp 0.15s ease" }}>
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar initials={userInitials} size={28} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#d4d4e8" }}>{profile?.full_name || "User"}</div>
                    <div style={{ fontSize: 11, color: "#4a4a62" }}>{session?.user?.email}</div>
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                <button id="btn-logout" onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13.5, width: "100%", fontFamily: "'DM Sans',sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <Icon d={ICONS.logout} size={15} />Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0e0e14" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button id="btn-toggle-sidebar" onClick={() => setSidebarOpen(o => !o)} style={{ width: 32, height: 32, background: "none", border: "none", color: "#6b6b85", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#d4d4e8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b6b85"; }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#d4d4e8", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
                mistral:7b
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#3a3a52", fontFamily: "'DM Sans',sans-serif" }}>🔒 100% Local & Private</span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            style={{ flex: 1, overflowY: "auto", padding: "28px 0", position: "relative" }}
          >
            <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 28 }}>
              {messages.length === 0
                ? <WelcomeScreen onSuggest={send} />
                : messages.map(m => (
                  <MessageRow key={m.id} msg={m} userInitials={userInitials}
                    onRetry={() => {
                      const lastUser = [...messages].reverse().find(x => x.role === "user");
                      if (lastUser) {
                        setMessages(p => p.filter(x => x.id !== m.id));
                        send(lastUser.content);
                      }
                    }} />
                ))}
              <div ref={msgEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                title="Scroll to latest message"
                style={{
                  position: "sticky",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  background: "rgba(99,102,241,0.18)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  borderRadius: 20,
                  color: "#818cf8",
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  animation: "fadeUp 0.2s ease",
                  zIndex: 10,
                  whiteSpace: "nowrap",
                }}
              >
                ↓ Latest message
              </button>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 20px 18px", flexShrink: 0 }}>
            <div style={{ maxWidth: 740, margin: "0 auto" }}>
              {/* Hidden file input */}
              <input ref={fileRef} type="file" multiple accept="*/*" style={{ display:"none" }}
                onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />

              <div style={{ background: "#181820", border: `1px solid ${(reasoningMode||webSearchMode) ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.09)"}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.3)", transition:"border-color 0.2s" }}>

                {/* ── Feature toggle row ── */}
                <div style={{ display:"flex", gap:6, padding:"10px 14px 0", flexWrap:"wrap" }}>
                  {/* Attach */}
                  <button id="btn-attach" onClick={() => fileRef.current?.click()}
                    title="Attach a file"
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"#9ca3af", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(99,102,241,0.12)";e.currentTarget.style.color="#818cf8";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#9ca3af";}}>
                    <Icon d={ICONS.attach} size={13}/> Attach
                  </button>

                  {/* Web Search toggle */}
                  <button id="btn-web-search" onClick={() => setWebSearchMode(m=>!m)}
                    title="Toggle web search context"
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, border:`1px solid ${webSearchMode?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.1)"}`, background:webSearchMode?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.04)", color:webSearchMode?"#4ade80":"#9ca3af", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
                    onMouseEnter={e=>{if(!webSearchMode){e.currentTarget.style.background="rgba(34,197,94,0.08)";e.currentTarget.style.color="#4ade80";}}}
                    onMouseLeave={e=>{if(!webSearchMode){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#9ca3af";}}}
                    >
                    {searching
                      ? <div style={{width:11,height:11,border:"2px solid rgba(74,222,128,0.3)",borderTopColor:"#4ade80",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                      : <Icon d={ICONS.globe} size={13}/>}
                    {webSearchMode ? "Search ON" : "Search"}
                  </button>

                  {/* Reasoning toggle */}
                  <button id="btn-reasoning" onClick={() => setReasoningMode(m=>!m)}
                    title="Layman reasoning mode: detailed, plain-English explanations"
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, border:`1px solid ${reasoningMode?"rgba(168,85,247,0.5)":"rgba(255,255,255,0.1)"}`, background:reasoningMode?"rgba(168,85,247,0.12)":"rgba(255,255,255,0.04)", color:reasoningMode?"#c084fc":"#9ca3af", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
                    onMouseEnter={e=>{if(!reasoningMode){e.currentTarget.style.background="rgba(168,85,247,0.08)";e.currentTarget.style.color="#c084fc";}}}
                    onMouseLeave={e=>{if(!reasoningMode){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#9ca3af";}}}
                    >
                    <Icon d={ICONS.bolt} size={13}/>{reasoningMode ? "Reasoning ON" : "Reason"}
                  </button>
                </div>

                {/* ── Attachment chip strip ── */}
                {attachments.length > 0 && (
                  <div style={{ display:"flex", gap:6, padding:"8px 14px 0", flexWrap:"wrap" }}>
                    {attachments.map((a,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:20, fontSize:11.5, color:"#818cf8", fontFamily:"'DM Sans',sans-serif" }}>
                        📎 {a.name}
                        <button onClick={()=>setAttachments(arr=>arr.filter((_,j)=>j!==i))} style={{ background:"none",border:"none",color:"#6b6b85",cursor:"pointer",fontSize:13,lineHeight:1,padding:0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Textarea + Send ── */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "10px 14px 12px" }}>
                  <textarea
                    id="chat-input"
                    ref={taRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={reasoningMode ? "Ask anything — I'll explain it simply… (Reasoning ON)" : webSearchMode ? "Search + ask… (Web Search ON)" : "Message NovaMind… (Enter to send, Shift+Enter for newline)"}
                    rows={1}
                    disabled={streaming}
                    style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e8e8f0", fontSize: 14.5, fontFamily: "'DM Sans',sans-serif", resize: "none", lineHeight: 1.65, padding: "3px 0", maxHeight: 160, overflowY: "auto", opacity: streaming ? 0.6 : 1 }}
                  />
                  <button
                    id="btn-send"
                    onClick={() => send()}
                    disabled={(!input.trim() && attachments.length===0) || streaming}
                    style={{ width: 38, height: 38, background: (input.trim()||attachments.length) && !streaming ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, color: (input.trim()||attachments.length) && !streaming ? "#fff" : "#4a4a62", cursor: (input.trim()||attachments.length) && !streaming ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0, boxShadow: (input.trim()||attachments.length) && !streaming ? "0 4px 12px rgba(99,102,241,0.4)" : "none" }}>
                    {streaming
                      ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      : <Icon d={ICONS.send} size={15} fill={(input.trim()||attachments.length) ? "white" : "none"} strokeWidth={(input.trim()||attachments.length) ? 0 : 1.75} />}
                  </button>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 11.5, color: "#3a3a52", marginTop: 8, fontFamily: "'DM Sans',sans-serif" }}>
                {reasoningMode && <span style={{color:"#a855f7"}}>🧠 Reasoning ON · </span>}
                {webSearchMode && <span style={{color:"#22c55e"}}>🌐 Web Search ON · </span>}
                Powered by Mistral 7B via Ollama · Stored locally in Supabase · Fully private
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Click-outside to close dropdown */}
      {showDrop && <div onClick={() => setShowDrop(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />}
    </>
  );
}
