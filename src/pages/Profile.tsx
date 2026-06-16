import { getTelegramUser } from '../lib/telegram';
import { ShieldCheck, Settings, HelpCircle, LogOut, ChevronRight, Moon, Sun, Languages, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';

export default function Profile() {
  const user = getTelegramUser();
  const { theme, toggleTheme, language, setLanguage, soundEnabled, setSoundEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen neu-bg pb-24 transition-colors">
      {/* Header Profile Section */}
      <div className="px-5 pt-5 pb-2 bg-transparent shrink-0">
        <div className="neu-raised p-6 rounded-[32px] relative overflow-hidden transition-colors border-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 dark:bg-primary-500/10 blur-3xl rounded-full -mr-10 -mt-10 z-0 transition-colors pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
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
                  <div className="w-28 h-28 rounded-full p-[4px] bg-white dark:bg-gray-800 border border-white/50 shadow-inner flex items-center justify-center overflow-hidden">
                    <img 
                      src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover transition-colors"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 neu-badge-orange rounded-full border-[3px] border-white dark:border-gray-800 p-1.5 transition-colors shadow-sm">
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                </div>
                
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center transition-colors">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-xs font-black text-gray-500 dark:text-gray-400 mt-1.5 mb-4 transition-colors neu-sunken px-4 py-1.5 rounded-full border-0 select-text">
                  @{user.username || 'user'}
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-black border border-green-500/25 transition-colors shadow-none">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {isBn ? 'টেলিগ্রাম ভেরিফাইড' : 'Verified via Telegram'}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Settings & Preferences */}
      <div className="px-5 mt-6 space-y-4 relative z-20">
        <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1 mb-2">
          {isBn ? 'সেটিংস ও প্রেফারেন্স' : 'Settings & Preferences'}
        </h3>

        {/* Theme Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-full neu-raised p-4 rounded-[24px] border-0 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full neu-sunken flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors border-0">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'ডার্ক মোড' : 'Dark Mode'}
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'থিম পরিবর্তন করুন' : 'Toggle application theme'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              type="button"
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full relative transition-colors duration-300 ease-in-out neu-sunken border-0 cursor-pointer ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-gray-300/40'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-md ${theme === 'dark' ? 'translate-x-6 bg-gradient-to-r from-blue-500 to-indigo-600' : 'translate-x-0 bg-white'}`}></div>
            </button>
          </div>
        </motion.div>

        {/* Language Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
        >
          <div className="w-full neu-raised p-4 rounded-[24px] border-0 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full neu-sunken flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors border-0">
                <Languages size={20} />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'বাংলা' : 'English'}
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'অ্যাপের ভাষা পরিবর্তন করুন' : 'Change application language'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              type="button"
              onClick={() => setLanguage(isBn ? 'en' : 'bn')}
              className={`w-14 h-8 rounded-full relative transition-colors duration-300 ease-in-out neu-sunken border-0 cursor-pointer ${isBn ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-md ${isBn ? 'translate-x-6 bg-gradient-to-r from-emerald-500 to-green-600' : 'translate-x-0 bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
            </button>
          </div>
        </motion.div>

        {/* Sound Toggle */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.15 }}
        >
          <div className="w-full neu-raised p-4 rounded-[24px] border-0 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full neu-sunken flex items-center justify-center text-amber-500 dark:text-amber-400 transition-colors border-0">
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'ক্লিক সাউন্ড' : 'Click Sounds'}
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'ইনপুট ও বাটনে শব্দ সক্রিয় রাখুন' : 'Enable click sounds on buttons and inputs'}
                </span>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-14 h-8 rounded-full relative transition-colors duration-300 ease-in-out neu-sunken border-0 cursor-pointer ${soundEnabled ? 'bg-amber-500/20' : 'bg-gray-300/40'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-md ${soundEnabled ? 'translate-x-6 bg-gradient-to-r from-amber-500 to-orange-500' : 'translate-x-0 bg-white'}`}></div>
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
            className="w-full neu-raised p-4 rounded-[24px] border-0 flex items-center justify-between active:scale-[0.98] transition-all block cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full neu-sunken flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors border-0">
                <HelpCircle size={20} />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-gray-900 dark:text-white text-base block transition-colors">
                  {isBn ? 'সাপোর্ট ও সাহায্য' : 'Support & Help'}
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 transition-colors mt-0.5 block">
                  {isBn ? 'FAQ ও লাইভ সাপোর্ট' : 'FAQ & Live Support'}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full neu-btn flex items-center justify-center border-0">
              <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
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
           <button className="w-full bg-rose-500/10 p-5 rounded-[24px] border border-rose-500/25 flex items-center justify-center gap-3 active:scale-[0.98] hover:bg-rose-500/15 transition-all shadow-none cursor-pointer">
              <LogOut size={20} className="text-rose-600 dark:text-rose-400" />
              <span className="font-black text-rose-600 dark:text-rose-400 text-base transition-colors">
                {isBn ? 'অ্যাপ থেকে ডিসকানেক্ট করুন' : 'Disconnect from App'}
              </span>
            </button>
        </motion.div>
      </div>
    </div>
  );
}
