import { getTelegramUser } from '../lib/telegram';
import { ShieldCheck, Settings, HelpCircle, LogOut, ChevronRight, Moon, Sun, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';

export default function Profile() {
  const user = getTelegramUser();
  const { theme, toggleTheme, language, setLanguage } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors">
      {/* Header Profile Section */}
      <div className="bg-white dark:bg-gray-800 pt-10 pb-10 rounded-b-[40px] shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 dark:bg-primary-500/20 blur-3xl rounded-full -mr-10 -mt-10 z-0 transition-colors pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full -ml-10 -mb-10 z-0 transition-colors pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center px-5">
          {loading ? (
            <div className="flex flex-col items-center w-full">
              <Skeleton className="w-28 h-28 rounded-full mb-5" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-5" />
              <Skeleton className="h-8 w-40 rounded-full" />
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div className="relative mb-5">
                <div className="w-28 h-28 rounded-full p-[4px] bg-gradient-to-tr from-primary-500 via-purple-500 to-pink-500 shadow-xl shadow-primary-500/20">
                  <img 
                    src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`}
                    alt="Profile"
                    className="w-full h-full rounded-full border-4 border-white dark:border-gray-800 object-cover transition-colors"
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-primary-500 rounded-full border-[3px] border-white dark:border-gray-800 p-1.5 transition-colors shadow-sm">
                  <ShieldCheck size={18} className="text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight text-center transition-colors">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 mb-4 transition-colors bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                @{user.username || 'user'}
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-500/20 transition-colors shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {isBn ? 'টেলিগ্রাম ভেরিফাইড' : 'Verified via Telegram'}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Settings & Preferences */}
      <div className="px-5 mt-8 space-y-3 relative z-20">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1 mb-2">
          {isBn ? 'সেটিংস ও প্রেফারেন্স' : 'Settings & Preferences'}
        </h3>

        {/* Theme Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors hover:shadow-md cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors border border-gray-100 dark:border-gray-600 shadow-sm">
                {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'ডার্ক মোড' : 'Dark Mode'}
                </span>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'থিম পরিবর্তন করুন' : 'Toggle application theme'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full relative transition-colors duration-300 ease-in-out shadow-inner border-2 ${theme === 'dark' ? 'bg-primary-600 border-primary-600' : 'bg-gray-200 dark:bg-gray-600 border-transparent'}`}
            >
              <div className={`absolute left-0.5 top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </motion.div>

        {/* Language Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
        >
          <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors hover:shadow-md cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors border border-blue-100 dark:border-blue-800 shadow-sm">
                <Languages size={22} />
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'বাংলা' : 'English'}
                </span>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'অ্যাপের ভাষা পরিবর্তন করুন' : 'Change application language'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              onClick={() => setLanguage(isBn ? 'en' : 'bn')}
              className={`w-14 h-8 rounded-full relative transition-colors duration-300 ease-in-out shadow-inner border-2 ${isBn ? 'bg-green-500 border-green-500' : 'bg-blue-500 border-blue-500'}`}
            >
              <div className={`absolute left-0.5 top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center ${isBn ? 'translate-x-6' : 'translate-x-0'}`}>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Support Link */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <Link 
            to="/support"
            className="w-full bg-white dark:bg-gray-800 p-4 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-[0.98] transition-all hover:shadow-md cursor-pointer block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors border border-amber-100 dark:border-amber-800 shadow-sm">
                <HelpCircle size={22} />
              </div>
              <div className="text-left">
                <span className="font-bold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'সাপোর্ট ও সাহায্য' : 'Support & Help'}
                </span>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'FAQ ও লাইভ সাপোর্ট' : 'FAQ & Live Support'}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Link>
        </motion.div>

        {/* Disconnect Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-6"
        >
           <button className="w-full bg-rose-50 dark:bg-rose-500/10 p-5 rounded-[24px] border border-rose-100 dark:border-rose-500/20 flex items-center justify-center gap-3 active:scale-[0.98] hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all shadow-sm">
              <LogOut size={20} className="text-rose-600 dark:text-rose-400" />
              <span className="font-bold text-rose-600 dark:text-rose-400 text-base transition-colors">
                {isBn ? 'অ্যাপ থেকে ডিসকানেক্ট করুন' : 'Disconnect from App'}
              </span>
            </button>
        </motion.div>
      </div>
    </div>
  );
}
