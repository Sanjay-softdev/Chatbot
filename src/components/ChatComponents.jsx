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
  monitor: ["M2 3h20v14H2z", "M8 21h8", "M12 17v4"],
  crown: "M2 20h20M5 20V9l7-5 7 5v11",
  key: ["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"],
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

export const SUGGESTIONS = [
  { emoji: "⚛", title: "Explain quantum computing", sub: "in plain language" },
  { emoji: "🐍", title: "Write a Python script", sub: "to scrape a website" },
  { emoji: "✉", title: "Draft a professional email", sub: "to request a meeting" },
  { emoji: "💡", title: "Give me 5 startup ideas", sub: "for the AI era" },
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

export function MessageRow({ msg, onRetry, userInitials }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  const formatted = (msg.content || "")
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 14px;overflow-x:auto;font-family:monospace;font-size:13px;margin:8px 0;line-height:1.5">${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g, "<code style=\"background:rgba(99,102,241,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px\">$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

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
        <div style={{ maxWidth: isUser ? "78%" : "100%", background: isUser ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "transparent", color: "#e8e8f0", padding: isUser ? "11px 16px" : "2px 0", borderRadius: isUser ? "18px 18px 4px 18px" : 0, fontSize: 14.5, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}
          dangerouslySetInnerHTML={{ __html: formatted }} />
        {msg.streaming && <TypingDots />}
        {!isUser && !msg.streaming && msg.content && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {[
              { icon: ICONS.copy, label: copied ? "Copied!" : "Copy", action: () => { navigator.clipboard?.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1800); } },
              { icon: ICONS.thumbUp, label: liked ? "Liked" : "Like", action: () => setLiked(l => !l) },
              { icon: ICONS.refresh, label: "Retry", action: onRetry },
            ].map(({ icon, label, action }) => (
              <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: (label === "Liked" || label === "Copied!") ? "#818cf8" : "#7c7c9a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
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
      <h1 style={{ fontSize: 30, fontWeight: 700, color: "#eeeef5", margin: 0, fontFamily: "'Fraunces',serif", letterSpacing: "-0.02em" }}>What can I help with?</h1>
      <p style={{ fontSize: 15, color: "#6b6b85", marginTop: 8, marginBottom: 32, fontFamily: "'DM Sans',sans-serif" }}>Ask me anything — or pick a suggestion below</p>
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
