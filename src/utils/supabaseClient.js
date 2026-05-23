import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url') {
  console.warn(
    'Supabase credentials missing or set to placeholder! Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );

  // Return a dummy proxy to prevent app crashes when credentials are not supplied
  const createMockProxy = () => {
    const handler = {
      get(target, prop) {
        if (prop === 'auth') {
          return {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: async () => {},
            signInWithOAuth: async () => { throw new Error('Supabase credentials missing'); }
          };
        }
        if (prop === 'channel') {
          return () => ({
            on: () => ({ subscribe: () => ({}) }),
            subscribe: () => ({})
          });
        }
        if (prop === 'from') {
          return () => ({
            select: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
              maybeSingle: () => Promise.resolve({ data: null, error: null })
            }),
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: new Error('Missing Supabase credentials') })
              })
            }),
            update: () => ({
              eq: () => Promise.resolve({ data: [], error: null })
            }),
            delete: () => ({
              eq: () => Promise.resolve({ data: [], error: null })
            })
          });
        }
        if (prop === 'removeChannel') {
          return () => {};
        }
        return () => {};
      }
    };
    return new Proxy({}, handler);
  };
  
  supabaseInstance = createMockProxy();
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
