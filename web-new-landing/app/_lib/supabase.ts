import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isLocalStorageAvailable(): boolean {
  try {
    const k = "__vf_storage_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function createSafeStorage() {
  const mem = new Map<string, string>();
  const haveLs = typeof window !== "undefined" && isLocalStorageAvailable();
  return {
    getItem: (key: string) => {
      try {
        if (haveLs) return window.localStorage.getItem(key);
      } catch {}
      return mem.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      try {
        if (haveLs) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch {}
      mem.set(key, value);
    },
    removeItem: (key: string) => {
      try {
        if (haveLs) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch {}
      mem.delete(key);
    },
  };
}

let client: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  // Minimal stub so static export build doesn't crash. All calls fail gracefully.
  client = createClient(
    "https://placeholder.supabase.co",
    "placeholder-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
} else {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createSafeStorage(),
      storageKey: "versa-footy-auth",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = client;
