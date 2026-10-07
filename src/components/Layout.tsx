import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Plus, ArrowLeftRight, ShieldCheck, ShieldAlert, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import FeeWarningPopup from './FeeWarningPopup';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { language, userProfile } = useAppStore();
  const isBn = language === 'bn';
  const [adminOnline, setAdminOnline] = useState<boolean | null>(null);

  // Real-time admin online status
  useEffect(() => {
    supabase
      .from('admin_status')
      .select('is_online')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setAdminOnline(data.is_online);
      });

    const channel = supabase
      .channel('admin-status-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'admin_status', filter: 'id=eq.1' },
        (payload) => {
          setAdminOnline(payload.new.is_online);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { name: isBn ? 'হোম' : 'Home', path: '/', icon: Home },
    { name: isBn ? 'লোন' : 'Loans', path: '/loans', icon: Wallet },
    { name: isBn ? 'আবেদন' : 'Apply', path: '/apply', icon: Plus, isPrimary: true },
    { name: isBn ? 'লেনদেন' : 'History', path: '/transactions', icon: ArrowLeftRight },
    { name: isBn ? 'শর্তাবলী' : 'Terms', path: '/terms', icon: ShieldCheck },
  ];

  const isSupportPage = location.pathname === '/support';
  const isActivePath = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const statusDot =
    adminOnline === null ? 'bg-slate-400' : adminOnline ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className="user-app-shell flex flex-col h-full min-h-0 w-full max-w-none mx-0 neu-bg rounded-none relative overflow-hidden shadow-none border-0 my-0 transition-colors">
      {userProfile?.is_locked && !isSupportPage && (
        <div className="absolute inset-0 z-[100] bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-red-100 dark:border-red-900/30 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ShieldAlert className="text-red-600 dark:text-red-500" size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              {isBn ? 'অ্যাকাউন্ট লকড' : 'Account Locked'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-6 text-sm">
              {isBn ? 'আপনার প্রোফাইল বা অ্যাক্টিভিটি সাময়িকভাবে লক করা হয়েছে।' : 'Your profile or activity has been temporarily locked.'}
            </p>
            {userProfile.lock_reason && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 w-full mb-8 border border-red-100 dark:border-red-800/30 text-left">
                <span className="text-[10px] font-black text-red-800 dark:text-red-400 uppercase tracking-wider block mb-1">
                  {isBn ? 'কারণ:' : 'Reason:'}
                </span>
                <span className="text-red-700 dark:text-red-300 font-bold text-sm">
                  {userProfile.lock_reason}
                </span>
              </div>
            )}
            <Link
              to="/support"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
            >
              <MessageCircle size={20} />
              {isBn ? 'সাপোর্টে যোগাযোগ করুন' : 'Contact Support'}
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 scroll-smooth overflow-x-hidden",
        isSupportPage ? "overflow-hidden pb-0" : "overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))]"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={isSupportPage ? "h-full" : "min-h-full"}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Support button — home page only. Small, static, with live status dot. */}
      {location.pathname === '/' && !isSupportPage && !userProfile?.is_locked && (
        <Link
          to="/support"
          aria-label={isBn ? 'সাপোর্ট চ্যাট' : 'Support chat'}
          className="absolute right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-sky-600 shadow-lg shadow-slate-900/10 transition-transform active:scale-95 dark:border-slate-700 dark:bg-[#111827] dark:text-sky-400"
        >
          <MessageCircle size={22} />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
            {adminOnline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span className={cn('relative inline-flex h-3 w-3 rounded-full border-2 border-white dark:border-[#111827]', statusDot)} />
          </span>
        </Link>
      )}

      {/* Bottom navigation — docked, same layout on every page */}
      {!isSupportPage && !userProfile?.is_locked && (
        <nav
          aria-label={isBn ? 'মূল মেনু' : 'Main navigation'}
          className="absolute inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0b1220]/95 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);

              if (item.isPrimary) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className="flex flex-col items-center justify-end gap-1 pb-2 active:scale-95 transition-transform"
                  >
                    <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-4 ring-white dark:ring-[#0b1220]">
                      <item.icon size={24} strokeWidth={2.5} />
                    </span>
                    <span className={cn('text-[11px] font-semibold leading-none', isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400')}>
                      {item.name}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 transition-colors active:scale-95',
                    isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                  <span className={cn('text-[11px] leading-none', isActive ? 'font-semibold' : 'font-medium')}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <FeeWarningPopup />
    </div>
  );
}
