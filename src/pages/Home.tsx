import { Bell, ArrowDownToLine, ArrowUpFromLine, Wallet, ArrowRight, Star, FileText } from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getActiveLoans, getSuccessStories } from '../lib/api';
import type { DashboardStats } from '../lib/api';
import type { LoanApplication, SuccessStory } from '../types/database';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);
  const [stories, setStories] = useState<SuccessStory[]>([]);

  const user = getTelegramUser();
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashStats, activeLoans, successStoriesData] = await Promise.all([
          getDashboardStats(user.id),
          getActiveLoans(user.id),
          getSuccessStories(),
        ]);

        setStats(dashStats);
        setActiveLoan(activeLoans.length > 0 ? activeLoans[0] : null);
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

  // Fallback success stories if DB is empty
  const fallbackStories = [
    {
      id: '1',
      name: 'Nusrat Jahan',
      loan_type: isBn ? 'ব্যবসায়িক লোন' : 'Business Loan',
      amount: 300000,
      approval_time: isBn ? '২৪ ঘন্টায় অনুমোদিত' : 'Approved in 24 Hours',
      rating: 5,
      is_verified: true,
      avatar_url: 'https://i.pravatar.cc/150?u=nusrat'
    },
    {
      id: '2',
      name: 'Rashed Alam',
      loan_type: isBn ? 'ব্যক্তিগত লোন' : 'Personal Loan',
      amount: 150000,
      approval_time: isBn ? '১২ ঘন্টায় অনুমোদিত' : 'Approved in 12 Hours',
      rating: 5,
      is_verified: true,
      avatar_url: 'https://i.pravatar.cc/150?u=rashed'
    }
  ];

  const displayStories = stories.length > 0 ? stories : fallbackStories;
  const safeStoryIndex = currentStoryIndex % Math.max(displayStories.length, 1);

  const allLoanCategories = [
    { id: 'business', name: isBn ? 'ব্যবসা' : 'Business', icon: '🏢', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'personal', name: isBn ? 'ব্যক্তিগত' : 'Personal', icon: '👤', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'home', name: isBn ? 'বাড়ি' : 'Home', icon: '🏠', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { id: 'car', name: isBn ? 'গাড়ি' : 'Car', icon: '🚗', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { id: 'medical', name: isBn ? 'চিকিৎসা' : 'Medical', icon: '🏥', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { id: 'freelancer', name: isBn ? 'ফ্রিল্যান্সার' : 'Freelancer', icon: '💻', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { id: 'probashi', name: isBn ? 'প্রবাসী' : 'Probashi', icon: '✈️', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
    { id: 'education', name: isBn ? 'শিক্ষা' : 'Education', icon: '🎓', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  ];

  const displayCategories = allLoanCategories.slice(0, 4);

  const chartData = [
    { name: isBn ? 'জানু' : 'Jan', amount: 45000 },
    { name: isBn ? 'ফেব' : 'Feb', amount: 52000 },
    { name: isBn ? 'মার্চ' : 'Mar', amount: 48000 },
    { name: isBn ? 'এপ্রিল' : 'Apr', amount: 61000 },
    { name: isBn ? 'মে' : 'May', amount: stats?.totalBalance || 0 },
  ];

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
        <div 
          onClick={() => {
            toast.info(isBn ? 'নতুন কোন নোটিফিকেশন নেই' : 'No new notifications');
          }}
          className="relative p-2.5 bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-inner cursor-pointer active:scale-95 transition-all"
        >
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-700 shadow-sm shadow-red-500/50 transition-colors"></span>
        </div>
      </div>

      {/* Balance Section */}
      <div className="relative">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-900 rounded-[32px] p-6 pb-14 text-white shadow-[0_20px_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.7)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-white/20 transition-colors duration-500"></div>
          <div className="absolute bottom-4 right-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/></svg>
          </div>
          
          <div className="relative z-10 w-full flex justify-between items-start">
            <div>
              <p className="text-primary-100 dark:text-primary-200 text-sm font-medium mb-1 drop-shadow-sm transition-colors">
                {isBn ? 'মোট ব্যালেন্স' : 'Total Balance'}
              </p>
              <h2 className="text-4xl font-extrabold mb-1 tracking-tight drop-shadow-md">৳{(stats?.totalBalance || 0).toLocaleString()}</h2>
              <p className="text-primary-100 dark:text-primary-200 text-xs font-medium transition-colors">
                {isBn ? `বিদ্যমান: ৳${(stats?.totalBalance || 0).toLocaleString()}` : `Available: ৳${(stats?.totalBalance || 0).toLocaleString()}`}
              </p>
            </div>
            
            <Link to="/pay" className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 hover:shadow-white/20 transition-all">
              {isBn ? 'ইএমআই পে' : 'Pay EMI'} <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Floating Sub-balances */}
        <div className="flex gap-4 absolute -bottom-6 left-5 right-5 z-20">
          <Link to="/deposit" className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800 rounded-2xl p-3.5 shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.5)] border border-emerald-400 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center gap-3 group text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <ArrowDownToLine size={20} strokeWidth={2.5} />
            </div>
            <div>
               <p className="text-[10px] text-emerald-100 dark:text-emerald-200 font-bold uppercase tracking-wide transition-colors">
                 {isBn ? 'ডিপোজিট' : 'Deposit'}
               </p>
               <p className="font-black text-white text-sm drop-shadow-sm">৳{(stats?.depositBalance || 0).toLocaleString()}</p>
            </div>
          </Link>
          <Link to="/withdraw" className="flex-1 bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-800 rounded-2xl p-3.5 shadow-[0_15px_30px_-5px_rgba(244,63,94,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(244,63,94,0.5)] border border-rose-400 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center gap-3 group text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <ArrowUpFromLine size={20} strokeWidth={2.5} />
            </div>
            <div>
               <p className="text-[10px] text-rose-100 dark:text-rose-200 font-bold uppercase tracking-wide transition-colors">
                 {isBn ? 'উত্তোলন' : 'Withdraw'}
               </p>
               <p className="font-black text-white text-sm drop-shadow-sm">৳{(stats?.withdrawBalance || 0).toLocaleString()}</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Spacer for floating boxes */}
      <div className="h-4"></div>

      {/* Quick Actions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg transition-colors">
            {isBn ? 'কুইক অ্যাকশন' : 'Quick Actions'}
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: isBn ? 'ডিপোজিট' : 'Deposit', icon: ArrowDownToLine, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800', shadow: 'shadow-emerald-500/20 dark:shadow-emerald-900/40', link: '/deposit' },
            { name: isBn ? 'উত্তোলন' : 'Withdraw', icon: ArrowUpFromLine, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-100 dark:border-rose-800', shadow: 'shadow-rose-500/20 dark:shadow-rose-900/40', link: '/withdraw' },
            { name: isBn ? 'আবেদন' : 'Apply Loan', icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-100 dark:border-blue-800', shadow: 'shadow-blue-500/20 dark:shadow-blue-900/40', link: '/apply' },
            { name: isBn ? 'ইএমআই' : 'EMI Pay', icon: Wallet, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', border: 'border-violet-100 dark:border-violet-800', shadow: 'shadow-violet-500/20 dark:shadow-violet-900/40', link: '/pay' },
          ].map((action, i) => (
             <Link key={i} to={action.link} className="flex flex-col items-center gap-2 group">
              <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center ${action.bg} ${action.color} border ${action.border} shadow-lg ${action.shadow} group-active:scale-95 transition-all duration-200`}>
                <action.icon size={26} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 transition-colors">{action.name}</span>
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
        ) : (        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-5 shadow-[0_20px_40px_-15px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgb(0,0,0,0.3)] border border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/20 rounded-bl-full -mr-10 -mt-10 z-0 transition-colors"></div>
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-[18px] flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 relative z-10 shadow-inner transition-colors">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div className="flex-1 relative z-10">
             <div className="flex justify-between items-start mb-1">
               <div>
                 <h4 className="font-bold text-gray-900 dark:text-white transition-colors">
                   {isBn ? 'বাড়ি লোন' : 'Home Loan'} 
                   <span className="inline-block ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] rounded-full uppercase tracking-wide transition-colors">
                     {isBn ? 'সক্রিয়' : 'Active'}
                   </span>
                 </h4>
                 <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                   {isBn ? 'লোন আইডি' : 'Loan ID'}: HL1234567
                 </p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 transition-colors">
                   {isBn ? 'বকেয়া' : 'Outstanding'}
                 </p>
                 <p className="font-bold text-gray-900 dark:text-white transition-colors">৳7,45,000</p>
               </div>
             </div>
             <div className="flex items-center gap-3 mt-4">
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full flex-1 overflow-hidden shadow-inner transition-colors">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-[62%]"></div>
                </div>
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 transition-colors">62%</span>
             </div>
             <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium transition-colors">
               {isBn ? 'পরবর্তী ইএমআই' : 'Next EMI'}: <span className="text-gray-700 dark:text-gray-300 transition-colors">25 May 2024</span>
             </p>

             {/* Chart Section within Active Loan */}
             <div className="mt-6 h-[120px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}
                     itemStyle={{ fontWeight: '900', color: '#111827' }}
                     formatter={(value) => [`৳${value ?? 0}`, isBn ? 'ব্যালেন্স' : 'Balance']}
                   />
                   <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
        )}
      </div>

      {/* Success Stories */}
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
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                  </div>
                  <div className="flex gap-3 mb-3 relative z-10 w-full overflow-hidden">
                    <img 
                      src={displayStories[safeStoryIndex].avatar_url || `https://ui-avatars.com/api/?name=${displayStories[safeStoryIndex].name}&background=random`} 
                      alt={displayStories[safeStoryIndex].name} 
                      onError={(e) => { 
                        const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayStories[safeStoryIndex].name)}&background=random`;
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      className="w-12 h-12 rounded-full object-cover shrink-0" 
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1 transition-colors truncate">
                        {displayStories[safeStoryIndex].name} 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" className="shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 transition-colors truncate">{displayStories[safeStoryIndex].loan_type}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400 transition-colors">৳{(displayStories[safeStoryIndex].amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors truncate">{displayStories[safeStoryIndex].approval_time}</p>
                  </div>
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(displayStories[safeStoryIndex].rating || 5)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

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
               className="w-full text-left bg-white dark:bg-gray-800 rounded-[20px] p-4 flex items-center gap-3 shadow-[0_10px_30px_-15px_rgb(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgb(0,0,0,0.3)] border border-gray-50 dark:border-gray-700 transition-colors hover:border-primary-200 dark:hover:border-primary-700"
             >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner transition-colors ${cat.color}`}>
                  {cat.icon}
                </div>
                <span className="font-bold text-sm text-gray-800 dark:text-gray-100 transition-colors">{cat.name}</span>
             </button>
           ))}
        </div>
      </div>

    </div>
  );
}
