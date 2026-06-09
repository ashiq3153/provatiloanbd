import { Bell, ArrowDownToLine, ArrowUpFromLine, Wallet, ArrowRight, Star, FileText, Eye, EyeOff, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency, formatNumber } from '../lib/translation';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getActiveLoans, getSuccessStories, getTransactions, getLoanApplications } from '../lib/api';
import type { DashboardStats } from '../lib/api';
import type { LoanApplication, SuccessStory, Transaction } from '../types/database';
import personalImg from '../assets/categories/personal.png';
import businessImg from '../assets/categories/business.png';
import expatImg from '../assets/categories/expat.png';
import studentImg from '../assets/categories/student.png';
import emergencyImg from '../assets/categories/emergency.png';
import womenImg from '../assets/categories/women.png';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);
  const [completedEmisCount, setCompletedEmisCount] = useState(0);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  
  // Dynamic Notifications State
  const [userLoans, setUserLoans] = useState<LoanApplication[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const user = getTelegramUser();
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashStats, activeLoans, successStoriesData, allTransactions, allLoans] = await Promise.all([
          getDashboardStats(user.id),
          getActiveLoans(user.id),
          getSuccessStories(),
          getTransactions(user.id),
          getLoanApplications(user.id),
        ]);

        setStats(dashStats);
        setUserLoans(allLoans);
        setUserTransactions(allTransactions);
        const loan = activeLoans.length > 0 ? activeLoans[0] : null;
        setActiveLoan(loan);
        if (loan) {
          const completedCount = allTransactions.filter(
            t => t.type === 'emi_payment' && t.loan_id === loan.id && t.status === 'completed'
          ).length;
          setCompletedEmisCount(completedCount);
        }
        setStories(successStoriesData.length > 0 ? successStoriesData : []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  useEffect(() => {
    if (stories.length < 2) return;
    const slideTimer = setInterval(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
    }, 3000);
    return () => clearInterval(slideTimer);
  }, [stories.length]);

  const safeStoryIndex = currentStoryIndex % Math.max(stories.length, 1);

  const allLoanCategories = [
    { id: 'business', name: isBn ? 'ব্যবসায়ী ঋণ' : 'Business', icon: '🏢', image: businessImg, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'personal', name: isBn ? 'চাকরিজীবী' : 'Salaried (Personal)', icon: '👤', image: personalImg, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'expat', name: isBn ? 'প্রবাসী ঋণ' : 'Expatriate', icon: '✈️', image: expatImg, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
    { id: 'student', name: isBn ? 'শিক্ষার্থী ঋণ' : 'Student', icon: '🎓', image: studentImg, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    { id: 'emergency', name: isBn ? 'জরুরি ঋণ' : 'Emergency', icon: '🚨', image: emergencyImg, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    { id: 'women', name: isBn ? 'নারী উদ্যোক্তা' : 'Women Entrepreneur', icon: '🏆', image: womenImg, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  ];

  const displayCategories = allLoanCategories.filter(cat => systemSettings?.categories?.[cat.id]?.enabled !== false);

  const chartData = [
    { name: isBn ? 'জানু' : 'Jan', amount: 45000 },
    { name: isBn ? 'ফেব' : 'Feb', amount: 52000 },
    { name: isBn ? 'মার্চ' : 'Mar', amount: 48000 },
    { name: isBn ? 'এপ্রিল' : 'Apr', amount: 61000 },
    { name: isBn ? 'মে' : 'May', amount: stats?.totalBalance || 0 },
  ];

  const getNotifications = () => {
    const list: { id: string; title: string; time: string; type: string; status: string; link?: string }[] = [];

    userLoans.forEach(loan => {
      const cat = loan.loan_category === 'personal' ? (isBn ? 'ব্যক্তিগত' : 'Salaried') :
                  loan.loan_category === 'business' ? (isBn ? 'ব্যবসায়িক' : 'Business') :
                  loan.loan_category === 'expat' ? (isBn ? 'প্রবাসী' : 'Expatriate') :
                  loan.loan_category === 'student' ? (isBn ? 'শিক্ষা' : 'Student') :
                  loan.loan_category === 'emergency' ? (isBn ? 'জরুরি' : 'Emergency') : (isBn ? 'নারী উদ্যোক্তা' : 'Women Entrepreneur');

      const amountText = formatCurrency(loan.amount, isBn);
      const appliedDate = new Date(loan.applied_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US');

      if (loan.status === 'under_review') {
        list.push({
          id: `loan-review-${loan.id}`,
          title: isBn 
            ? `আপনার ${amountText} (${cat}) লোন আবেদনটির রিভিউ চলছে।` 
            : `Your ${amountText} (${cat}) loan application is under review.`,
          time: appliedDate,
          type: 'loan',
          status: 'under_review',
          link: `/application/${loan.id}`
        });
      } else if (loan.status === 'approved') {
        list.push({
          id: `loan-approved-${loan.id}`,
          title: isBn 
            ? `🎉 অভিনন্দন! আপনার ${amountText} (${cat}) লোন আবেদনটি অনুমোদিত হয়েছে।` 
            : `🎉 Congratulations! Your ${amountText} (${cat}) loan application has been approved.`,
          time: appliedDate,
          type: 'loan',
          status: 'approved',
          link: `/application/${loan.id}`
        });
      } else if (loan.status === 'rejected') {
        list.push({
          id: `loan-rejected-${loan.id}`,
          title: isBn 
            ? `দুঃখিত, আপনার ${amountText} (${cat}) লোন আবেদনটি বাতিল করা হয়েছে।` 
            : `Sorry, your ${amountText} (${cat}) loan application has been rejected.`,
          time: appliedDate,
          type: 'loan',
          status: 'rejected',
          link: `/application/${loan.id}`
        });
      } else if (loan.status === 'action_required') {
        list.push({
          id: `loan-action-${loan.id}`,
          title: isBn 
            ? `⚠️ আপনার ${amountText} (${cat}) লোন আবেদনে সংশোধন প্রয়োজন: ${loan.admin_feedback}` 
            : `⚠️ Your ${amountText} (${cat}) loan requires updates: ${loan.admin_feedback}`,
          time: appliedDate,
          type: 'loan',
          status: 'action_required',
          link: `/apply?edit=${loan.id}`
        });
      }
    });

    userTransactions.slice(0, 5).forEach(txn => {
      const amountText = formatCurrency(txn.amount, isBn);
      const date = new Date(txn.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US');
      const method = txn.payment_method?.toUpperCase() || '';
      
      if (txn.type === 'deposit') {
        const depType = txn.deposit_type === 'processing_fee' ? (isBn ? 'প্রসেসিং ফি' : 'Processing Fee') : (isBn ? 'সিকিউরিটি ডিপোজিট' : 'Security Deposit');
        if (txn.status === 'completed') {
          list.push({
            id: `txn-${txn.id}`,
            title: isBn 
              ? `✅ ${amountText} (${depType}) ডিপোজিট সফলভাবে জমা হয়েছে।` 
              : `✅ ${amountText} (${depType}) deposit completed successfully.`,
            time: date,
            type: 'txn',
            status: 'completed'
          });
        } else if (txn.status === 'failed') {
          list.push({
            id: `txn-${txn.id}`,
            title: isBn 
              ? `❌ ${amountText} (${depType}) ডিপোজিট অনুরোধটি বাতিল বা ব্যর্থ হয়েছে।` 
              : `❌ ${amountText} (${depType}) deposit failed or was rejected.`,
            time: date,
            type: 'txn',
            status: 'failed'
          });
        }
      } else if (txn.type === 'withdraw') {
        if (txn.status === 'completed') {
          list.push({
            id: `txn-${txn.id}`,
            title: isBn 
              ? `✅ ${amountText} অর্থ উত্তোলন সফল হয়েছে।` 
              : `✅ ${amountText} withdrawal completed successfully.`,
            time: date,
            type: 'txn',
            status: 'completed'
          });
        } else if (txn.status === 'failed') {
          list.push({
            id: `txn-${txn.id}`,
            title: isBn 
              ? `❌ ${amountText} অর্থ উত্তোলন ব্যর্থ হয়েছে।` 
              : `❌ ${amountText} withdrawal failed.`,
            time: date,
            type: 'txn',
            status: 'failed'
          });
        }
      }
    });

    return list;
  };

  // Helper to compute the loan/savings status configuration
  const getStatusConfig = () => {
    if (!activeLoan) {
      return {
        title: isBn ? 'সক্রিয় কোনো লোন নেই' : 'No Active Loan',
        description: isBn 
          ? 'নতুন লোনের জন্য এখনই আবেদন করুন এবং সহজ কিস্তিতে ঋণ সুবিধা উপভোগ করুন।'
          : 'Apply now for a loan and enjoy low-interest, easy installment plans.',
        icon: FileText,
        iconBg: 'bg-gray-100 dark:bg-gray-700',
        iconColor: 'text-gray-500 dark:text-gray-400',
        iconClass: '',
        textColor: 'text-gray-800 dark:text-gray-200',
        badgeBg: 'bg-gray-100 dark:bg-gray-700',
        badgeColor: 'text-gray-500 dark:text-gray-400',
        badgeText: isBn ? 'উপলব্ধ নেই' : 'N/A'
      };
    }

    // Check if security deposit has been made (completed transaction of deposit_type === 'security_deposit')
    const hasSecurityDeposit = userTransactions.some(
      t => t.type === 'deposit' && t.deposit_type === 'security_deposit' && t.status === 'completed'
    );

    // Check if loan has already been withdrawn (completed transaction of type === 'withdraw')
    const hasWithdrawn = userTransactions.some(
      t => t.type === 'withdraw' && t.status === 'completed'
    );

    if (!hasSecurityDeposit) {
      return {
        title: isBn ? 'লোন উত্তোলনের জন্য সঞ্চয় জমা প্রয়োজন' : 'Savings Deposit Required',
        description: isBn 
          ? 'আপনার লোনটি অনুমোদিত হয়েছে। অর্থ উত্তোলনের জন্য প্রসেসিং ফি এবং সঞ্চয় ডিপোজিট সম্পূর্ণ করুন।'
          : 'Your loan is approved. Please deposit the processing fee and required savings to withdraw.',
        icon: AlertCircle,
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconClass: 'animate-pulse',
        textColor: 'text-amber-800 dark:text-amber-300',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
        badgeColor: 'text-amber-700 dark:text-amber-400',
        badgeText: isBn ? 'সঞ্চয় জমা প্রয়োজন' : 'Deposit Required'
      };
    }

    if (!hasWithdrawn) {
      return {
        title: isBn ? 'সঞ্চয় যাচাই সম্পন্ন — উত্তোলন উপলব্ধ' : 'Savings Verified — Withdrawal Available',
        description: isBn 
          ? 'আপনার সঞ্চয় ডিপোজিট সফলভাবে যাচাই করা হয়েছে। আপনি এখন সম্পূর্ণ অর্থ উত্তোলন করতে পারেন।'
          : 'Your savings deposit has been successfully verified. You can now withdraw the full amount.',
        icon: CheckCircle2,
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconClass: '',
        textColor: 'text-emerald-800 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        badgeColor: 'text-emerald-700 dark:text-emerald-400',
        badgeText: isBn ? 'উত্তোলন উপলব্ধ' : 'Available'
      };
    }

    return {
      title: isBn ? 'লোন বিতরণ সম্পন্ন' : 'Loan Disbursement Completed',
      description: isBn 
        ? 'আপনার লোনের অর্থ সফলভাবে বিতরণ করা হয়েছে। নির্ধারিত সময়ে ইএমআই পরিশোধ করুন।'
        : 'Your loan has been successfully disbursed. Please pay your EMIs on time.',
      icon: CheckCircle2,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconClass: '',
      textColor: 'text-blue-800 dark:text-blue-300',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
      badgeColor: 'text-blue-700 dark:text-blue-400',
      badgeText: isBn ? 'বিতরণ সম্পন্ন' : 'Disbursed'
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="p-5 pb-10 space-y-6 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-[28px] shadow-[0_10px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgb(0,0,0,0.2)] border border-gray-50 dark:border-gray-700 mb-2 transition-colors">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full p-[3px] bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500">
              <img
                src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`}
                alt="Profile"
                className="w-full h-full rounded-full border-2 border-white dark:border-gray-800 object-cover transition-colors"
              />
            </div>
            {/* Verified Badge */}
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 p-0.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5 transition-colors">
              {isBn ? 'স্বাগতম' : 'Welcome back'}
            </p>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5 transition-colors">
              {user.first_name} {user.last_name}
            </h1>
          </div>
        </div>
        <div className="relative">
          <div
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-inner cursor-pointer active:scale-95 transition-all flex items-center justify-center relative"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors" />
            {getNotifications().length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-700 shadow-sm shadow-red-500/50 transition-colors animate-pulse"></span>
            )}
          </div>

          {/* Premium Glassmorphic Notifications Panel */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop overlay to close when clicked outside */}
                <div 
                  className="fixed inset-0 z-45" 
                  onClick={() => setShowNotifications(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-[24px] shadow-2xl p-5 z-50 overflow-hidden"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700 mb-3">
                    <h4 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell size={18} className="text-primary-500" />
                      {isBn ? 'নোটিফিকেশন সমূহ' : 'Notifications'}
                    </h4>
                    <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {convertDigits(getNotifications().length, isBn)} {isBn ? 'টি' : 'Items'}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {getNotifications().length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">{isBn ? 'নতুন কোনো নোটিফিকেশন নেই' : 'No new notifications'}</p>
                      </div>
                    ) : (
                      getNotifications().map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            if (notif.link) {
                              navigate(notif.link);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3.5 rounded-xl border flex gap-3 transition-all ${
                            notif.link ? 'hover:bg-primary-50/20 dark:hover:bg-primary-900/10 cursor-pointer active:scale-98' : ''
                          } ${
                            notif.status === 'under_review' ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30 text-purple-950 dark:text-purple-300' :
                            notif.status === 'approved' || notif.status === 'completed' ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-300' :
                            notif.status === 'rejected' || notif.status === 'failed' ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-950 dark:text-rose-300' :
                            notif.status === 'action_required' ? 'bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30 text-orange-950 dark:text-orange-300' :
                            'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-normal mb-1.5 break-words text-gray-900 dark:text-white">{notif.title}</p>
                            <span className="text-[10px] opacity-60 font-medium text-gray-500 dark:text-gray-400">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notice Board Marquee */}
      {systemSettings?.announcementActive && (
        <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 rounded-2xl py-3 px-4 overflow-hidden relative flex items-center gap-3 shadow-sm transition-all">
          <span className="bg-primary-500 text-white text-[10px] uppercase font-bold py-1 px-2.5 rounded shrink-0 relative z-10 shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            {isBn ? 'বিজ্ঞপ্তি' : 'Notice'}
          </span>
          <div className="overflow-hidden flex-1 relative w-full h-5">
            <div className="whitespace-nowrap absolute animate-marquee font-bold text-xs text-primary-700 dark:text-primary-400 leading-normal hover:[animation-play-state:paused] cursor-pointer">
              {isBn ? systemSettings.announcementBn : systemSettings.announcementEn}
            </div>
          </div>
        </div>
      )}

      {/* Balance and Status Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-16">
        {/* Balance Card Wrapper */}
        <div className="md:col-span-2 relative mb-12 md:mb-0">
          {/* Main blue card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] px-6 pt-6 pb-16 text-white shadow-lg relative overflow-hidden h-full flex flex-col justify-between">
            {/* Header row */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-bold text-blue-50">{isBn ? 'পোর্টফোলিও ব্যালেন্স' : 'Portfolio Balances'}</span>
                <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-blue-200 hover:text-white transition-colors">
                  {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>

            {/* Grid of Balances */}
            <div className="grid grid-cols-2 gap-4 relative z-10 my-auto pb-6">
              <div>
                <p className="text-xs text-blue-200 font-semibold mb-1.5 uppercase tracking-wider">{isBn ? 'মোট ব্যালেন্স' : 'Total Balance'}</p>
                <h2 className="text-3xl font-black tracking-tight">
                  {balanceVisible
                    ? formatCurrency(stats?.totalBalance || 0, isBn)
                    : (isBn ? '৳•••••' : '৳•••••')
                  }
                </h2>
              </div>
              
              <div className="border-l border-white/10 pl-4">
                <p className="text-xs text-blue-200 font-semibold mb-1.5 uppercase tracking-wider">{isBn ? 'সঞ্চয় ব্যালেন্স' : 'Savings Balance'}</p>
                <h2 className="text-3xl font-black tracking-tight">
                  {balanceVisible
                    ? formatCurrency(stats?.savingsBalance || 0, isBn)
                    : (isBn ? '৳•••••' : '৳•••••')
                  }
                </h2>
              </div>
            </div>

            {/* Decorative building */}
            <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="10" y="20" width="20" height="60" fill="white" />
                <rect x="35" y="5" width="20" height="75" fill="white" />
                <rect x="60" y="30" width="15" height="50" fill="white" />
              </svg>
            </div>
          </div>

          {/* Floating Deposit & Withdraw cards */}
          <div className="absolute -bottom-10 left-4 right-4 flex gap-4">
            <Link
              to="/deposit"
              className="flex-1 bg-emerald-500 rounded-2xl p-4 flex items-center gap-3 shadow-[0_8px_30px_rgba(16,185,129,0.45)] active:scale-95 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(16,185,129,0.55)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ArrowDownToLine size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold leading-none mb-1">
                  {isBn ? 'ডিপোজিট' : 'DEPOSIT'}
                </p>
                <p className="text-lg font-black text-white leading-none">
                  {balanceVisible ? formatCurrency(stats?.depositBalance || 0, isBn) : '৳•••'}
                </p>
              </div>
            </Link>

            <Link
              to="/withdraw"
              className="flex-1 bg-rose-500 rounded-2xl p-4 flex items-center gap-3 shadow-[0_8px_30px_rgba(244,63,94,0.45)] active:scale-95 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(244,63,94,0.55)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ArrowUpFromLine size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] text-rose-100 uppercase tracking-widest font-bold leading-none mb-1">
                  {isBn ? 'উত্তোলন' : 'WITHDRAW'}
                </p>
                <p className="text-lg font-black text-white leading-none">
                  {balanceVisible ? formatCurrency(stats?.withdrawBalance || 0, isBn) : '৳•••'}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Status Card */}
        {(() => {
          const StatusIcon = statusConfig.icon;
          return (
            <div className="bg-white dark:bg-gray-800 rounded-[24px] p-5 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-all relative overflow-hidden">
              {/* Decorative subtle background icon */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50/30 dark:bg-primary-900/10 rounded-bl-full -mr-6 -mt-6 z-0"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-extrabold block mb-1">
                    {isBn ? 'লোন স্ট্যাটাস' : 'Loan Status'}
                  </span>
                  <h4 className={`text-base font-black ${statusConfig.textColor} leading-snug mb-2`}>
                    {statusConfig.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {statusConfig.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusConfig.iconBg} ${statusConfig.iconColor}`}>
                    <StatusIcon size={20} className={statusConfig.iconClass} />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusConfig.badgeBg} ${statusConfig.badgeColor}`}>
                      {statusConfig.badgeText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Quick Actions - Original Style */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            {isBn ? 'কুইক অ্যাকশন' : 'Quick Actions'}
          </h3>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer">
            {isBn ? 'সব দেখুন' : 'See All'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: isBn ? 'ডিপোজিট' : 'Deposit', icon: ArrowDownToLine, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', link: '/deposit' },
            { name: isBn ? 'উত্তোলন' : 'Withdraw', icon: ArrowUpFromLine, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', link: '/withdraw' },
            { name: isBn ? 'আবেদন' : 'Apply', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', link: '/apply' },
            { name: isBn ? 'ইএমআই' : 'EMI Pay', icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', link: '/pay' },
          ].map((action, i) => (
            <Link key={i} to={action.link} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.bg} ${action.color}`}>
                <action.icon size={24} />
              </div>
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Loan */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 transition-colors">
          {isBn ? 'সক্রিয় লোন' : 'Active Loan'}
        </h3>
        {loading ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-5 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-[18px] shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1 w-1/2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-1 w-1/4 text-right">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-3/4 ml-auto" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ) : activeLoan ? (
          (() => {
            const progressPercent = Math.min(Math.round((completedEmisCount / activeLoan.tenure_months) * 100), 100);
            const outstanding = Math.max(activeLoan.amount - (completedEmisCount * activeLoan.emi_amount), 0);
            
            const getCategoryName = (category: string) => {
              switch (category) {
                case 'business': return isBn ? 'ব্যবসায়িক লোন' : 'Business Loan';
                case 'personal': return isBn ? 'ব্যক্তিগত লোন' : 'Personal Loan';
                case 'home': return isBn ? 'বাড়ি লোন' : 'Home Loan';
                case 'car': return isBn ? 'গাড়ি লোন' : 'Car Loan';
                case 'medical': return isBn ? 'চিকিৎসা লোন' : 'Medical Loan';
                case 'freelancer': return isBn ? 'ফ্রিল্যান্সার লোন' : 'Freelancer Loan';
                case 'probashi': return isBn ? 'প্রবাসী লোন' : 'Probashi Loan';
                case 'education': return isBn ? 'শিক্ষা লোন' : 'Education Loan';
                case 'women': return isBn ? 'নারী উদ্যোক্তা লোন' : 'Women Entrepreneur Loan';
                case 'student': return isBn ? 'স্টুডেন্ট লোন' : 'Student Loan';
                case 'emergency': return isBn ? 'জরুরি লোন' : 'Emergency Loan';
                default: return isBn ? 'লোন' : 'Loan';
              }
            };

            const getCategoryIcon = (category: string) => {
              const cat = allLoanCategories.find(c => c.id === category);
              return cat ? cat.icon : '🏢';
            };

            const getNextEmiDate = () => {
              const today = new Date();
              let dueMonth = today.getMonth();
              let dueYear = today.getFullYear();
              if (today.getDate() > 25) {
                dueMonth += 1;
                if (dueMonth > 11) {
                  dueMonth = 0;
                  dueYear += 1;
                }
              }
              const dueDate = new Date(dueYear, dueMonth, 25);
              return dueDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            };

            return (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-5 shadow-[0_20px_40px_-15px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgb(0,0,0,0.3)] border border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/20 rounded-bl-full -mr-10 -mt-10 z-0 transition-colors"></div>
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-[18px] flex items-center justify-center text-2xl shrink-0 relative z-10 shadow-inner transition-colors">
                  {getCategoryIcon(activeLoan.loan_category)}
                </div>
                <div className="flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white transition-colors flex items-center gap-1.5 flex-wrap">
                        {getCategoryName(activeLoan.loan_category)}
                        <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] rounded-full uppercase tracking-wide transition-colors font-bold">
                          {isBn ? 'সক্রিয়' : 'Active'}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                        {isBn ? 'লোন আইডি' : 'Loan ID'}: {convertDigits(`LN-${activeLoan.id.slice(0, 8).toUpperCase()}`, isBn)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 transition-colors">
                        {isBn ? 'বকেয়া' : 'Outstanding'}
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white transition-colors">{formatCurrency(outstanding, isBn)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full flex-1 overflow-hidden shadow-inner transition-colors">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 transition-colors">{convertDigits(`${progressPercent}%`, isBn)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium transition-colors">
                    {isBn ? 'পরবর্তী ইএমআই' : 'Next EMI'}: <span className="text-gray-700 dark:text-gray-300 transition-colors">{getNextEmiDate()}</span>
                  </p>

                  {/* Chart Section within Active Loan */}
                  <div className="mt-6 h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}
                          itemStyle={{ fontWeight: '900', color: '#111827' }}
                          formatter={(value) => [formatCurrency(value as number, isBn), isBn ? 'ব্যালেন্স' : 'Balance']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_20px_40px_-15px_rgb(0,0,0,0.06)] dark:shadow-[0_20px_40px_-15px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 dark:bg-primary-900/10 rounded-bl-full -mr-10 -mt-10 z-0"></div>
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 shrink-0 relative z-10 shadow-inner">
              <FileText size={32} />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1 relative z-10">
              {isBn ? 'কোনো সক্রিয় লোন নেই' : 'No Active Loan'}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-[280px] relative z-10 leading-relaxed">
              {isBn 
                ? 'সহজ শর্তে লোন পেতে এবং আপনার স্বপ্নের প্রজেক্ট শুরু করতে এখনই আবেদন করুন!' 
                : 'Apply now to get low-interest loans easily and start your dream project!'}
            </p>
            <Link 
              to="/apply" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-primary-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 relative z-10"
            >
              {isBn ? 'লোনের জন্য আবেদন করুন' : 'Apply for a Loan'}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Success Stories */}
      {stories.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg transition-colors">
              {isBn ? 'সাফল্যের গল্প' : 'Success Stories'}
            </h3>
          </div>
          <div className="relative pb-6 px-1 h-[210px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStoryIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 px-1"
              >
                <div className="relative rounded-[26px] p-[3px] overflow-hidden shadow-lg">
                  {/* Rainbow spinning background */}
                  <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,red,orange,yellow,green,blue,indigo,violet,red)] animate-[spin_4s_linear_infinite]" />

                  {/* Inner Card content */}
                  <div className="relative w-full h-full bg-white dark:bg-gray-800 rounded-[23px] p-5 border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="absolute top-4 right-4 text-blue-100 dark:text-blue-900/50 transition-colors">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                    </div>
                    <div className="flex gap-3 mb-3 relative z-10 w-full overflow-hidden">
                      <img
                        src={stories[safeStoryIndex].avatar_url || `https://ui-avatars.com/api/?name=${stories[safeStoryIndex].name}&background=random`}
                        alt={stories[safeStoryIndex].name}
                        onError={(e) => {
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(stories[safeStoryIndex].name)}&background=random`;
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1 transition-colors truncate">
                          {stories[safeStoryIndex].name}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" className="shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 transition-colors truncate">{stories[safeStoryIndex].loan_type}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400 transition-colors">{formatCurrency(stories[safeStoryIndex].amount || 0, isBn)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors truncate">{convertDigits(stories[safeStoryIndex].approval_time, isBn)}</p>
                    </div>
                    <div className="flex gap-1 text-yellow-400">
                      {[...Array(stories[safeStoryIndex].rating || 5)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Loan Categories */}
      <div className="pb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg transition-colors">
            {isBn ? 'লোন ক্যাটাগরি' : 'Loan Categories'}
          </h3>
          <Link to="/apply" className="text-primary-600 dark:text-primary-400 text-sm font-medium transition-colors hover:text-primary-500 dark:hover:text-primary-300">
            {isBn ? 'সব দেখুন' : 'View All'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {displayCategories.map((cat, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(`/apply?category=${cat.id}`)}
              className="group w-full text-left bg-white dark:bg-gray-800 rounded-[20px] flex overflow-hidden shadow-[0_10px_30px_-15px_rgb(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgb(0,0,0,0.3)] border border-gray-50 dark:border-gray-700 transition-all hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex-1 p-4 flex items-center gap-3 relative z-10 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner transition-colors shrink-0 ${cat.color}`}>
                  {cat.icon}
                </div>
                <span className="font-bold text-sm text-gray-800 dark:text-gray-100 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">{cat.name}</span>
              </div>
              
              {/* Subtle background card preview */}
              <div className="relative w-12 h-full overflow-hidden shrink-0 self-stretch hidden xs:block">
                <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-gray-800 via-white/40 dark:via-gray-800/40 to-transparent z-10 pointer-events-none" />
                <img 
                  src={cat.image} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                />
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
