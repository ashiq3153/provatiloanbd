import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, MessageCircle, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getTelegramUser } from '../lib/telegram';
import { getLoanApplications, getDepositStatus } from '../lib/api';
import { useAppStore } from '../lib/store';

export default function FeeWarningPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [pendingLoan, setPendingLoan] = useState<any>(null);
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const location = useLocation();
  const lastClosedTime = useRef(0);

  useEffect(() => {
    const user = getTelegramUser();
    if (!user || !user.id) return;

    const checkStatus = async () => {
      // Do not check or show if recently closed (within 30s) or on specific pages
      if (Date.now() - lastClosedTime.current < 30000) return;
      if (location.pathname === '/deposit' || location.pathname === '/support') {
        setShowPopup(false);
        return;
      }

      try {
        const loans = await getLoanApplications(user.id);
        const pending = loans.find(l => l.status === 'pending');
        
        if (pending) {
          const depositStatus = await getDepositStatus(user.id);
          if (!depositStatus.processingFee) {
            setPendingLoan(pending);
            setShowPopup(true);
          }
        }
      } catch (err) {
        console.error("Error checking fee status", err);
      }
    };

    // Initial check
    checkStatus();

    // Recheck every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleClose = () => {
    lastClosedTime.current = Date.now();
    setShowPopup(false);
  };

  if (!pendingLoan) return null;
  if (location.pathname === '/deposit' || location.pathname === '/support') return null;

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-amber-200 dark:border-amber-500/30 relative overflow-hidden w-full max-w-sm"
          >
            {/* Warning Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl"></div>
            
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 bg-gray-100 dark:bg-gray-700 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0 shadow-inner mt-1">
                <AlertTriangle className="text-amber-600 dark:text-amber-500" size={24} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-1">
                  {isBn ? 'লোন আবেদন করেছেন, ফি জমা দিন' : 'Loan Applied, Pay Fee'}
                </h3>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-3">
                  {isBn 
                    ? 'প্রসেসিং ফি জমা না দিলে আপনার আবেদন রিভিউ বা প্রসেসিং-এ যাবে না।' 
                    : 'Your application will not go into review or processing without paying the processing fee.'}
                </p>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={14} className="text-amber-700 dark:text-amber-300" />
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      {isBn ? 'প্রসেসিং ফি পর্যালোচনা করুন' : 'Review your processing fee'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    {isBn
                      ? 'প্রযোজ্য ফি ও জমার অবস্থা ডিপোজিট স্ক্রিনে যাচাই করুন। ফি যাচাই না হওয়া পর্যন্ত আবেদন পর্যালোচনায় দেরি হতে পারে।'
                      : 'Review the applicable fee and current payment status on the Deposit screen. Review may be delayed until the fee is verified.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link 
                    to="/deposit" 
                    onClick={handleClose}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                  >
                    <CreditCard size={14} /> {isBn ? 'ডিপোজিট করুন' : 'Deposit'}
                  </Link>
                  <Link 
                    to="/support" 
                    onClick={handleClose}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle size={14} /> {isBn ? 'লাইভ চ্যাট' : 'Live Chat'}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
