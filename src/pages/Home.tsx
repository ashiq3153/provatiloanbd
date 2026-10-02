import '../styles/home.css';
import { HomeHeader } from '../components/home/HomeHeader';
import { BalanceCard } from '../components/home/BalanceCard';
import { LoanStatusCard } from '../components/home/LoanStatusCard';
import { QuickServices } from '../components/home/QuickServices';
import { LoanServices } from '../components/home/LoanServices';
import {
  Bell, ArrowDownToLine, ArrowUpFromLine, Wallet,
  CreditCard, ChevronRight, AlertCircle,
  ShieldCheck, Star
} from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { formatCurrency, convertDigits } from '../lib/translation';
import { useState, useEffect } from 'react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleNotice, setStaleNotice] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
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
    const isRefresh = refreshKey > 0;
    (async () => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
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
        setStaleNotice(false);
        setLastUpdated(new Date());

        // Core dashboard renders first; secondary content loads afterward.
        setLoading(false);
        setRefreshing(false);

        const [nextStories, nextEmi] = await Promise.all([
          getSuccessStories().catch(() => []),
          active[0]?.id ? getLoanEmiSchedule(active[0].id).catch(() => []) : Promise.resolve([])
        ]);
        if (!mounted) return;
        setStories(nextStories || []);
        setEmiSchedule(nextEmi || []);
      } catch (e) {
        console.error('Home dashboard error:', e);
        if (!mounted) return;
        setStaleNotice(true);
        setError(isBn ? 'নতুন তথ্য আনা যায়নি।' : 'Could not refresh the latest data.');
        setLoading(false);
        setRefreshing(false);
      }
    })();
    return () => { mounted = false; };
  }, [user.id, refreshKey, isBn]);

  const refreshDashboard = () => {
    if (!refreshing) setRefreshKey(v => v + 1);
  };

  const retryDashboard = refreshDashboard;

  const handleHomeTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (window.scrollY <= 4) setTouchStartY(event.touches[0]?.clientY ?? null);
  };

  const handleHomeTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartY === null || refreshing) return;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    if (endY - touchStartY > 72 && window.scrollY <= 4) refreshDashboard();
    setTouchStartY(null);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const scheduledRepayment = emiSchedule.length
    ? emiSchedule.reduce((sum, e) => sum + Number(e.total_due || 0), 0)
    : Number(activeLoan?.total_payable || 0);
  const paidAmount = emiSchedule.length
    ? emiSchedule.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0)
    : transactions
        .filter(t => t.type === 'emi_payment' && t.loan_id === activeLoan?.id && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
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


  const quickActions = [
    { label: isBn ? 'কিস্তি' : 'EMI', sub: isBn ? 'পরিশোধ করুন' : 'Make payment', icon: CreditCard, link: '/pay' },
    { label: isBn ? 'সঞ্চয়' : 'Savings', sub: isBn ? 'জমা দিন' : 'Deposit', icon: PiggyBank, link: '/deposit' },
    { label: isBn ? 'ডকুমেন্ট' : 'Documents', sub: isBn ? 'নথি দেখুন' : 'View files', icon: FolderOpen, link: '/profile' },
    { label: isBn ? 'আরও' : 'More', sub: isBn ? 'সাপোর্ট ও সহায়তা' : 'Support & help', icon: Headphones, link: '/support' },
  ];

  const categories = [
    ['personal', isBn ? 'ব্যক্তিগত' : 'Personal'],
    ['business', isBn ? 'ব্যবসায়িক' : 'Business'],
    ['home', isBn ? 'বাড়ি' : 'Home'],
    ['medical', isBn ? 'চিকিৎসা' : 'Medical'],
    ['car', isBn ? 'গাড়ি' : 'Car'],
    ['student', isBn ? 'শিক্ষার্থী' : 'Student'],
    ['probashi', isBn ? 'প্রবাসী' : 'Probashi'],
    ['women', isBn ? 'নারী উদ্যোক্তা' : 'Women'],
  ];

  const recentTransactions = transactions.slice(0, 4);
  const formatActivityStatus = (status: string) => status === 'completed' ? (isBn ? 'সম্পন্ন' : 'Completed') : status === 'pending' ? (isBn ? 'অপেক্ষমাণ' : 'Pending') : status === 'failed' ? (isBn ? 'ব্যর্থ' : 'Failed') : status;
  const activityLabel = (type: string) => type === 'deposit' ? (isBn ? 'সঞ্চয়/ডিপোজিট' : 'Deposit') : type === 'emi_payment' ? (isBn ? 'কিস্তি পরিশোধ' : 'EMI payment') : type === 'disbursement' ? (isBn ? 'ঋণ বিতরণ' : 'Loan disbursement') : (isBn ? 'উত্তোলন' : 'Withdrawal');
  const activityMeta = (type: Transaction['type']) => {
    if (type === 'deposit') return { sign: '+', amountClass: 'text-emerald-600 dark:text-emerald-400', iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' };
    if (type === 'emi_payment') return { sign: '−', amountClass: 'text-sky-600 dark:text-sky-400', iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' };
    if (type === 'disbursement') return { sign: '+', amountClass: 'text-violet-600 dark:text-violet-400', iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' };
    return { sign: '−', amountClass: 'text-rose-600 dark:text-rose-400', iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' };
  };
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
      car: CarFront,
      student: GraduationCap,
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

    <main className="home-modern app-home-theme w-full min-w-0 bg-[#f6f8fc] dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 pb-[calc(10rem+env(safe-area-inset-bottom))] transition-colors" onTouchStart={handleHomeTouchStart} onTouchEnd={handleHomeTouchEnd}>
      <div className="px-3 sm:px-4 pt-0 space-y-4">

        {staleNotice && !loading && (
          <section className="mx-0 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertCircle size={17} className="shrink-0 text-amber-600 dark:text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black">{isBn ? 'সর্বশেষ তথ্য দেখানো হচ্ছে' : 'Showing the latest available data'}</p>
              <p className="text-[9px] font-semibold mt-0.5 opacity-80">
                {lastUpdated ? ((isBn ? 'সর্বশেষ আপডেট: ' : 'Last updated: ') + lastUpdated.toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: 'numeric', minute: '2-digit' })) : (isBn ? 'ইন্টারনেট সংযোগ দুর্বল' : 'Network connection is unstable')}
              </p>
            </div>
            <button onClick={refreshDashboard} className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[9px] font-black text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">{isBn ? 'আবার চেষ্টা' : 'Retry'}</button>
          </section>
        )}

        {error && !loading && (
          <section className="bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900 rounded-2xl p-5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><AlertCircle size={19} className="text-rose-600"/></div>
            <h2 className="text-sm font-black mt-3">{isBn ? 'তথ্য লোড হয়নি' : 'Data could not be loaded'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
            <button onClick={retryDashboard} className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black">{isBn ? 'আবার চেষ্টা করুন' : 'Try again'}</button>
          </section>
        )}

        <HomeHeader user={user} isBn={isBn} unreadCount={unreadCount} notifications={notifications} showNotifications={showNotifications} setShowNotifications={setShowNotifications} markReadAndOpen={markReadAndOpen} />

        {/* Notice */}
        {systemSettings?.announcementActive && (
          <Link to="/support" className="flex items-center gap-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
            <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0"><Bell size={15}/></span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-sky-600 uppercase">{isBn?'গুরুত্বপূর্ণ বিজ্ঞপ্তি':'Important notice'}</p><p className="text-xs font-bold truncate">{isBn?systemSettings.announcementBn:systemSettings.announcementEn}</p></div>
            <ChevronRight size={16} className="text-slate-400"/>
          </Link>
        )}

        {/* Approved reference balance card */}
        <BalanceCard isBn={isBn} balanceView={balanceView} balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible} loading={loading} stats={stats} outstanding={outstanding} userId={user.id} />

        {/* Smart loan status — one source of truth for application/active loan */}
        <LoanStatusCard activeLoan={activeLoan} latestApplication={latestApplication} isBn={isBn} outstanding={outstanding} nextInstallment={nextInstallment} nextEmiDate={nextEmiDate} categoryName={categoryName} applicationStatus={applicationStatus} />

        {/* Mobile-first responsive spacing */}
        <div className="h-px bg-transparent sm:hidden" aria-hidden="true" />
        <QuickServices isBn={isBn} />

        <LoanServices isBn={isBn} categoryName={categoryName} />

        {/* Success stories — compact reference-inspired testimonial card */}
        {stories.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <div><p className="text-[10px] uppercase tracking-wider font-black text-slate-500">{isBn?'সদস্যদের অভিজ্ঞতা':'SUCCESS STORIES'}</p><h2 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{isBn?'সাফল্যের গল্প':'Success Stories'}</h2></div>
              <Link to="/success-stories" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-sky-300">{isBn?'সব দেখুন':'View all'} <ChevronRight size={16}/></Link>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              <div className="flex gap-3 w-max">
                {stories.slice(0,10).map((story) => (
                  <article key={story.id} className="home-success-story w-[calc(100vw-2rem)] max-w-[620px] min-w-[calc(100vw-2rem)] sm:min-w-[min(620px,calc(100vw-3rem))] shrink-0 snap-start rounded-[22px] p-4 sm:p-5 text-white relative overflow-hidden">
                    <div className="home-story-dots absolute right-5 bottom-4 pointer-events-none" aria-hidden="true"/>
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0"><Star size={25} className="text-white shrink-0" fill="none"/><div className="min-w-0"><p className="text-sm sm:text-base font-extrabold">{isBn?'সাফল্যের গল্প':'Member success story'}</p><p className="text-[10px] sm:text-xs text-white/75 mt-0.5">{isBn?'আমাদের সদস্যদের সাফল্যের পথ':'Stories of our members’ success'}</p></div></div>
                      {story.is_verified && <span className="home-story-verified text-[9px] font-extrabold rounded-full px-2.5 py-1 shrink-0">{isBn?'যাচাইকৃত':'Verified'}</span>}
                    </div>
                    <div className="relative z-10 mt-4 flex items-center gap-3 sm:gap-4">
                      <img src={story.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=0ea5e9&color=fff&bold=true`} alt="" className="w-[68px] h-[68px] sm:w-[78px] sm:h-[78px] rounded-full object-cover border-2 border-white/80 bg-white/20 shrink-0"/>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-bold leading-snug line-clamp-3">{(isBn?'প্রভাতী লোনের সদস্যের অভিজ্ঞতা':'A member’s journey with Provati Loan')}</p>
                        <p className="text-xs sm:text-sm font-extrabold mt-2 truncate">{story.name}</p>
                        <p className="text-[10px] sm:text-xs text-white/75 mt-0.5 truncate">{story.loan_type || story.profession || (isBn?'সদস্য':'Member')} {story.amount ? ` • ${formatCurrency(story.amount,isBn)}` : ''}</p>
                      </div>
                      <span className="hidden sm:block text-5xl leading-none font-black text-white/20 self-end" aria-hidden="true">”</span>
                    </div>
                    <div className="relative z-10 mt-3 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
                      <div className="flex text-amber-300 shrink-0">{Array.from({length:Math.min(story.rating || 5,5)}).map((_,si)=><Star key={si} size={12} fill="currentColor" />)}</div>
                      <div className="flex items-center gap-1.5">
                        {(['like','love','wow'] as const).map(type => {
                          const base = type === 'like' ? Number(story.like_count || 0) : type === 'love' ? Number(story.love_count || 0) : Number(story.wow_count || 0);
                          const count = storyReactions[story.id]?.[type] ?? base;
                          return <button key={type} type="button" onClick={() => handleStoryReaction(story, type)} className="px-2 py-1 rounded-full bg-white/15 border border-white/25 text-[10px] text-white active:scale-95 transition">{type === 'like' ? '👍' : type === 'love' ? '❤️' : '😮'} {convertDigits(count,isBn)}</button>;
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activityMeta(tx.type).iconClass}`}>
                  {tx.type==='deposit'?<ArrowDownToLine size={17}/>:tx.type==='emi_payment'?<CreditCard size={17}/>:tx.type==='disbursement'?<ArrowUpFromLine size={17}/>:<Wallet size={17}/>}
                </div>
                <div className="flex-1 min-w-0"><p className="text-xs font-black">{activityLabel(tx.type)}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(tx.created_at).toLocaleDateString(isBn?'bn-BD':'en-GB')} • {formatActivityStatus(tx.status)}</p></div>
                <div className="text-right"><p className={`text-xs font-black ${activityMeta(tx.type).amountClass}`}>{activityMeta(tx.type).sign} {formatCurrency(tx.amount,isBn)}</p><p className={`text-[9px] font-bold mt-1 ${tx.status==='completed'?'text-emerald-600 dark:text-emerald-400':tx.status==='failed'?'text-rose-600 dark:text-rose-400':'text-amber-600 dark:text-amber-400'}`}>{formatActivityStatus(tx.status)}</p></div>
              </div>
            )) : <div className="p-8 text-center text-xs font-bold text-slate-400">{isBn?'সাম্প্রতিক কোনো কার্যক্রম নেই':'No recent activity'}</div>}
          </div>
        </section>

        {/* Trust / member note */}
        <section className="home-member-note rounded-2xl p-5">
          <div className="flex gap-3"><ShieldCheck className="text-sky-400 shrink-0" size={21}/><div><p className="font-black text-sm">{isBn?'সদস্য তথ্য ও হিসাব':'Member account & records'}</p><p className="text-[11px] text-slate-400 leading-5 mt-1">{isBn?'আপনার সঞ্চয়, ঋণ, কিস্তি, লেনদেন ও নথির তথ্য এক জায়গা থেকে দেখুন।':'View your savings, loans, installments, transactions and documents in one place.'}</p></div></div>
        </section>
      </div>
    </main>
  );
}
