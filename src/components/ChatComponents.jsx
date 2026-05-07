import { useState } from "react";

export const Icon = ({ d, size = 16, strokeWidth = 1.75, fill = "none", viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export const ICONS = {
  plus: "M12 5v14M5 12h14",
  search: ["M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z", "M16 16l3.5 3.5"],
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"],
  send: "M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z",
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  copy: ["M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2", "M4 10a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H4z"],
  thumbUp: ["M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z", "M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
  chevDown: "M6 9l6 6 6-6",
  dots: ["M12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M12 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"],
  close: "M18 6 6 18M6 6l12 12",
  attach: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
  globe: ["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z", "M2 12h20", "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"],
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  share: ["M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", "M16 6l-4-4-4 4", "M12 2v13"],
  check: "M20 6L9 17l-5-5",
  externalLink: ["M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", "M15 3h6v6", "M10 14L21 3"],
};

export const SUGGESTIONS = [
  { emoji: "🏢", title: "Team Everest policies", sub: "internal guidelines" },
  { emoji: "📊", title: "Project status update", sub: "from internal records" },
  { emoji: "🔐", title: "Data security protocols", sub: "for Team Everest" },
  { emoji: "⚡", title: "Quick search", sub: "web news & trends" },
];

export function Avatar({ initials = "AI", size = 32, gradient = "linear-gradient(135deg,#6366f1,#3b82f6)" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'DM Sans',sans-serif", letterSpacing: "-0.01em" }}>
      {initials}
    </div>
  );
}

export function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: "bounce 1.1s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

// ── Code block with language label + copy button (ChatGPT style) ──────────────
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", margin: "10px 0", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 11.5, color: "#6b6b85", fontFamily: "monospace", textTransform: "lowercase" }}>{lang || "code"}</span>
        <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: copied ? "#4ade80" : "#6b6b85", cursor: "pointer", fontSize: 11.5, fontFamily: "'DM Sans',sans-serif", padding: "2px 6px", borderRadius: 6, transition: "color 0.15s" }}>
          <Icon d={copied ? ICONS.check : ICONS.copy} size={12} />
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      {/* code body */}
      <pre style={{ margin: 0, padding: "14px 16px", background: "rgba(0,0,0,0.35)", overflowX: "auto", fontSize: 13, lineHeight: 1.6, color: "#e2e8f0", fontFamily: "'Fira Code','Cascadia Code',monospace" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Markdown renderer (supports code blocks, headers, lists, bold, italic) ────
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fenceMatch = line.match(/^```(\w*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={key++} code={codeLines.join("\n")} lang={lang} />);
      i++; // skip closing ```
      continue;
    }

    // Heading (order matters: most hashes first)
    const h5 = line.match(/^##### (.+)/);
    const h4 = line.match(/^#### (.+)/);
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) { elements.push(<h2 key={key++} style={{ fontSize: 19, fontWeight: 700, color: "#eeeef5", margin: "16px 0 6px", fontFamily: "'DM Sans',sans-serif" }} dangerouslySetInnerHTML={{ __html: inlineFormat(h1[1]) }} />); i++; continue; }
    if (h2) { elements.push(<h3 key={key++} style={{ fontSize: 16, fontWeight: 700, color: "#d4d4e8", margin: "14px 0 4px", fontFamily: "'DM Sans',sans-serif" }} dangerouslySetInnerHTML={{ __html: inlineFormat(h2[1]) }} />); i++; continue; }
    if (h3) { elements.push(<div key={key++} style={{ fontSize: 14.5, fontWeight: 700, color: "#c4c4dc", margin: "12px 0 3px", fontFamily: "'DM Sans',sans-serif" }} dangerouslySetInnerHTML={{ __html: inlineFormat(h3[1]) }} />); i++; continue; }
    if (h4) { elements.push(<div key={key++} style={{ fontSize: 14, fontWeight: 600, color: "#b4b4cc", margin: "10px 0 2px", fontFamily: "'DM Sans',sans-serif" }} dangerouslySetInnerHTML={{ __html: inlineFormat(h4[1]) }} />); i++; continue; }
    if (h5) { elements.push(<div key={key++} style={{ fontSize: 13.5, fontWeight: 600, color: "#9a9ab8", margin: "8px 0 2px", fontFamily: "'DM Sans',sans-serif" }} dangerouslySetInnerHTML={{ __html: inlineFormat(h5[1]) }} />); i++; continue; }

    // Bullet list
    if (line.match(/^[-*] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(<li key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: inlineFormat(lines[i].slice(2)) }} />);
        i++;
      }
      elements.push(<ul key={key++} style={{ paddingLeft: 20, margin: "6px 0", fontSize: 14.5, lineHeight: 1.7, color: "#d4d4e8" }}>{items}</ul>);
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(<li key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: inlineFormat(lines[i].replace(/^\d+\. /, "")) }} />);
        i++;
      }
      elements.push(<ol key={key++} style={{ paddingLeft: 20, margin: "6px 0", fontSize: 14.5, lineHeight: 1.7, color: "#d4d4e8" }}>{items}</ol>);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "12px 0" }} />);
      i++; continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={key++} style={{ height: 8 }} />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(<p key={key++} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: "#d4d4e8", fontFamily: "'DM Sans',sans-serif" }} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  return text
    .replace(/`([^`]+)`/g, `<code style="background:rgba(99,102,241,0.18);padding:2px 7px;border-radius:5px;font-family:'Fira Code',monospace;font-size:12.5px;color:#c4b5fd">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#eeeef5'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" style="color:#818cf8;text-decoration:underline">$1</a>`);
}

