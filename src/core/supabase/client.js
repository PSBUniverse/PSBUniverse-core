import { createClient } from "@supabase/supabase-js";

let supabase = null;

export function initSupabase(url, key) {
  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }

  if (!supabase) {
    supabase = createClient(url, key);
  }

  return supabase;
}

export function getSupabase() {
  if (!supabase) {
    throw new Error("Supabase not initialized");
  }

  return supabase;
}
