/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ApplyLoan from './pages/ApplyLoan';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Transactions from './pages/Transactions';
import Loans from './pages/Loans';
import PlaceholderPage from './pages/PlaceholderPage';
import PayEMI from './pages/PayEMI';
import ApplicationDetails from './pages/ApplicationDetails';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Terms from './pages/Terms';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Toaster } from 'sonner';
import { useAppStore } from './lib/store';
import { getTelegramUser, sendTelegramNotification } from './lib/telegram';
import { upsertProfile } from './lib/api';
import { getSystemSettings } from './lib/adminApi';
import { playUIClick, playUITap } from './lib/sound';
import { supabase } from './lib/supabase';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const setSystemSettings = useAppStore(state => state.setSystemSettings);

  // Setup global interactive click/focus sound effects
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactiveEl = target.closest('button, a, [role="button"], .cursor-pointer, input, textarea, select');
      
      if (interactiveEl) {
        const tagName = interactiveEl.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
          playUITap();
        } else {
          playUIClick();
        }
      }
    };

    const handleGlobalFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        playUITap();
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    document.addEventListener('focusin', handleGlobalFocus, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
      document.removeEventListener('focusin', handleGlobalFocus, { capture: true });
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    // Initialize Telegram Web App
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }

    // Auto-update user profile globally on app start
    const user = getTelegramUser();
    if (user && user.id) {
      upsertProfile({
        chat_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        photo_url: user.photo_url || null,
      }).then(profile => {
        if (profile) useAppStore.getState().setUserProfile(profile);
      }).catch(err => console.error("Global profile sync error:", err));

      // Send welcome message once per user (on /start)
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
          .catch(err => console.error("Welcome message error:", err));
      }

      // Initialize Realtime Presence for this user
      const presenceChannel = supabase.channel('online_users', {
        config: {
          presence: { key: user.id.toString() }
        }
      });
      
      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            chat_id: user.id,
            first_name: user.first_name,
            online_at: new Date().toISOString()
          });
        }
      });
    }

    // Fetch system settings
    getSystemSettings('global_loan_config').then(settings => {
      if (settings) {
        setSystemSettings(settings);
      }
    });
  }, [setSystemSettings]);

  return (
    <Router>
      <Toaster position="top-center" richColors theme={theme === 'dark' ? 'dark' : 'light'} />
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/apply" element={<ApplyLoan />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/application/:id" element={<ApplicationDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
              <Route path="/pay" element={<PayEMI />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

