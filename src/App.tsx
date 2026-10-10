/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
const Home = lazy(() => import('./pages/Home'));
const SuccessStoriesPage = lazy(() => import('./pages/SuccessStoriesPage'));
const ApplyLoan = lazy(() => import('./pages/ApplyLoan'));
const Deposit = lazy(() => import('./pages/Deposit'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Loans = lazy(() => import('./pages/Loans'));
const LoanCategories = lazy(() => import('./pages/LoanCategories'));
const PayEMI = lazy(() => import('./pages/PayEMI'));
const ApplicationDetails = lazy(() => import('./pages/ApplicationDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const Support = lazy(() => import('./pages/Support'));
const Terms = lazy(() => import('./pages/Terms'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
import { Toaster } from 'sonner';
import { useAppStore } from './lib/store';
import { sendTelegramNotification } from './lib/telegram';
import { upsertProfile, getPublicSettings } from './lib/api';
import { playUIClick, playUITap } from './lib/sound';
import { ensureSupabaseAuthSession, supabase } from './lib/supabase';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const setSystemSettings = useAppStore(state => state.setSystemSettings);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactiveEl = target.closest('button, a, [role="button"], .cursor-pointer, input, textarea, select');
      if (interactiveEl) {
        const tagName = interactiveEl.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') playUITap();
        else playUIClick();
      }
    };

    const handleGlobalFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') playUITap();
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    document.addEventListener('focusin', handleGlobalFocus, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
      document.removeEventListener('focusin', handleGlobalFocus, { capture: true });
    };
  }, []);

  // Apply the saved theme immediately; dark mode is the default in v1.1 phase1.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }

    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const initializeUser = async () => {
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const initData = telegramWebApp?.initData;
      if (!initData) {
        console.error('Telegram initData is unavailable; user initialization stopped.');
        return;
      }

      const session = await ensureSupabaseAuthSession();
      const response = await fetch('/api/telegram-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, accessToken: session.access_token }),
      });
      const authResult = await response.json();
      if (!response.ok || !authResult?.ok || !authResult?.user?.id || !authResult.identityBound) {
        throw new Error(authResult?.error || 'Telegram/Supabase identity binding failed');
      }

      const user = authResult.user;

      // Profile creation is server-verified so the loan_applications FK is
      // satisfied even if the browser-side RLS upsert races with app startup.
      try {
        const profileResponse = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, action: 'sync_profile' }),
        });
        const profileResult = await profileResponse.json().catch(() => null);
        if (!profileResponse.ok || !profileResult?.ok) {
          throw new Error(profileResult?.error || 'Profile synchronization failed');
        }
        if (profileResult.data) {
          useAppStore.getState().setUserProfile(profileResult.data);
        }
      } catch (err) {
        console.error('Global profile sync error:', err);
      }

      const welcomeKey = `provati_welcome_sent_${user.id}`;
      if (!localStorage.getItem(welcomeKey)) {
        const welcomeMsg =
          `🏦 <b>PROVATI LOAN-এ আপনাকে স্বাগতম।</b>\n\n` +
          `ব্যক্তিগত, ব্যবসায়ী, প্রবাসী ও অন্যান্য ঋণের জন্য আবেদন করতে নিচের "লোন আবেদন করুন" অপশনটি নির্বাচন করুন।\n\n` +
          `✅ দ্রুত আবেদন\n` +
          `✅ অনলাইন প্রক্রিয়া\n` +
          `✅ আবেদন স্ট্যাটাস ট্র্যাকিং`;

        sendTelegramNotification(user.id, welcomeMsg)
          .then(sent => {
            if (sent) localStorage.setItem(welcomeKey, '1');
          })
          .catch(err => console.error('Welcome message error:', err));
      }

      presenceChannel = supabase.channel('online_users', {
        config: { presence: { key: user.id.toString() } }
      });

      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel?.track({
            chat_id: user.id,
            first_name: user.first_name,
            online_at: new Date().toISOString()
          });
        }
      });
    };

    initializeUser().catch(err => console.error('Telegram initialization error:', err));

    // Uses the direct RLS-scoped read (safe: system_settings no longer stores
    // secrets), so this works for every authenticated user, not just admins.
    ensureSupabaseAuthSession()
      .then(() => getPublicSettings('global_loan_config'))
      .then(settings => {
        if (settings !== null) setSystemSettings(settings);
      })
      .catch(err => console.error('Global settings load error:', err));

    return () => {
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [setSystemSettings]);

  return (
    <Router>
      <Toaster position="top-center" richColors theme={theme === 'dark' ? 'dark' : 'light'} />
      <Routes>
        <Route path="/admin" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading dashboard…</div>}><AdminDashboard /></Suspense>} />
        <Route path="/*" element={
          <Layout>
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading screen…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/apply" element={<ApplyLoan />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/loan-categories" element={<LoanCategories />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/application/:id" element={<ApplicationDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
              <Route path="/pay" element={<PayEMI />} />
            </Routes>
            </Suspense>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
