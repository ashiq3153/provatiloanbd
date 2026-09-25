import '../styles/home-semantic.css';
import logoImg from '../assets/logo.png';
import {
  Bell, ArrowDownToLine, ArrowUpFromLine, Wallet, ArrowRight,
  FileText, CreditCard, PiggyBank, ReceiptText, FolderOpen,
  ChevronRight, CalendarDays, CheckCircle2, Clock3, AlertCircle,
  ShieldCheck, Eye, EyeOff, UserRound, Star, BriefcaseBusiness, House, HeartPulse, Plane, UsersRound
} from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { formatCurrency, convertDigits } from '../lib/translation';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { toast } from 'sonner';
import {
  getDashboardStats, getActiveLoans, getTransactions,
  getLoanApplications, getMyNotifications, markMyNotificationRead, getSuccessStories, reactToSuccessStory, getLoanEmiSchedule
} from '../lib/api';
import type { DashboardStats } from '../lib/api';
import type { LoanApplication, Transaction, SuccessStory, LoanEmiSchedule } from '../types/database';

export default function Home() {
  const user = getTelegramUser();
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [balanceView, setBalanceView] = useState<'savings' | 'outstanding'>('savings');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [storyReactions, setStoryReactions] = useState<Record<string, { like: number; love: number; wow: number }>>({});
  const [emiSchedule, setEmiSchedule] = useState<LoanEmiSchedule[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, active, tx, allLoans, notices] = await Promise.all([
          getDashboardStats(user.id),
          getActiveLoans(user.id),
          getTransactions(user.id),
          getLoanApplications(user.id),
          getMyNotifications().catch(() => [])
        ]);
        if (!mounted) return;
        setStats(s);
        setActiveLoan(active[0] || null);
        setTransactions(tx || []);
        setLoans(allLoans || []);
        setNotifications(notices || []);
        setStories(await getSuccessStories());
        if (active[0]?.id) setEmiSchedule(await getLoanEmiSchedule(active[0].id));
      } catch (e) {
        console.error('Home dashboard error:', e);
        if (mounted) setError(isBn ? 'ড্যাশবোর্ডের তথ্য লোড করা যায়নি।' : 'Could not load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user.id]);

  const retryDashboard = () => { window.location.reload(); };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const completedEmis = emiSchedule.filter(e => e.status === 'paid').length;
  const scheduledRepayment = emiSchedule.length
    ? emiSchedule.reduce((sum, e) => sum + Number(e.total_due || 0), 0)
    : Number(activeLoan?.total_payable || 0);
  const paidAmount = emiSchedule.length
    ? emiSchedule.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0)
    : transactions
        .filter(t => t.type === 'emi_payment' && t.loan_id === activeLoan?.id && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const loanProgress = activeLoan
    ? Math.min(100, Math.round((paidAmount / Math.max(scheduledRepayment, 1)) * 100))
    : 0;
  const outstanding = activeLoan
    ? Math.max(0, scheduledRepayment - paidAmount)
    : 0;
  const nextInstallment = emiSchedule.find(e => ['pending','partial','overdue'].includes(e.status));
  const nextEmiDate = nextInstallment
    ? new Date(nextInstallment.due_date).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const categoryName = (category?: string) => {
    const names: Record<string, string> = {
      personal: isBn ? 'ব্যক্তিগত ঋণ' : 'Personal Loan',
      business: isBn ? 'ব্যবসায়িক ঋণ' : 'Business Loan',
      home: isBn ? 'বাড়ি ঋণ' : 'Home Loan',
      car: isBn ? 'গাড়ি ঋণ' : 'Car Loan',
      medical: isBn ? 'চিকিৎসা ঋণ' : 'Medical Loan',
      probashi: isBn ? 'প্রবাসী ঋণ' : 'Probashi Loan',
      education: isBn ? 'শিক্ষা ঋণ' : 'Education Loan',
      student: isBn ? 'শিক্ষার্থী ঋণ' : 'Student Loan',
      women: isBn ? 'নারী উদ্যোক্তা ঋণ' : 'Women Entrepreneur Loan',
      agriculture: isBn ? 'কৃষি ঋণ' : 'Agriculture Loan',
      emergency: isBn ? 'জরুরি ঋণ' : 'Emergency Loan',
    };
    return names[category || ''] || (isBn ? 'ঋণ' : 'Loan');
  };

  const nextAction = (() => {
    if (!activeLoan) {
      const actionRequired = loans.find(l => l.status === 'action_required');
      if (actionRequired) return {
        title: isBn ? 'লোন আবেদনে সংশোধন প্রয়োজন' : 'Loan application needs action',
        description: isBn ? 'আপনার আবেদনের কিছু তথ্য আপডেট করতে হবে।' : 'Some information needs to be updated.',
        link: `/apply?edit=${actionRequired.id}`,
        icon: AlertCircle,
        tone: 'amber'
      };
      const pending = loans.find(l => ['pending', 'under_review'].includes(l.status));
      if (pending) return {
        title: isBn ? 'আপনার লোন আবেদন পর্যালোচনায় আছে' : 'Your loan application is under review',
        description: categoryName(pending.loan_category),
        link: `/application/${pending.id}`,
        icon: Clock3,
        tone: 'blue'
      };
      return {
        title: isBn ? 'আপনার প্রথম লোন আবেদন শুরু করুন' : 'Start your first loan application',
        description: isBn ? 'আপনার প্রয়োজন অনুযায়ী ঋণ সেবা নির্বাচন করুন।' : 'Choose a loan service that matches your need.',
        link: '/apply',
        icon: FileText,
        tone: 'blue'
      };
    }
    if (completedEmis < activeLoan.tenure_months) return {
      title: isBn ? 'পরবর্তী কিস্তি প্রস্তুত' : 'Next installment',
      description: nextInstallment ? `${formatCurrency(nextInstallment.total_due, isBn)} • ${nextEmiDate}` : (isBn ? `পরবর্তী কিস্তি ${formatCurrency(activeLoan.emi_amount, isBn)}` : `Next installment ${formatCurrency(activeLoan.emi_amount, isBn)}`),
      link: '/pay',
      icon: CalendarDays,
      tone: 'blue'
    };
    return {
      title: isBn ? 'ঋণ পরিশোধ সম্পন্ন' : 'Loan repayment completed',
      description: isBn ? 'আপনার ঋণ হিসাব দেখুন।' : 'Review your completed loan account.',
      link: `/application/${activeLoan.id}`,
      icon: CheckCircle2,
      tone: 'green'
    };
  })();

  const quickActions = [
    { label: isBn ? 'ঋণ আবেদন' : 'Apply Loan', sub: isBn ? 'নতুন আবেদন' : 'New application', icon: FileText, link: '/apply' },
    { label: isBn ? 'কিস্তি' : 'EMI', sub: isBn ? 'পরিশোধ করুন' : 'Make payment', icon: CreditCard, link: '/pay' },
    { label: isBn ? 'সঞ্চয়' : 'Savings', sub: isBn ? 'জমা দিন' : 'Deposit', icon: PiggyBank, link: '/deposit' },
    { label: isBn ? 'ডকুমেন্ট' : 'Documents', sub: isBn ? 'নথি দেখুন' : 'View files', icon: FolderOpen, link: '/profile' },
    { label: isBn ? 'আমার ঋণ' : 'My Loans', sub: isBn ? 'স্ট্যাটাস' : 'Status', icon: Wallet, link: '/loans' },
  ];


  const balanceActions = [
    { label: isBn ? 'জমা' : 'Deposit', icon: ArrowDownToLine, link: '/deposit' },
    { label: isBn ? 'উত্তোলন' : 'Withdraw', icon: ArrowUpFromLine, link: '/transactions' },
    { label: isBn ? 'লেনদেন' : 'Transactions', icon: ReceiptText, link: '/transactions' },
    { label: isBn ? 'টপ আপ' : 'Top up', icon: Wallet, link: '/deposit' },
    { label: isBn ? 'ইতিহাস' : 'History', icon: CalendarDays, link: '/transactions' },
  ];
  const categories = [
    ['personal', isBn ? 'ব্যক্তিগত' : 'Personal'],
    ['business', isBn ? 'ব্যবসায়িক' : 'Business'],
    ['home', isBn ? 'বাড়ি' : 'Home'],
    ['medical', isBn ? 'চিকিৎসা' : 'Medical'],
    ['probashi', isBn ? 'প্রবাসী' : 'Probashi'],
    ['women', isBn ? 'নারী উদ্যোক্তা' : 'Women'],
  ];

  const recentTransactions = transactions.slice(0, 4);
  const formatActivityStatus = (status: string) => status === 'completed' ? (isBn ? 'সম্পন্ন' : 'Completed') : status === 'pending' ? (isBn ? 'অপেক্ষমাণ' : 'Pending') : status === 'failed' ? (isBn ? 'ব্যর্থ' : 'Failed') : status;
  const activityLabel = (type: string) => type === 'deposit' ? (isBn ? 'সঞ্চয়/ডিপোজিট' : 'Deposit') : type === 'emi_payment' ? (isBn ? 'কিস্তি পরিশোধ' : 'EMI payment') : type === 'disbursement' ? (isBn ? 'ঋণ বিতরণ' : 'Loan disbursement') : (isBn ? 'উত্তোলন' : 'Withdrawal');
  const latestApplication = [...loans].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())[0] || null;

  const applicationStatus = (status?: string) => {
    const map: Record<string, { bn: string; en: string; tone: string }> = {
      pending: { bn: 'আবেদন জমা হয়েছে', en: 'Application submitted', tone: 'sky' },
      under_review: { bn: 'যাচাই চলছে', en: 'Under review', tone: 'amber' },
      approved: { bn: 'অনুমোদিত', en: 'Approved', tone: 'green' },
      active: { bn: 'ঋণ চলমান', en: 'Loan active', tone: 'green' },
      completed: { bn: 'ঋণ সম্পন্ন', en: 'Loan completed', tone: 'green' },
      rejected: { bn: 'আবেদন প্রত্যাখ্যাত', en: 'Application rejected', tone: 'red' },
      cancelled: { bn: 'আবেদন বাতিল', en: 'Application cancelled', tone: 'slate' },
      action_required: { bn: 'আপনার পদক্ষেপ প্রয়োজন', en: 'Action required', tone: 'amber' },
    };
    return map[status || ''] || { bn: 'স্ট্যাটাস আপডেট', en: 'Status update', tone: 'slate' };
  };

  const loanCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      personal: UserRound,
      business: BriefcaseBusiness,
      home: House,
      medical: HeartPulse,
      probashi: Plane,
      women: UsersRound,
    };
    return icons[category] || ShieldCheck;
  };

  const handleStoryReaction = async (story: SuccessStory, type: 'like' | 'love' | 'wow') => {
    const ok = await reactToSuccessStory(story.id, type);
    if (!ok) {
      toast.error(isBn ? 'রিঅ্যাকশন দেওয়া যায়নি' : 'Could not add reaction');
      return;
    }
    setStoryReactions(prev => ({
      ...prev,
      [story.id]: {
        like: prev[story.id]?.like ?? Number(story.like_count || 0),
        love: prev[story.id]?.love ?? Number(story.love_count || 0),
        wow: prev[story.id]?.wow ?? Number(story.wow_count || 0),
        [type]: (prev[story.id]?.[type] ?? Number(story[`${type}_count` as keyof SuccessStory] || 0)) + 1,
      }
    }));
  };

  const markReadAndOpen = async (n: any) => {
    if (!n.is_read) {
      await markMyNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    setShowNotifications(false);
    if (n.entity_type === 'loan' && n.entity_id) navigate(`/application/${n.entity_id}`);
  };

  return (

    <main className="home-modern app-home-theme w-full min-w-0 bg-[#f6f8fc] dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 pb-[calc(6rem+env(safe-area-inset-bottom))] transition-colors">
      <div className="px-3 sm:px-4 pt-0 space-y-4">

        {error && !loading && (
          <section className="bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900 rounded-2xl p-5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><AlertCircle size={19} className="text-rose-600"/></div>
            <h2 className="text-sm font-black mt-3">{isBn ? 'তথ্য লোড হয়নি' : 'Data could not be loaded'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
            <button onClick={retryDashboard} className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black">{isBn ? 'আবার চেষ্টা করুন' : 'Try again'}</button>
          </section>
        )}

        {/* Header */}
        <header className="home-dashboard-header relative overflow-hidden flex flex-col gap-4 rounded-b-[26px] px-3 py-3 -mx-3 sm:-mx-4 sm:px-5 shadow-md">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={logoImg} alt="PROVATI LOAN" className="h-9 w-auto max-w-[180px] object-contain" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button type="button" onClick={() => setShowNotifications(v => !v)} className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white shadow-sm" aria-label="Notifications">
                  <Bell size={19} />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white/80" />}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <motion.div initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.98}} className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <strong>{isBn ? 'নোটিফিকেশন' : 'Notifications'}</strong>
                          {unreadCount > 0 && <span className="text-[10px] font-black text-sky-600">{convertDigits(unreadCount,isBn)} {isBn?'নতুন':'new'}</span>}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">{isBn ? 'নতুন কোনো নোটিফিকেশন নেই' : 'No notifications'}</div> :
                            notifications.slice(0,6).map((n:any) => (
                              <button key={n.id} onClick={() => markReadAndOpen(n)} className="w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                <div className="flex gap-3"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.is_read?'bg-slate-300':'bg-sky-500'}`} /><div className="min-w-0"><p className="text-xs font-bold leading-5">{n.title}</p><p className="text-[10px] text-slate-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString(isBn?'bn-BD':'en-US') : ''}</p></div></div>
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <Link to="/profile" className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/85 bg-slate-200 shrink-0 shadow-sm">
                <img src={user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=0ea5e9&color=fff&bold=true`} alt="Profile" className="w-full h-full object-cover" />
                <span className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </Link>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-white/80">{isBn ? 'স্বাগতম,' : 'Welcome back,'}</p>
            <h1 className="font-black text-[22px] leading-tight text-white mt-1 truncate">{user.first_name} {user.last_name || ''}</h1>
            <p className="text-[11px] font-bold text-white/80 mt-1">{isBn ? 'আপনার আর্থিক যাত্রায় আমরা আছি আপনার পাশে' : 'We are here beside you on your financial journey'}</p>
          </div>
        </header>

        {/* Notice */}
        {systemSettings?.announcementActive && (
          <Link to="/support" className="flex items-center gap-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
            <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0"><Bell size={15}/></span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-sky-600 uppercase">{isBn?'গুরুত্বপূর্ণ বিজ্ঞপ্তি':'Important notice'}</p><p className="text-xs font-bold truncate">{isBn?systemSettings.announcementBn:systemSettings.announcementEn}</p></div>
            <ChevronRight size={16} className="text-slate-400"/>
          </Link>
        )}

        {/* Approved reference balance card */}
        <section className="pv-home-financial-hero home-financial-card home-balance-art rounded-[24px] p-4 sm:p-5 text-white shadow-[0_14px_34px_rgba(39,52,195,.20)] overflow-hidden relative border border-white/20">
          <div className="home-balance-art-orb home-balance-art-orb-one" />
          <div className="home-balance-art-orb home-balance-art-orb-two" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/75">PROVATI • {isBn ? 'আমার হিসাব' : 'My account'}</p>
              <p className="mt-2 text-xs font-bold text-white/85">{balanceView==='savings'?(isBn?'বর্তমান ব্যালেন্স':'Current balance'):(isBn?'ঋণের বকেয়া':'Loan outstanding')}</p>
            </div>
            <button type="button" onClick={()=>setBalanceVisible(v=>!v)} className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white" aria-label={balanceVisible?'Hide balance':'Show balance'}>{balanceVisible?<Eye size={18}/>:<EyeOff size={18}/>}</button>
          </div>
          <div className="relative z-10 mt-1">
            <AnimatePresence mode="wait"><motion.p key={balanceView} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.2}} className="text-3xl sm:text-[38px] leading-none font-black tracking-tight text-white">{loading?<Skeleton className="h-9 w-36 bg-white/20"/>:balanceVisible?formatCurrency(balanceView==='savings'?(stats?.savingsBalance||0):(stats?.totalOutstanding||outstanding),isBn):'৳ • • • • • •'}</motion.p></AnimatePresence>
          </div>
          <p className="relative z-10 mt-2 text-[10px] font-semibold text-white/75">{isBn?'সদস্য আইডি':'Member ID'}: PSS-{String(user.id).padStart(6,'0').slice(-6)}</p>
          <div className="relative z-10 mt-4 grid grid-cols-5 gap-1.5">
            {balanceActions.map(({label,icon:Icon,link},i)=>(
              <Link key={label} to={link} className="flex flex-col items-center justify-center gap-1.5 min-w-0 py-1.5 text-white">
                <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border border-white/30 shadow-sm balance-action-icon balance-action-${i}`}><Icon size={17}/></span>
                <span className="text-[8px] sm:text-[9px] font-bold text-center text-white leading-tight truncate max-w-full">{label}</span>
              </Link>
            ))}
          </div>
          <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-full bg-black/15 p-1 border border-white/20" role="group" aria-label={isBn?'ব্যালেন্স নির্বাচন':'Select balance'}>
              <button type="button" onClick={()=>setBalanceView('savings')} className={`rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition-all ${balanceView==='savings'?'bg-white text-indigo-700 shadow-md':'text-white/85'}`}>{isBn?'সঞ্চয়':'Savings'}</button>
              <button type="button" onClick={()=>setBalanceView('outstanding')} className={`rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition-all ${balanceView==='outstanding'?'bg-white text-indigo-700 shadow-md':'text-white/85'}`}>{isBn?'ঋণ বকেয়া':'Loan due'}</button>
            </div>
            <Link to="/transactions" className="flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-3 py-1.5 text-[9px] font-extrabold text-white"><ReceiptText size={13}/>{isBn?'হিসাব':'Statement'}</Link>
          </div>
        </section>
        {/* Detailed savings, loan and repayment figures live in their dedicated screens.
            Keep the home dashboard focused on the colorful single-balance card and key actions. */}

        {/* Next important action */}
        <Link to={nextAction.link} className="home-next-action block border rounded-2xl p-3.5 shadow-sm active:scale-[.99] transition">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${nextAction.tone==='amber'?'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400':'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'}`}>
              <nextAction.icon size={20}/>
            </div>
            <div className="flex-1 min-w-0"><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn?'পরবর্তী গুরুত্বপূর্ণ কাজ':'Next important action'}</p><p className="font-black text-sm mt-1 truncate">{nextAction.title}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{nextAction.description}</p></div>
            <ChevronRight size={18} className="text-slate-400 shrink-0"/>
          </div>
        </Link>

        {/* Latest application status */}
        {!activeLoan && latestApplication && (
          <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn ? 'লোন আবেদন' : 'Loan application'}</p>
                <h2 className="text-base font-black mt-1">{categoryName(latestApplication.loan_category)}</h2>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">APP-{latestApplication.id.slice(0,8).toUpperCase()}</p>
              </div>
              {(() => { const s = applicationStatus(latestApplication.status); return <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${s.tone === 'green' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : s.tone === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : s.tone === 'red' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : s.tone === 'sky' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{isBn ? s.bn : s.en}</span>; })()}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div><p className="text-[10px] text-slate-400">{isBn ? 'আবেদনের পরিমাণ' : 'Requested amount'}</p><p className="text-sm font-black mt-1">{formatCurrency(latestApplication.amount, isBn)}</p></div>
              <div className="text-right"><p className="text-[10px] text-slate-400">{isBn ? 'আবেদনের তারিখ' : 'Applied on'}</p><p className="text-xs font-bold mt-1">{new Date(latestApplication.applied_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB')}</p></div>
            </div>
            {latestApplication.admin_feedback && (
              <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-3">
                <p className="text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">{isBn ? 'অ্যাডমিন বার্তা' : 'Admin message'}</p>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mt-1 leading-5">{latestApplication.admin_feedback}</p>
              </div>
            )}
            <Link to={latestApplication.status === 'action_required' ? `/apply?edit=${latestApplication.id}` : `/application/${latestApplication.id}`} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 text-white py-2.5 text-xs font-black">
              {latestApplication.status === 'action_required' ? (isBn ? 'আবেদন আপডেট করুন' : 'Update application') : (isBn ? 'আবেদনের বিস্তারিত' : 'View application')} <ChevronRight size={14}/>
            </Link>
          </section>
        )}


        {/* Loan journey */}
        {activeLoan && (
          <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn?'ঋণের যাত্রা':'Loan journey'}</p>
            <div className="flex items-start mt-5">
              {[
                [true,isBn?'আবেদন':'Applied'],
                [true,isBn?'যাচাই':'Review'],
                [activeLoan.status==='approved'||activeLoan.status==='active'||activeLoan.status==='completed',isBn?'অনুমোদন':'Approved'],
                [activeLoan.status==='active'||activeLoan.status==='completed',isBn?'বিতরণ':'Disbursed'],
                [activeLoan.status==='completed',isBn?'সম্পন্ন':'Completed']
              ].map(([done,label],i,arr)=>(
                <div key={String(label)} className="flex-1 relative text-center">
                  {i<arr.length-1 && <div className={`absolute top-3 left-1/2 w-full h-px ${done&&arr[i+1][0]?'bg-sky-500':'bg-slate-200 dark:bg-slate-700'}`}/>}
                  <div className={`relative mx-auto w-7 h-7 rounded-full flex items-center justify-center border-2 ${done?'bg-sky-500 border-sky-500 text-white':'bg-white dark:bg-[#111827] border-slate-300 dark:border-slate-600 text-slate-400'}`}>{done?<CheckCircle2 size={14}/>:<span className="w-1.5 h-1.5 rounded-full bg-current"/>}</div>
                  <p className="text-[8px] font-bold mt-2 text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* Mobile-first responsive spacing */}
        <div className="h-px bg-transparent sm:hidden" aria-hidden="true" />
        {/* Member services */}
        <section>
          <div className="flex justify-between items-end mb-3"><div><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn?'সদস্য সেবা':'Member services'}</p><h2 className="text-lg font-black mt-1">{isBn?'দ্রুত সেবা':'Quick services'}</h2></div></div>
          <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
            <div className="flex gap-3 w-max">
              {quickActions.map(({label,sub,icon:Icon,link}, index)=> {
                const palettes = [
                  'from-slate-800 via-indigo-900 to-slate-900',
                  'from-sky-800 via-cyan-900 to-slate-900',
                  'from-emerald-800 via-teal-900 to-slate-900',
                  'from-rose-800 via-rose-900 to-slate-900',
                  'from-violet-800 via-indigo-900 to-slate-900',
                ];
                return (
                  <Link key={link} to={link} className={`home-service-tile relative isolate overflow-hidden w-[154px] h-[68px] shrink-0 snap-start rounded-xl px-3 py-2 flex items-center gap-2.5 border shadow-sm active:scale-[.97] transition-all duration-200 service-tone-${index % 5}`}>
                    <span aria-hidden="true" className="absolute -right-5 -top-7 w-24 h-24 rounded-full border-[12px] border-white/10 pointer-events-none"/>
                    <span aria-hidden="true" className="absolute right-7 -bottom-8 w-20 h-20 rounded-full bg-white/10 blur-sm pointer-events-none"/>
                    <span className="relative z-10 w-8 h-8 rounded-lg service-icon flex items-center justify-center shrink-0 shadow-inner"><Icon size={16} className="!text-white"/></span>
                    <span className="relative z-10 min-w-0 flex-1"><span className="block text-[11px] font-extrabold service-title truncate">{label}</span><span className="block text-[9px] service-subtitle mt-0.5 truncate">{sub}</span></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Loan services */}
        <section>
          <div className="flex justify-between items-end mb-3"><div><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn?'ঋণ সেবা':'Loan services'}</p><h2 className="text-lg font-black mt-1">{isBn?'আপনার প্রয়োজন অনুযায়ী':'Choose a service'}</h2></div><Link to="/apply" className="text-xs font-black text-sky-600 dark:text-sky-400">{isBn?'সব দেখুন':'View all'}</Link></div>
          <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
            <div className="flex gap-3 w-max">
              {categories.map(([id,label], index)=> {
                const palettes = [
                  'from-slate-800 via-sky-900 to-slate-900',
                  'from-indigo-800 via-violet-900 to-slate-900',
                  'from-emerald-800 via-teal-900 to-slate-900',
                  'from-rose-800 via-pink-900 to-slate-900',
                  'from-blue-800 via-indigo-900 to-slate-900',
                  'from-fuchsia-800 via-purple-900 to-slate-900',
                ];
                return (
                  <button key={id} onClick={()=>navigate(`/apply?category=${id}`)} className={`home-category-tile relative isolate overflow-hidden text-left w-[160px] h-[72px] shrink-0 snap-start rounded-xl px-3 py-2 flex items-center gap-2.5 border shadow-sm active:scale-[.97] transition-all duration-200 category-tone-${index % 6}`}>
                    <span aria-hidden="true" className="absolute -right-6 -top-7 w-24 h-24 rounded-full border-[12px] border-white/10 pointer-events-none"/>
                    <span aria-hidden="true" className="absolute right-8 -bottom-8 w-20 h-20 rounded-full bg-white/10 blur-sm pointer-events-none"/>
                    <span className="relative z-10 w-8 h-8 rounded-lg category-icon flex items-center justify-center shrink-0 shadow-inner">{(() => { const Icon = loanCategoryIcon(id); return <Icon size={16} className="!text-white"/>; })()}</span>
                    <span className="relative z-10 min-w-0 flex-1"><span className="block text-[11px] font-extrabold category-title truncate">{label}</span><span className="block text-[9px] category-subtitle mt-0.5">{isBn?'আবেদন দেখুন':'View option'}</span></span>
                    <ChevronRight size={14} className="relative z-10 !text-white/80 shrink-0"/>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Success stories */}
        {stories.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <div><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn?'সদস্যদের অভিজ্ঞতা':'Member experiences'}</p><h2 className="text-lg font-black mt-1">{isBn?'সাফল্যের গল্প':'Success Stories'}</h2></div>
              <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">{convertDigits(stories.length,isBn)} {isBn?'জন সদস্য':'members'}</span>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              <div className="flex gap-3 w-max">
                {stories.slice(0,10).map((story, i) => (
                  <article key={story.id} className="home-success-story w-[310px] shrink-0 snap-start rounded-[22px] p-4 border shadow-lg text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-sky-500/10" />
                    <div className="relative flex items-center gap-3">
                      <img src={story.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=0ea5e9&color=fff&bold=true`} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/20" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate">{story.name}</p>
                        <p className="text-[9px] text-sky-300 font-bold truncate">{story.loan_type || (isBn?'লোন সদস্য':'Loan member')}</p>
                      </div>
                      {story.is_verified && <span className="text-[8px] font-black text-emerald-300 border border-emerald-400/30 rounded-full px-2 py-1">{isBn?'ভেরিফাইড':'VERIFIED'}</span>}
                    </div>
                    <div className="relative mt-5">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{isBn?'লোন পরিমাণ':'Loan amount'}</p>
                      <p className="text-xl font-black mt-1">{formatCurrency(story.amount || 0,isBn)}</p>
                    </div>
                    {(story.profession || story.location || story.loan_tenure || story.deposit_payment) && (
                      <div className="relative grid grid-cols-2 gap-2 mt-4">
                        {story.profession && <div className="rounded-lg bg-white/5 border border-white/10 p-2"><p className="text-[7px] text-slate-500">{isBn?'পেশা':'Profession'}</p><p className="text-[9px] font-bold truncate mt-1">{story.profession}</p></div>}
                        {story.location && <div className="rounded-lg bg-white/5 border border-white/10 p-2"><p className="text-[7px] text-slate-500">{isBn?'লোকেশন':'Location'}</p><p className="text-[9px] font-bold truncate mt-1">{story.location}</p></div>}
                        {story.loan_tenure && <div className="rounded-lg bg-white/5 border border-white/10 p-2"><p className="text-[7px] text-slate-500">{isBn?'মেয়াদ':'Tenure'}</p><p className="text-[9px] font-bold truncate mt-1">{story.loan_tenure}</p></div>}
                        {story.deposit_payment && <div className="rounded-lg bg-white/5 border border-white/10 p-2"><p className="text-[7px] text-slate-500">{isBn?'ডিপোজিট':'Deposit'}</p><p className="text-[9px] font-bold text-emerald-300 truncate mt-1">{story.deposit_payment}</p></div>}
                      </div>
                    )}
                    <div className="relative mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex text-amber-400 shrink-0">{Array.from({length:Math.min(story.rating || 5,5)}).map((_,si)=><Star key={si} size={10} fill="currentColor" />)}</div>
                      <div className="flex items-center gap-1.5">
                        {(['like','love','wow'] as const).map(type => {
                          const base = type === 'like' ? Number(story.like_count || 0) : type === 'love' ? Number(story.love_count || 0) : Number(story.wow_count || 0);
                          const count = storyReactions[story.id]?.[type] ?? base;
                          return (
                            <button key={type} type="button" onClick={() => handleStoryReaction(story, type)} className="px-1.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] active:scale-95 transition">
                              {type === 'like' ? '👍' : type === 'love' ? '❤️' : '😮'} {convertDigits(count,isBn)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent activity */}
        <section>
          <div className="flex justify-between items-end mb-3"><div><p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{isBn?'লেনদেন':'Activity'}</p><h2 className="text-lg font-black mt-1">{isBn?'সাম্প্রতিক কার্যক্রম':'Recent activity'}</h2></div><Link to="/transactions" className="text-xs font-black text-sky-600 dark:text-sky-400">{isBn?'সব দেখুন':'View all'}</Link></div>
          <div className="home-activity-card rounded-2xl overflow-hidden">
            {recentTransactions.length ? recentTransactions.map((tx,i)=>(
              <div key={tx.id} className={`p-4 flex items-center gap-3 ${i<recentTransactions.length-1?'border-b border-slate-100 dark:border-slate-800':''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type==='deposit'?'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400':tx.type==='emi_payment'?'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {tx.type==='deposit'?<ArrowDownToLine size={17}/>:tx.type==='emi_payment'?<CreditCard size={17}/>:<Wallet size={17}/>}
                </div>
                <div className="flex-1 min-w-0"><p className="text-xs font-black">{activityLabel(tx.type)}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(tx.created_at).toLocaleDateString(isBn?'bn-BD':'en-GB')} • {formatActivityStatus(tx.status)}</p></div>
                <div className="text-right"><p className="text-xs font-black">{formatCurrency(tx.amount,isBn)}</p><p className={`text-[9px] font-bold mt-1 ${tx.status==='completed'?'text-emerald-600 dark:text-emerald-400':tx.status==='failed'?'text-rose-600 dark:text-rose-400':'text-amber-600 dark:text-amber-400'}`}>{formatActivityStatus(tx.status)}</p></div>
              </div>
            )) : <div className="p-8 text-center text-xs font-bold text-slate-400">{isBn?'সাম্প্রতিক কোনো কার্যক্রম নেই':'No recent activity'}</div>}
          </div>
        </section>

        {/* Trust / member note */}
        <section className="bg-slate-900 dark:bg-[#111827] text-white rounded-2xl p-5">
          <div className="flex gap-3"><ShieldCheck className="text-sky-400 shrink-0" size={21}/><div><p className="font-black text-sm">{isBn?'সদস্য তথ্য ও হিসাব':'Member account & records'}</p><p className="text-[11px] text-slate-400 leading-5 mt-1">{isBn?'আপনার সঞ্চয়, ঋণ, কিস্তি, লেনদেন ও নথির তথ্য এক জায়গা থেকে দেখুন।':'View your savings, loans, installments, transactions and documents in one place.'}</p></div></div>
        </section>
      </div>
    </main>
  );
}
