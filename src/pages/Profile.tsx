import { getTelegramUser } from '../lib/telegram';
import { ShieldCheck, User, Settings, HelpCircle, LogOut, ChevronRight, Moon, Sun, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';

export default function Profile() {
  const user = getTelegramUser();
  const { theme, toggleTheme, language, setLanguage } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const isBn = language === 'bn';

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 pb-24 transition-colors">
      {/* Header Profile Section */}
      <div className="bg-white dark:bg-gray-800 px-5 pt-8 pb-8 rounded-b-[40px] shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/20 rounded-bl-full -mr-10 -mt-10 z-0 transition-colors"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center w-full">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full p-[4px] bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 shadow-lg">
                  <img 
                    src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`}
                    alt="Profile"
                    className="w-full h-full rounded-full border-4 border-white dark:border-gray-800 object-cover transition-colors"
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 p-1 transition-colors">
                  <ShieldCheck size={16} className="text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center transition-colors">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 mb-3 transition-colors">
                @{user.username || 'user'}
              </p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-100 dark:border-green-500/20 transition-colors">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {isBn ? 'টেলিগ্রাম ভেরিফাইড' : 'Verified via Telegram'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings & Preferences */}
      <div className="px-5 mt-6 space-y-3">
        {/* Theme Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm block transition-colors">
                  {isBn ? 'ডার্ক মোড' : 'Dark Mode'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
                  {isBn ? 'থিম পরিবর্তন করুন' : 'Toggle application theme'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </motion.div>

        {/* Language Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
        >
          <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors">
                <Languages size={20} />
              </div>
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm block transition-colors">
                  {isBn ? 'বাংলা' : 'English'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
                  {isBn ? 'অ্যাপের ভাষা পরিবর্তন করুন' : 'Change application language'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              onClick={() => setLanguage(isBn ? 'en' : 'bn')}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${isBn ? 'bg-green-500' : 'bg-blue-500'}`}
            >
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out flex items-center justify-center ${isBn ? 'translate-x-6' : 'translate-x-0'}`}>
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
          <button 
            onClick={() => window.location.href = '/support'}
            className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all outline-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors">
                <HelpCircle size={20} />
              </div>
              <div className="text-left">
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm block transition-colors">
                  {isBn ? 'সাপোর্ট ও সাহায্য' : 'Support & Help'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
                  {isBn ? 'FAQ ও সাপোর্ট' : 'FAQ & Support'}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </motion.div>

        {/* Disconnect Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
           <button className="w-full bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20 flex items-center justify-between active:scale-95 transition-all outline-none">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-colors">
                  <LogOut size={20} />
                </div>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm transition-colors">
                  {isBn ? 'ডিসকানেক্ট' : 'Disconnect'}
                </span>
              </div>
            </button>
        </motion.div>
      </div>
    </div>
  );
}
