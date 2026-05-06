import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ── Convenience helpers ────────────────────────────────────────────────────────

/** Get current session access token */
export async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

/** Load all conversations for current user, ordered by last updated */
export async function loadConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, model, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Create a new conversation */
export async function createConversation(title = "New conversation", model = "mistral:7b") {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ title, model, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Load messages for a conversation */
export async function loadMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Insert a user message */
export async function insertMessage(conversationId, role, content) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete a conversation (messages cascade) */
export async function deleteConversation(id) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

/** Update conversation title */
export async function updateConversationTitle(id, title) {
  const { data, error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get user profile */
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}
