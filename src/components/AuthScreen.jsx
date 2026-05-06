// Arni's branch
import { useState } from "react";
import { supabase } from "../supabase.js";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setSuccess("Account created! You can now log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.jsx onAuthStateChange will handle redirect
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 12, color: "#e8e8f0",
    fontSize: 14.5, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  };

  const btnStyle = {
    width: "100%", padding: "13px",
    background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
    border: "none", borderRadius: 12,
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
    boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
    marginTop: 4,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0e0e14",
      fontFamily: "'DM Sans', sans-serif", padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { background: #0e0e14; }
        input:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 60px rgba(139,92,246,0.4)} }
      `}</style>

      {/* Background glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(18,18,26,0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "40px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        animation: "fadeUp 0.35s ease",
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16, animation: "glow 3s ease-in-out infinite",
          }}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: "#eeeef5",
            fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em", marginBottom: 4,
          }}>NovaMind</h1>
          <p style={{ fontSize: 13.5, color: "#6b6b85" }}>
            {mode === "login" ? "Welcome back — sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 12.5, color: "#6b6b85", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.02em" }}>FULL NAME</label>
              <input
                id="auth-fullname"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Arun Kumar"
                required={mode === "signup"}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12.5, color: "#6b6b85", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.02em" }}>EMAIL</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, color: "#6b6b85", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.02em" }}>PASSWORD</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
              color: "#f87171", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "10px 14px", background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10,
              color: "#4ade80", fontSize: 13,
            }}>
              {success}
            </div>
          )}

          <button id="auth-submit" type="submit" disabled={loading} style={btnStyle}>
            {loading ? (mode === "signup" ? "Creating account…" : "Signing in…") : (mode === "signup" ? "Create Account" : "Sign In")}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: "#4a4a62" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            id="auth-toggle"
            onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
            style={{
              background: "none", border: "none", color: "#818cf8",
              cursor: "pointer", fontWeight: 600, fontSize: 13.5,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>

        {/* Model info badge */}
        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
          <span style={{ fontSize: 11.5, color: "#3a3a52" }}>Mistral 7B · Local · Private</span>
        </div>
      </div>
    </div>
  );
}
