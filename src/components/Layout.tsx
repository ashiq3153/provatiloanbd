import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, PlusCircle, CreditCard, HelpCircle, ShieldAlert, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { getTelegramUser } from '../lib/telegram';
import FeeWarningPopup from './FeeWarningPopup';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { language, userProfile } = useAppStore();
  const isBn = language === 'bn';
  const [adminOnline, setAdminOnline] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = getTelegramUser();

  // Real-time admin online status
  useEffect(() => {
    // Fetch initial status
    supabase
      .from('admin_status')
      .select('is_online')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setAdminOnline(data.is_online);
      });

    // Subscribe to real-time changes
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

  // Real-time unread messages count
  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadCount = () => {
      supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', user.id)
        .eq('sender', 'admin')
        .eq('is_seen', false)
        .then(({ count, error }) => {
          if (!error && count !== null) {
            setUnreadCount(count);
          }
        });
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`unread_count_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const navItems = [
    { name: isBn ? 'হোম' : 'Home', path: '/', icon: Home },
    { name: isBn ? 'লোন' : 'Loans', path: '/loans', icon: FileText },
    { name: isBn ? 'আবেদন' : 'Apply', path: '/apply', icon: PlusCircle, isPrimary: true },
    { name: isBn ? 'লেনদেন' : 'History', path: '/transactions', icon: CreditCard },
    { name: isBn ? 'শর্তাবলী' : 'FAQ', path: '/terms', icon: HelpCircle },
  ];

  const isSupportPage = location.pathname === '/support';

  return (
    <div className="flex flex-col h-full sm:h-[90vh] sm:max-h-[850px] w-full max-w-md mx-auto neu-bg sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl sm:border-[8px] border-gray-900 my-auto transition-colors">
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
              {isBn ? 'আপনার প্রোফাইল বা অ্যাক্টিভিটি সাময়িকভাবে লক করা হয়েছে।' : 'Your profile or activity has been temporarily locked.'}
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
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
        isSupportPage ? "overflow-hidden pb-0" : "overflow-y-auto pb-24"
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

      {/* Support / Live Chat FAB - only on home page */}
      {location.pathname === '/' && (
        <>

          <style>{`
            @keyframes floatBounce {
              0%, 100% { transform: translateY(0px) rotate(-2deg); }
              25%       { transform: translateY(-8px) rotate(1deg); }
              50%       { transform: translateY(-5px) rotate(-1deg); }
              75%       { transform: translateY(-10px) rotate(2deg); }
            }
            @keyframes liveDotPing {
              0%, 100% { transform: scale(1); opacity: 1; }
              50%       { transform: scale(1.6); opacity: 0; }
            }
            .chat-fab {
              animation: floatBounce 2.8s ease-in-out infinite;
            }
            .chat-fab:hover {
              animation-play-state: paused;
            }
            .live-dot {
              animation: liveDotPing 1.2s ease-in-out infinite;
            }
          `}</style>

          <Link
            to="/support"
            className="absolute bottom-28 right-5 w-16 h-16 z-40 cursor-pointer chat-fab"
            style={{ background: 'none', position: 'absolute' }}
          >
            {/* Live dot indicator — green=online, red=offline, gray=loading */}
            <span className="absolute -top-1 -right-1 flex w-4 h-4 items-center justify-center z-10">
              <span
                className="live-dot absolute inline-flex w-full h-full rounded-full opacity-75"
                style={{ backgroundColor: adminOnline === null ? '#9ca3af' : adminOnline ? '#4ade80' : '#f87171' }}
              ></span>
              <span
                className="relative inline-flex w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: adminOnline === null ? '#6b7280' : adminOnline ? '#22c55e' : '#ef4444' }}
              ></span>
            </span>

            {/* Unread Messages Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-3 -left-3 bg-red-500 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-[2.5px] border-white shadow-md z-20">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ background: 'transparent', overflow: 'visible' }}>
              {/* Red Bubble Background */}
              <path 
                d="M 68, 48 C 80, 48 90, 55 90, 63 C 90, 68 87, 72 82, 75 C 84, 81 89, 84 89, 84 C 89, 84 82, 82 77, 78 C 74, 78 71, 78 68, 78 C 56, 78 46, 71 46, 63 C 46, 55 56, 48 68, 48 Z" 
                fill="#dc2626" 
              />
              
              {/* Main White Bubble Background */}
              <path 
                d="M 42, 10 C 62, 10 78, 22 78, 38 C 78, 54 62, 66 42, 66 C 37, 66 33, 65 29, 63 C 20, 69 9, 70 9, 70 C 9, 70 15, 64 17, 58 C 11, 53 7, 46 7, 38 C 7, 22 23, 10 42, 10 Z" 
                fill="#ffffff" 
              />
              

              
              {/* Text inside main bubble */}
              <text 
                x="42" 
                y="31" 
                fill="#1a1a1a" 
                fontSize="17" 
                fontWeight="900" 
                fontFamily="'Outfit', 'Inter', 'Arial', sans-serif" 
                textAnchor="middle"
              >
                Live
              </text>
              <text 
                x="42" 
                y="51" 
                fill="#dc2626" 
                fontSize="20" 
                fontWeight="900" 
                fontFamily="'Outfit', 'Inter', 'Arial', sans-serif" 
                textAnchor="middle"
              >
                Chat
              </text>
            </svg>
          </Link>
        </>
      )}
      


      {!isSupportPage && !userProfile?.is_locked && (
        <div className="absolute bottom-4 left-4 right-4 neu-raised px-4 py-2 rounded-[24px] transition-colors z-50">
          <div className="flex justify-between items-center relative">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              if (item.isPrimary) {
                if (location.pathname === '/') {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="relative -top-5 flex flex-col items-center justify-center pointer-events-auto shrink-0"
                    >
                      <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-full p-3.5 shadow-md active:scale-95 transition-transform flex items-center justify-center">
                        <item.icon size={22} strokeWidth={2.5} />
                      </div>
                      <span className="text-[9px] font-black text-gray-700 dark:text-gray-300 mt-1 transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  );
                } else {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex flex-col items-center justify-center p-1.5 transition-all active:scale-95",
                        isActive ? "text-primary-600 dark:text-indigo-400 font-extrabold" : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-full mb-1 flex items-center justify-center transition-all",
                        isActive ? "neu-btn-primary" : "bg-transparent"
                      )}>
                        <item.icon 
                          size={18} 
                          strokeWidth={isActive ? 2.5 : 2} 
                        />
                      </div>
                      <span className="text-[9px] font-black tracking-tight">
                        {item.name}
                      </span>
                    </Link>
                  );
                }
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center p-1.5 transition-all active:scale-95",
                    isActive ? "text-primary-600 dark:text-indigo-400 font-extrabold" : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-full mb-1 flex items-center justify-center transition-all",
                    isActive ? "neu-btn-primary" : "bg-transparent"
                  )}>
                    <item.icon 
                      size={18} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                  </div>
                  <span className="text-[9px] font-black tracking-tight">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <FeeWarningPopup />
    </div>
  );
}
