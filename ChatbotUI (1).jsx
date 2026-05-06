import { useState, useRef, useEffect, useCallback } from "react";

// ── Lucide-style inline SVGs ──────────────────────────────────────────────────
const Icon = ({ d, size = 16, strokeWidth = 1.75, fill = "none", viewBox = "0 0 24 24", className = "" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  plus: "M12 5v14M5 12h14",
  search: ["M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z", "M16 16l3.5 3.5"],
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  edit: ["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"],
  send: "M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z",
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  monitor: ["M2 3h20v14H2z", "M8 21h8", "M12 17v4"],
  copy: ["M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2", "M4 10a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H4z"],
  thumbUp: ["M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z", "M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
  chevDown: "M6 9l6 6 6-6",
  share: ["M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", "M16 6l-4-4-4 4", "M12 2v13"],
  attach: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
  globe: ["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z", "M2 12h20", "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"],
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  close: "M18 6 6 18M6 6l12 12",
  dots: ["M12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M12 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"],
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  key: ["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"],
  crown: "M2 20h20M5 20V9l7-5 7 5v11",
};

// ── Data ──────────────────────────────────────────────────────────────────────
const MODELS = ["Nova 4o", "Nova 4o mini", "Nova o1", "Nova o3-pro"];
const SUGGESTIONS = [
  { emoji: "⚛", title: "Explain quantum computing", sub: "in plain language" },
  { emoji: "🐍", title: "Write a Python script", sub: "to scrape a website" },
  { emoji: "✉", title: "Draft a professional email", sub: "to request a meeting" },
  { emoji: "💡", title: "Give me 5 startup ideas", sub: "for the AI era" },
];
const BOT_REPLIES = [
  `Sure! Here's a clear breakdown:\n\n**Core Concept**\nThe idea rests on three pillars: simplicity, consistency, and feedback loops. When these align, the system becomes self-reinforcing.\n\n**Key Steps**\n1. Define your inputs and expected outputs clearly\n2. Build a feedback mechanism into each stage\n3. Iterate based on real data, not assumptions\n\nWant me to go deeper on any of these?`,
  `Great question! Let me walk you through it step by step.\n\nFirst, the fundamentals are simpler than they look. The apparent complexity usually comes from **layers of abstraction** built on top of basic principles.\n\nHere's what actually matters:\n• Start with the problem, not the solution\n• Validate assumptions early and cheaply\n• Measure what changes, ignore what doesn't\n\nShould I show you a concrete example?`,
  `Absolutely! Here's a concise answer:\n\nThe short version is that **context drives everything**. Without clear context, even the best tools produce mediocre results.\n\nPractically speaking:\n- Document your constraints first\n- Communicate intent, not just instructions\n- Review outputs against the original goal\n\nThis framework applies across almost every domain. Let me know if you'd like to explore a specific application.`,
];

const INIT_HISTORY = [
  { id: 1, title: "Building a React dashboard", date: "today" },
  { id: 2, title: "Python data analysis tips", date: "today" },
  { id: 3, title: "Marketing strategy for SaaS", date: "today" },
  { id: 4, title: "SQL performance tuning", date: "today" },
  { id: 5, title: "JavaScript async patterns", date: "yesterday" },
  { id: 6, title: "Resume writing assistance", date: "yesterday" },
  { id: 7, title: "Machine learning basics", date: "yesterday" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
let _id = 100;
const uid = () => ++_id;

function Avatar({ initials = "AK", size = 32, gradient = "linear-gradient(135deg,#6366f1,#3b82f6)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: gradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em"
    }}>{initials}</div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#6366f1",
          display: "inline-block",
          animation: "bounce 1.1s ease-in-out infinite",
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageRow({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  const formatted = msg.content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeUp 0.28s ease",
    }}>
      {isUser
        ? <Avatar initials="AK" size={34} />
        : (
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
        )
      }
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          maxWidth: isUser ? "78%" : "100%",
          background: isUser ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "transparent",
          color: "#e8e8f0",
          padding: isUser ? "11px 16px" : "2px 0",
          borderRadius: isUser ? "18px 18px 4px 18px" : 0,
          fontSize: 14.5, lineHeight: 1.65,
          fontFamily: "'DM Sans', sans-serif",
        }} dangerouslySetInnerHTML={{ __html: formatted }} />
        {!isUser && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {[
              { icon: ICONS.copy, label: copied ? "Copied!" : "Copy", action: () => { navigator.clipboard?.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1800); } },
              { icon: ICONS.thumbUp, label: liked ? "Liked" : "Like", action: () => setLiked(l => !l) },
              { icon: ICONS.refresh, label: "Retry", action: () => {} },
            ].map(({ icon, label, action }) => (
              <button key={label} onClick={action} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                color: label === "Liked" || label === "Copied!" ? "#818cf8" : "#7c7c9a",
                fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}>
                <Icon d={icon} size={12} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onSuggest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 0, padding: "40px 24px 0", animation: "fadeUp 0.4s ease" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        boxShadow: "0 8px 32px rgba(99,102,241,0.35)"
      }}>
        <svg width={30} height={30} viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 700, color: "#eeeef5", margin: 0, fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em" }}>
        What can I help with?
      </h1>
      <p style={{ fontSize: 15, color: "#6b6b85", marginTop: 8, marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>
        Ask me anything — or pick a suggestion below
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 560 }}>
        {SUGGESTIONS.map(s => (
          <button key={s.title} onClick={() => onSuggest(`${s.title} ${s.sub}`)}
            style={{
              padding: "14px 16px", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
              textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#d4d4e8", marginBottom: 2 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#6b6b85" }}>{s.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Panel (modal) ─────────────────────────────────────────────────────────────
function Panel({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease"
    }}>
      <div style={{
        background: "#16161e", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20, width: 520, maxHeight: "82vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        animation: "slideUp 0.22s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#e8e8f0", fontFamily: "'Fraunces', serif", letterSpacing: "-0.01em" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b6b85", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center" }}>
            <Icon d={ICONS.close} size={18} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 46, height: 26, borderRadius: 13,
      background: on ? "#6366f1" : "rgba(255,255,255,0.1)",
      border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
      transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", width: 20, height: 20, background: "#fff",
        borderRadius: "50%", top: 3, left: on ? 23 : 3,
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );
}

function SettingsRow({ label, desc, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <div style={{ fontSize: 14, color: "#d4d4e8", fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "#6b6b85", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#4a4a62", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 20, fontFamily: "'DM Sans', sans-serif" }}>{children}</div>;
}

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ open, onClose }) {
  const [memory, setMemory] = useState(true);
  const [webSearch, setWebSearch] = useState(true);
  const [codeExec, setCodeExec] = useState(false);
  const [suggested, setSuggested] = useState(true);
  const [trainData, setTrainData] = useState(false);
  return (
    <Panel open={open} onClose={onClose} title="Settings">
      <SectionTitle>Appearance</SectionTitle>
      <SettingsRow label="Theme" desc="Interface appearance">
        <select style={{ background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#d4d4e8", padding: "6px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
          <option>Dark</option><option>Light</option><option>System</option>
        </select>
      </SettingsRow>
      <SettingsRow label="Language">
        <select style={{ background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#d4d4e8", padding: "6px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
          <option>English</option><option>Tamil</option><option>Hindi</option>
        </select>
      </SettingsRow>
      <SettingsRow label="Font size">
        <select style={{ background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#d4d4e8", padding: "6px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
          <option>Small</option><option>Default</option><option>Large</option>
        </select>
      </SettingsRow>
      <SectionTitle>Features</SectionTitle>
      <SettingsRow label="Memory" desc="Remember info across conversations"><Toggle on={memory} onChange={setMemory} /></SettingsRow>
      <SettingsRow label="Web search" desc="Enable real-time search"><Toggle on={webSearch} onChange={setWebSearch} /></SettingsRow>
      <SettingsRow label="Code execution"><Toggle on={codeExec} onChange={setCodeExec} /></SettingsRow>
      <SettingsRow label="Suggested replies"><Toggle on={suggested} onChange={setSuggested} /></SettingsRow>
      <SectionTitle>Privacy</SectionTitle>
      <SettingsRow label="Improve model with my data" desc="Help train future versions"><Toggle on={trainData} onChange={setTrainData} /></SettingsRow>
      <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
        {["Clear all chats", "Delete account"].map(t => (
          <button key={t} style={{ padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t}</button>
        ))}
      </div>
    </Panel>
  );
}

// ── Account panel ─────────────────────────────────────────────────────────────
function AccountPanel({ open, onClose }) {
  const [twofa, setTwofa] = useState(false);
  return (
    <Panel open={open} onClose={onClose} title="My Account">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
        <Avatar initials="AK" size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#e8e8f0", fontFamily: "'Fraunces', serif" }}>Arun Kumar</div>
          <div style={{ fontSize: 13, color: "#6b6b85", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>arun.kumar@email.com</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "3px 10px", background: "rgba(99,102,241,0.15)", borderRadius: 20 }}>
            <Icon d={ICONS.crown} size={12} style={{ color: "#818cf8" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#818cf8", fontFamily: "'DM Sans', sans-serif" }}>Free Plan</span>
          </div>
        </div>
        <button style={{ padding: "6px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#d4d4e8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
      </div>
      <SectionTitle>Plan</SectionTitle>
      <div style={{ padding: 16, background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontWeight: 700, color: "#e8e8f0", fontFamily: "'Fraunces', serif", fontSize: 15 }}>Free Plan</span>
          <span style={{ fontSize: 12, color: "#818cf8", fontFamily: "'DM Sans', sans-serif" }}>Active</span>
        </div>
        <div style={{ fontSize: 12, color: "#6b6b85", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Limited to Nova 4o mini · Standard speed</div>
        <button style={{ width: "100%", padding: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Upgrade to Pro — $20/mo
        </button>
      </div>
      <SectionTitle>Security</SectionTitle>
      <SettingsRow label="Password">
        <button style={{ padding: "5px 12px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#d4d4e8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Change</button>
      </SettingsRow>
      <SettingsRow label="Two-factor authentication" desc="Add an extra layer of security"><Toggle on={twofa} onChange={setTwofa} /></SettingsRow>
    </Panel>
  );
}

// ── Sessions panel ────────────────────────────────────────────────────────────
function SessionsPanel({ open, onClose }) {
  const [sessions, setSessions] = useState([
    { id: 1, device: "Chrome on Windows", loc: "Chennai, India", time: "Active now", current: true },
    { id: 2, device: "Safari on iPhone 15", loc: "Mumbai, India", time: "2 hours ago" },
    { id: 3, device: "Firefox on macOS", loc: "Bangalore, India", time: "3 days ago" },
    { id: 4, device: "Android App", loc: "Delhi, India", time: "1 week ago" },
  ]);
  return (
    <Panel open={open} onClose={onClose} title="Active Sessions">
      <p style={{ fontSize: 13, color: "#6b6b85", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
        All devices where your account is currently signed in.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sessions.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#d4d4e8", fontFamily: "'DM Sans', sans-serif" }}>
                {s.current ? "🖥 " : s.device.includes("iPhone") || s.device.includes("Android") ? "📱 " : "💻 "}{s.device}
              </div>
              <div style={{ fontSize: 12, color: "#6b6b85", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{s.loc} · {s.time}</div>
            </div>
            {s.current
              ? <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(99,102,241,0.15)", color: "#818cf8", borderRadius: 20, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Current</span>
              : <button onClick={() => setSessions(prev => prev.filter(x => x.id !== s.id))} style={{ padding: "5px 12px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#7c7c9a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Revoke</button>
            }
          </div>
        ))}
      </div>
      <button onClick={() => setSessions(prev => prev.filter(s => s.current))} style={{ marginTop: 16, width: "100%", padding: "9px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        Revoke all other sessions
      </button>
    </Panel>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [history, setHistory] = useState(INIT_HISTORY);
  const [activeChatId, setActiveChatId] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modelIdx, setModelIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [panel, setPanel] = useState(null); // "settings" | "account" | "sessions"
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const msgEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const send = useCallback((text) => {
    const t = text?.trim() || input.trim();
    if (!t || isTyping) return;
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    const userMsg = { id: uid(), role: "user", content: t };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    if (messages.length === 0) {
      setHistory(prev => prev.map(h => h.id === activeChatId ? { ...h, title: t.length > 38 ? t.slice(0, 38) + "…" : t } : h));
    }
    setTimeout(() => {
      const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
      setMessages(prev => [...prev, { id: uid(), role: "assistant", content: reply }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 700);
  }, [input, isTyping, messages, activeChatId]);

  const newChat = () => {
    const id = uid();
    setHistory(prev => [{ id, title: "New conversation", date: "today" }, ...prev]);
    setActiveChatId(id);
    setMessages([]);
  };

  const switchChat = (id) => {
    setActiveChatId(id);
    setMessages([{ id: uid(), role: "assistant", content: `Switched to this conversation. How can I continue helping you?` }]);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
    if (activeChatId === id) { setMessages([]); setActiveChatId(null); }
  };

  const filteredToday = history.filter(h => h.date === "today" && h.title.toLowerCase().includes(searchVal.toLowerCase()));
  const filteredYesterday = history.filter(h => h.date === "yesterday" && h.title.toLowerCase().includes(searchVal.toLowerCase()));

  const SIDEBAR_W = 258;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { font-family: 'DM Sans', sans-serif; background: #0e0e14; color: #e8e8f0; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#0e0e14" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: sidebarOpen ? SIDEBAR_W : 0, flexShrink: 0,
          background: "#12121a", borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          transition: "width 0.22s ease",
        }}>
          {/* top */}
          <div style={{ padding: "14px 12px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, padding: "6px 8px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
              </div>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, color: "#e8e8f0", letterSpacing: "-0.01em" }}>NovaMind</span>
            </div>
            <button onClick={newChat} title="New chat" style={{ width: 32, height: 32, background: "none", border: "none", color: "#6b6b85", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#d4d4e8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b6b85"; }}>
              <Icon d={ICONS.plus} size={18} />
            </button>
          </div>

          {/* search */}
          <div style={{ padding: "0 12px 8px", flexShrink: 0, position: "relative" }}>
            <span style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "#4a4a62", pointerEvents: "none" }}>
              <Icon d={ICONS.search} size={14} />
            </span>
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Search chats…" style={{
              width: "100%", padding: "8px 10px 8px 32px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, color: "#d4d4e8", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif",
            }} />
          </div>

          {/* new chat btn */}
          <button onClick={newChat} style={{
            margin: "0 12px 10px", padding: "9px 12px",
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 10, color: "#818cf8", fontSize: 13.5, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
          >
            <Icon d={ICONS.plus} size={16} /> New chat
          </button>

          {/* history */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {[["Today", filteredToday], ["Yesterday", filteredYesterday]].map(([label, items]) => items.length > 0 && (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3a3a52", textTransform: "uppercase", letterSpacing: "0.07em", padding: "12px 8px 5px" }}>{label}</div>
                {items.map(item => (
                  <div key={item.id} onClick={() => switchChat(item.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                      borderRadius: 10, cursor: "pointer", marginBottom: 1,
                      background: activeChatId === item.id ? "rgba(99,102,241,0.1)" : "none",
                      border: activeChatId === item.id ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                      transition: "all 0.12s", position: "relative",
                    }}
                    onMouseEnter={e => { if (activeChatId !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.querySelector(".ha").style.display = "flex"; }}
                    onMouseLeave={e => { if (activeChatId !== item.id) e.currentTarget.style.background = "none"; e.currentTarget.querySelector(".ha").style.display = "none"; }}>
                    <Icon d={ICONS.chat} size={14} style={{ color: activeChatId === item.id ? "#818cf8" : "#4a4a62", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: activeChatId === item.id ? "#c4c4dc" : "#7c7c9a" }}>{item.title}</span>
                    <div className="ha" style={{ display: "none", gap: 3 }}>
                      <button onClick={e => deleteChat(e, item.id)} style={{ width: 22, height: 22, background: "none", border: "none", color: "#6b6b85", cursor: "pointer", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={ICONS.trash} size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* user footer */}
          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, position: "relative" }}>
            <div onClick={() => setShowDropdown(d => !d)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Avatar initials="AK" size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#d4d4e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Arun Kumar</div>
                <div style={{ fontSize: 11, color: "#4a4a62" }}>Free Plan</div>
              </div>
              <Icon d={ICONS.dots} size={15} strokeWidth={2.5} style={{ color: "#4a4a62" }} />
            </div>

            {/* dropdown */}
            {showDropdown && (
              <div style={{
                position: "absolute", bottom: 68, left: 12, right: 12,
                background: "#1c1c26", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 12, overflow: "hidden", zIndex: 50,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                animation: "slideUp 0.15s ease"
              }}>
                {[
                  { icon: ICONS.user, label: "My Account", action: () => { setPanel("account"); setShowDropdown(false); } },
                  { icon: ICONS.settings, label: "Settings", action: () => { setPanel("settings"); setShowDropdown(false); } },
                  { icon: ICONS.monitor, label: "Sessions", action: () => { setPanel("sessions"); setShowDropdown(false); } },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", color: "#9898b0", cursor: "pointer", fontSize: 13.5, width: "100%", fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#d4d4e8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9898b0"; }}>
                    <Icon d={icon} size={15} />{label}
                  </button>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13.5, width: "100%", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <Icon d={ICONS.logout} size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0e0e14" }}>

          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setSidebarOpen(o => !o)} style={{ width: 32, height: 32, background: "none", border: "none", color: "#6b6b85", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#d4d4e8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b6b85"; }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
              </button>
              <button onClick={() => setModelIdx(i => (i + 1) % MODELS.length)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#d4d4e8", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
                {MODELS[modelIdx]}
                <Icon d={ICONS.chevDown} size={14} strokeWidth={2.5} style={{ color: "#6b6b85" }} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#7c7c9a", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#d4d4e8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#7c7c9a"; }}>
                <Icon d={ICONS.share} size={14} /> Share
              </button>
              <button onClick={() => setPanel("settings")} style={{ width: 34, height: 34, background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#7c7c9a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#d4d4e8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#7c7c9a"; }}>
                <Icon d={ICONS.settings} size={16} />
              </button>
            </div>
          </div>

          {/* messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 0" }}>
            <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 28 }}>
              {messages.length === 0
                ? <WelcomeScreen onSuggest={send} />
                : messages.map(m => <MessageRow key={m.id} msg={m} />)
              }
              {isTyping && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", animation: "fadeUp 0.2s ease" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                  </div>
                  <TypingDots />
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
          </div>

          {/* input */}
          <div style={{ padding: "12px 20px 18px", flexShrink: 0 }}>
            <div style={{ maxWidth: 740, margin: "0 auto" }}>
              <div style={{ background: "#181820", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, overflow: "hidden", transition: "border-color 0.15s", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                {/* toolbar */}
                <div style={{ display: "flex", gap: 6, padding: "10px 12px 0" }}>
                  {[
                    { icon: ICONS.attach, label: "Attach" },
                    { icon: ICONS.globe, label: "Search" },
                    { icon: ICONS.bolt, label: "Reason" },
                  ].map(({ icon, label }) => {
                    const [active, setActive] = useState(false);
                    return (
                      <button key={label} onClick={() => setActive(a => !a)} style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 11px",
                        background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                        border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 20, color: active ? "#818cf8" : "#6b6b85",
                        fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                      }}>
                        <Icon d={icon} size={13} />{label}
                      </button>
                    );
                  })}
                </div>
                {/* text + send */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "8px 12px 12px" }}>
                  <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={`Message ${MODELS[modelIdx]}…`} rows={1}
                    style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e8e8f0", fontSize: 14.5, fontFamily: "'DM Sans', sans-serif", resize: "none", lineHeight: 1.65, padding: "3px 0", maxHeight: 160, overflowY: "auto" }} />
                  <button onClick={() => send()} disabled={!input.trim() || isTyping} style={{
                    width: 36, height: 36, background: input.trim() && !isTyping ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)",
                    border: "none", borderRadius: 10, color: input.trim() && !isTyping ? "#fff" : "#4a4a62",
                    cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", flexShrink: 0,
                    boxShadow: input.trim() && !isTyping ? "0 4px 12px rgba(99,102,241,0.4)" : "none"
                  }}>
                    <Icon d={ICONS.send} size={15} fill={input.trim() && !isTyping ? "white" : "none"} strokeWidth={input.trim() && !isTyping ? 0 : 1.75} />
                  </button>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 11.5, color: "#3a3a52", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
                NovaMind can make mistakes. Consider verifying important information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* click-outside to close dropdown */}
      {showDropdown && <div onClick={() => setShowDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />}

      {/* Panels */}
      <SettingsPanel open={panel === "settings"} onClose={() => setPanel(null)} />
      <AccountPanel open={panel === "account"} onClose={() => setPanel(null)} />
      <SessionsPanel open={panel === "sessions"} onClose={() => setPanel(null)} />
    </>
  );
}
