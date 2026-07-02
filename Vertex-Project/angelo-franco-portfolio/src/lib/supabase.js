import { createClient } from "@supabase/supabase-js";

// Read-only anon client. Used at BUILD time (SSG loaders / getStaticPaths) and on
// the client for navigation. Only published case_studies rows are readable (RLS).
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (public anon key — safe to expose).
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;
