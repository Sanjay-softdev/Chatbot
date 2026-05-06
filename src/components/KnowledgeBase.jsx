import { useState, useRef, useEffect } from "react";
import { getToken } from "../supabase.js";

// ── Knowledge Base Panel ───────────────────────────────────────────────────────
// Full-screen modal for uploading, viewing, and deleting documents used in RAG

export default function KnowledgeBase({ onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { total, done, name }
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    setLoading(true);
    try {
      const token = await getToken();
      const r = await fetch("/api/rag/documents", { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setDocs(data.documents || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleFiles(files) {
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { setError(`${file.name} is too large (max 5MB)`); continue; }
      setUploading(true);
      setUploadProgress({ total: 0, done: 0, name: file.name });
      setError("");
      try {
        const text = await file.text();
        const token = await getToken();
        const res = await fetch("/api/rag/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: file.name, text }),
        });
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const d = JSON.parse(line.slice(5).trim());
              if (d.total !== undefined) setUploadProgress({ total: d.total, done: d.done, name: file.name });
              if (d.complete) { await fetchDocs(); }
            } catch {}
          }
        }
      } catch (e) { setError(`Upload failed: ${e.message}`); }
    }
    setUploading(false);
    setUploadProgress(null);
  }

  async function deleteDoc(id, title) {
    if (!confirm(`Delete "${title}"? All its chunks will be removed.`)) return;
    try {
      const token = await getToken();
      await fetch(`/api/rag/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setDocs(d => d.filter(x => x.id !== id));
    } catch (e) { setError(e.message); }
  }

  const pct = uploadProgress?.total > 0 ? Math.round((uploadProgress.done / uploadProgress.total) * 100) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div style={{ width: "min(680px, 95vw)", maxHeight: "85vh", background: "#141420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📚</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#eeeef5", fontFamily: "'DM Sans',sans-serif" }}>Knowledge Base</div>
              <div style={{ fontSize: 12, color: "#6b6b85", fontFamily: "'DM Sans',sans-serif" }}>{docs.length} document{docs.length !== 1 ? "s" : ""} · RAG-powered answers</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#9ca3af", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Upload zone */}
        <div
          style={{ margin: "16px 20px 0", padding: "20px", background: "rgba(245,158,11,0.06)", border: "2px dashed rgba(245,158,11,0.25)", borderRadius: 14, textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"; handleFiles(e.dataTransfer.files); }}>
          <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.json,.js,.py,.html,.css" style={{ display: "none" }}
            onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
          {uploading && uploadProgress ? (
            <div>
              <div style={{ fontSize: 13.5, color: "#f59e0b", fontFamily: "'DM Sans',sans-serif", marginBottom: 10 }}>
                ⚡ Embedding "{uploadProgress.name}"… {uploadProgress.done}/{uploadProgress.total} chunks
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius: 99, transition: "width 0.3s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#6b6b85", marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>{pct}% complete</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#d4d4e8", fontFamily: "'DM Sans',sans-serif" }}>Drop files here or click to upload</div>
              <div style={{ fontSize: 12, color: "#6b6b85", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>TXT, MD, CSV, JSON, JS, PY, HTML, CSS · Max 5MB each</div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: "10px 20px 0", padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#f87171", fontSize: 13, fontFamily: "'DM Sans',sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            ⚠ {error}<button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Doc list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 20px" }}>
          {loading && <div style={{ textAlign: "center", color: "#4a4a62", fontSize: 13, padding: 20 }}>Loading…</div>}
          {!loading && docs.length === 0 && (
            <div style={{ textAlign: "center", color: "#4a4a62", fontSize: 13, padding: 30, lineHeight: 1.8 }}>
              No documents yet.<br />Upload files above to build your knowledge base.<br />
              <span style={{ fontSize: 12 }}>Once uploaded, enable <strong>📚 RAG</strong> in the chat to use them.</span>
            </div>
          )}
          {docs.map(doc => (
            <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 8, transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
              <div style={{ width: 36, height: 36, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#d4d4e8", fontFamily: "'DM Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                <div style={{ fontSize: 11.5, color: "#6b6b85", fontFamily: "'DM Sans',sans-serif" }}>
                  {(doc.char_count / 1000).toFixed(1)}K chars · {new Date(doc.created_at).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => deleteDoc(doc.id, doc.title)}
                style={{ padding: "5px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div style={{ padding: "12px 22px", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "#4a4a62", fontFamily: "'DM Sans',sans-serif", textAlign: "center" }}>
          💡 Tip: Enable <strong style={{ color: "#f59e0b" }}>📚 RAG</strong> in the chat input to answer questions using your uploaded documents
        </div>
      </div>
    </div>
  );
}
