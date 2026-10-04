import '../styles/home.css';
import { HomeHeader } from '../components/home/HomeHeader';
import { BalanceCard } from '../components/home/BalanceCard';
import { LoanStatusCard } from '../components/home/LoanStatusCard';
import { LoanServices } from '../components/home/LoanServices';
import { SuccessStories } from '../components/home/SuccessStories';
import { RecentActivity } from '../components/home/RecentActivity';
import {
  Bell, ChevronRight, AlertCircle,
} from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
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
        [type]: (prev[story.id]?.[type] ?? Number(story[`${type}_count` as 'like_count' | 'love_count' | 'wow_count'] || 0)) + 1,
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
            <button onClick={refreshDashboard} className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black">{isBn ? 'আবার চেষ্টা করুন' : 'Try again'}</button>
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

        <LoanServices isBn={isBn} categoryName={categoryName} />

        <SuccessStories isBn={isBn} stories={stories} storyReactions={storyReactions} onReact={handleStoryReaction} />

        <RecentActivity isBn={isBn} transactions={transactions} />

      </div>
    </main>
  );
}