// ── Source cards shown when web search is used ────────────────────────────────
function SourceCards({ sources }) {
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#4a4a62", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>🌐 Sources</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, fontSize: 11.5, color: "#4ade80", textDecoration: "none", fontFamily: "'DM Sans',sans-serif", maxWidth: 200, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            <Icon d={ICONS.externalLink} size={10} />
            {s.title || new URL(s.url).hostname}
          </a>
        ))}
      </div>
    </div>
  );
}

export function MessageRow({ msg, onRetry, userInitials }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row", animation: "fadeUp 0.28s ease" }}>
      {isUser
        ? <Avatar initials={userInitials || "ME"} size={34} />
        : (
          <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
          </div>
        )}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {isUser ? (
          <div style={{ maxWidth: "78%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", padding: "11px 16px", borderRadius: "18px 18px 4px 18px", fontSize: 14.5, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif", whiteSpace: "pre-wrap" }}>
            {msg.content}
          </div>
        ) : (
          <div style={{ maxWidth: "100%", width: "100%" }}>
            {msg.streaming && !msg.content ? <TypingDots /> : renderMarkdown(msg.content || "")}
            {msg.sources && <SourceCards sources={msg.sources} />}
          </div>
        )}

        {/* Action buttons for assistant */}
        {!isUser && !msg.streaming && msg.content && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {[
              { icon: copied ? ICONS.check : ICONS.copy, label: copied ? "Copied!" : "Copy", action: () => { navigator.clipboard?.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1800); }, active: copied },
              { icon: ICONS.refresh, label: "Retry", action: onRetry, active: false },
            ].map(({ icon, label, action, active }) => (
              <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: active ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, color: active ? "#818cf8" : "#7c7c9a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.color = "#818cf8"; }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#7c7c9a"; } }}>
                <Icon d={icon} size={12} />{label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WelcomeScreen({ onSuggest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 24px 0", animation: "fadeUp 0.4s ease" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 8px 32px rgba(99,102,241,0.35)" }}>
        <svg width={30} height={30} viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 700, color: "#eeeef5", margin: 0, fontFamily: "'Fraunces',serif", letterSpacing: "-0.02em" }}>Everest Intelligence</h1>
      <p style={{ fontSize: 15, color: "#6b6b85", marginTop: 8, marginBottom: 32, fontFamily: "'DM Sans',sans-serif" }}>Your secure assistant for Team Everest documents & general chat</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 560 }}>
        {SUGGESTIONS.map(s => (
          <button key={s.title} onClick={() => onSuggest(`${s.title} ${s.sub}`)}
            style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, textAlign: "left", cursor: "pointer", transition: "all 0.18s", fontFamily: "'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#d4d4e8", marginBottom: 2 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#6b6b85" }}>{s.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
