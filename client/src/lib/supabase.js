import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Check if localStorage is available and working
 * Brave and other privacy-focused browsers may block it
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__supabase_storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * In-memory storage fallback for when localStorage is blocked
 * Users will need to re-login after page refresh, but app won't crash
 */
function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

/**
 * Safe storage wrapper that tries localStorage first, falls back to memory
 */
function createSafeStorage() {
  const memoryStorage = createMemoryStorage();
  const localStorageAvailable = isLocalStorageAvailable();
  
  if (!localStorageAvailable) {
    console.warn(
      'localStorage is not available (possibly blocked by browser privacy settings). ' +
      'Auth will work but you may need to log in again after refreshing the page.'
    );
  }
  
  return {
    getItem: (key) => {
      try {
        if (localStorageAvailable) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        // Fall through to memory storage
      }
      return memoryStorage.getItem(key);
    },
    setItem: (key, value) => {
      try {
        if (localStorageAvailable) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (e) {
        // Fall through to memory storage
      }
      memoryStorage.setItem(key, value);
    },
    removeItem: (key) => {
      try {
        if (localStorageAvailable) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch (e) {
        // Fall through to memory storage
      }
      memoryStorage.removeItem(key);
    },
  };
}

let supabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
  
  // Create a dummy client that returns errors when used, preventing crash
  const createDummyBuilder = () => {
    const builder = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      delete: () => builder,
      eq: () => builder,
      order: () => Promise.resolve({ data: [], error: { message: 'Missing Supabase Credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets.' } }),
      single: () => Promise.resolve({ data: null, error: { message: 'Missing Supabase Credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets.' } }),
      in: () => builder
    };
    return builder;
  };

  supabaseClient = {
    from: () => createDummyBuilder(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithOtp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      verifyOtp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };
} else {
  // Create client with safe storage that handles localStorage blocks gracefully
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createSafeStorage(),
      storageKey: 'versa-footy-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = supabaseClient;

export default supabase;
