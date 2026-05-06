-- ── RAG (Retrieval-Augmented Generation) Schema ──────────────────────────────
-- Run: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f schema_rag.sql

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents table (one row per uploaded file)
CREATE TABLE IF NOT EXISTS public.documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  source      text DEFAULT '',
  char_count  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 3. Chunks table (many per document, each with an embedding)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL,
  chunk_index integer DEFAULT 0,
  embedding   vector(768),          -- nomic-embed-text dimension
  created_at  timestamptz DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own docs"   ON public.documents;
CREATE POLICY "Users manage own docs"
  ON public.documents FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own chunks"   ON public.document_chunks;
CREATE POLICY "Users read own chunks"
  ON public.document_chunks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role manages chunks" ON public.document_chunks;
CREATE POLICY "Service role manages chunks"
  ON public.document_chunks FOR ALL USING (true);

-- 5. Cosine similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  match_count     integer DEFAULT 5,
  filter_user_id  uuid    DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  document_id uuid,
  content     text,
  title       text,
  similarity  float
)
LANGUAGE sql STABLE AS $$
  SELECT dc.id, dc.document_id, dc.content, d.title,
         1 - (dc.embedding <=> query_embedding) AS similarity
  FROM   public.document_chunks dc
  JOIN   public.documents       d  ON d.id = dc.document_id
  WHERE  (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND  dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. ANN index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- 7. Regular indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id     ON public.documents (user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id    ON public.document_chunks (document_id);
