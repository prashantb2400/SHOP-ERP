import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

let _supabase = null;

export function getSupabase() {
  if (_supabase) return _supabase;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('your-project-id')) {
    return null;
  }
  try {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return _supabase;
  } catch (err) {
    console.warn('[RetailFlow] Supabase initialization failed:', err);
    return null;
  }
}

export function supabaseInit() {
  return !!getSupabase();
}

export function supabaseOnAuth(cb) {
  const sb = getSupabase();
  if (!sb) {
    cb(null);
    return () => {};
  }

  // Get initial session
  sb.auth.getSession().then(({ data: { session } }) => {
    const u = session?.user;
    cb(u ? {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
      avatar: u.user_metadata?.avatar_url || null,
    } : null);
  }).catch(() => cb(null));

  // Subscribe to changes
  const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    cb(u ? {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
      avatar: u.user_metadata?.avatar_url || null,
    } : null);
  });

  return () => {
    subscription?.unsubscribe();
  };
}

export async function supabaseSignIn(email, password) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function supabaseSignUp(email, password) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  try {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function supabaseGoogleIn() {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  try {
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function supabaseSignOut() {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.auth.signOut();
  } catch (err) {
    console.warn('[RetailFlow] Supabase sign out error:', err);
  }
}

export async function supabasePush(uid, blob, ts) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('retailflow_data')
      .upsert({
        user_id: uid,
        blob,
        ts,
        version: 3,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    return !error;
  } catch {
    return false;
  }
}

export async function supabasePull(uid) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('retailflow_data')
      .select('blob, ts, version')
      .eq('user_id', uid)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
