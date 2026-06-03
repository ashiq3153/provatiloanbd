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
import { getTelegramUser } from './lib/telegram';
import { upsertProfile } from './lib/api';
import { getSystemSettings } from './lib/adminApi';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const setSystemSettings = useAppStore(state => state.setSystemSettings);

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
      }).catch(err => console.error("Global profile sync error:", err));
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
        <Route path="/terms" element={<Terms />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
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

