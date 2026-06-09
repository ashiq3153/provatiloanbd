import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, PlusCircle, CreditCard, User, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../lib/store';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { language } = useAppStore();
  const isBn = language === 'bn';

  const navItems = [
    { name: isBn ? 'হোম' : 'Home', path: '/', icon: Home },
    { name: isBn ? 'লোন' : 'Loans', path: '/loans', icon: FileText },
    { name: isBn ? 'আবেদন' : 'Apply', path: '/apply', icon: PlusCircle, isPrimary: true },
    { name: isBn ? 'লেনদেন' : 'History', path: '/transactions', icon: CreditCard },
    { name: isBn ? 'প্রোফাইল' : 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-full sm:h-[90vh] sm:max-h-[850px] w-full max-w-md mx-auto bg-gray-50 dark:bg-gray-900 sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl sm:border-[8px] border-gray-900 my-auto transition-colors">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      
      {/* Support / Live Chat FAB - only on home page */}
      {location.pathname === '/' && (
        <>
          <style>{`
            @keyframes waterFlow {
              0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7), 0 0 0 4px rgba(239,68,68,0.3); }
              50%  { box-shadow: 0 0 0 6px rgba(239,68,68,0.2), 0 0 0 12px rgba(239,68,68,0.05); }
              100% { box-shadow: 0 0 0 0 rgba(239,68,68,0), 0 0 0 0 rgba(239,68,68,0); }
            }
            .live-badge {
              animation: waterFlow 1.8s ease-out infinite;
            }
          `}</style>
          <Link
            to="/support"
            className="absolute bottom-28 right-5 bg-red-600 rounded-full w-12 h-12 z-40 active:scale-90 transition-transform live-badge flex items-center justify-center text-white shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <MessageCircle size={22} strokeWidth={2.5} />
          </Link>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 px-6 py-2 pb-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] transition-colors z-50">
        <div className="flex justify-between items-center relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            if (item.isPrimary) {
              if (location.pathname === '/') {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative -top-6 flex flex-col items-center justify-center pointer-events-auto"
                  >
                    <div className="bg-primary-600 text-white rounded-full p-4 shadow-lg shadow-primary-500/40 translate-y-1 active:scale-95 transition-transform">
                      <item.icon size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mt-2 transition-colors">
                      {item.name}
                    </span>
                  </Link>
                );
              } else {
                // Return as normal tab
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 transition-all active:scale-95",
                      isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    )}
                  >
                    <item.icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={cn("mb-1 transition-transform", isActive && "scale-110")} 
                    />
                    <span className={cn(
                      "text-[10px] font-medium transition-colors",
                      isActive && "font-semibold"
                    )}>
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
                  "flex flex-col items-center justify-center p-2 transition-all active:scale-95",
                  isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <item.icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn("mb-1 transition-transform", isActive && "scale-110")} 
                />
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive && "font-semibold"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
