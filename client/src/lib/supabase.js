import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    from: () => createDummyBuilder()
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

export default supabase;
