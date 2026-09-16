import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'provatiadmin@gmail.com';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const current = data.session;
      if (current?.user.email?.toLowerCase() === ADMIN_EMAIL) {
        setSession(current);
      } else if (current) {
        void supabase.auth.signOut();
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user.email?.toLowerCase() === ADMIN_EMAIL) {
        setSession(nextSession);
        setError('');
      } else {
        setSession(null);
        if (nextSession) void supabase.auth.signOut();
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authError) {
      setError('লগইন হয়নি। ইমেইল ও পাসওয়ার্ড যাচাই করুন।');
    } else if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError('এই ইমেইলটি অ্যাডমিন হিসেবে অনুমোদিত নয়।');
    } else {
      setSession(data.session);
      setPassword('');
    }
    setBusy(false);
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-200">যাচাই করা হচ্ছে…</div>;
  }

  if (session?.user.email?.toLowerCase() === ADMIN_EMAIL) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 px-4 py-10 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold">অ্যাডমিন লগইন</h1>
          <p className="mt-2 text-sm text-slate-400">PROVATI LOAN অ্যাডমিন প্যানেলে প্রবেশ করুন।</p>
        </div>
        <label className="block text-sm font-medium">ইমেইল
          <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-white outline-none focus:border-sky-500" />
        </label>
        <label className="block text-sm font-medium">পাসওয়ার্ড
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-white outline-none focus:border-sky-500" />
        </label>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {busy ? 'লগইন হচ্ছে…' : 'লগইন করুন'}
        </button>
      </form>
    </main>
  );
}
