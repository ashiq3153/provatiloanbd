import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock, X, MessageCircle, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getTelegramUser } from '../lib/telegram';
import { getLoanApplications, getDepositStatus } from '../lib/api';
import { useAppStore } from '../lib/store';
import { convertDigits } from '../lib/translation';

export default function FeeWarningPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [pendingLoan, setPendingLoan] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const location = useLocation();

  useEffect(() => {
    const user = getTelegramUser();
    if (!user || !user.id) return;

    const checkStatus = async () => {
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

    // The user requested the popup to appear every 30 seconds.
    // If it's already open, we don't need to do anything. If closed, we reopen it.
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    if (!pendingLoan) return;

    const calculateTimeLeft = () => {
      const appliedDate = new Date(pendingLoan.applied_at);
      // Deadline is 8:00 PM (20:00:00) on the day of application
      const deadline = new Date(appliedDate);
      deadline.setHours(20, 0, 0, 0);

      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
      } else {
        setIsExpired(false);
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [pendingLoan]);

  const handleClose = () => {
    setShowPopup(false);
  };

  if (!pendingLoan) return null;

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:max-w-sm md:left-1/2 md:-translate-x-1/2"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-2xl border-2 border-amber-400 dark:border-amber-500/50 relative overflow-hidden">
            {/* Warning Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>
            
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

                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-rose-600 dark:text-rose-400" />
                    <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider">
                      {isBn ? 'আজ রাত ৮টার মধ্যে জমা দিন' : 'Pay by 8:00 PM today'}
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 mb-2 leading-tight">
                    {isBn 
                      ? 'যে দিন আবেদন করেছেন, ওই দিনের ওয়ার্কিং টাইমের ভেতর জমা না দিলে আবেদন স্বয়ংক্রিয়ভাবে বাতিল হবে।' 
                      : 'If not paid within working hours of the application day, it will be automatically cancelled.'}
                  </div>
                  
                  {/* Countdown Timer */}
                  <div className="flex items-center gap-2 justify-center bg-white dark:bg-gray-900 rounded-lg py-2 shadow-sm border border-rose-100 dark:border-rose-900/50">
                    {isExpired ? (
                      <span className="font-black text-rose-600 text-sm">{isBn ? 'সময় শেষ (বাতিলযোগ্য)' : 'Expired (Cancellable)'}</span>
                    ) : timeLeft ? (
                      <>
                        <div className="flex flex-col items-center">
                          <span className="font-black text-gray-900 dark:text-white text-base leading-none">
                            {convertDigits(timeLeft.hours.toString().padStart(2, '0'), isBn)}
                          </span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">{isBn ? 'ঘণ্টা' : 'HR'}</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-700 font-black mb-2">:</span>
                        <div className="flex flex-col items-center">
                          <span className="font-black text-gray-900 dark:text-white text-base leading-none">
                            {convertDigits(timeLeft.minutes.toString().padStart(2, '0'), isBn)}
                          </span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">{isBn ? 'মিনিট' : 'MIN'}</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-700 font-black mb-2">:</span>
                        <div className="flex flex-col items-center">
                          <span className="font-black text-rose-600 text-base leading-none">
                            {convertDigits(timeLeft.seconds.toString().padStart(2, '0'), isBn)}
                          </span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">{isBn ? 'সেকেন্ড' : 'SEC'}</span>
                        </div>
                      </>
                    ) : null}
                  </div>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
