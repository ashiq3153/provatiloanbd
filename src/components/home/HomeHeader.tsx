import { Bell, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { convertDigits } from '../../lib/translation';

type HomeHeaderProps = {
  user: { first_name: string; last_name?: string; photo_url?: string };
  isBn: boolean;
  unreadCount: number;
  notifications: any[];
  showNotifications: boolean;
  setShowNotifications: (value: boolean | ((value: boolean) => boolean)) => void;
  markReadAndOpen: (notification: any) => void;
};

export function HomeHeader({ user, isBn, unreadCount, notifications, showNotifications, setShowNotifications, markReadAndOpen }: HomeHeaderProps) {
  return (
    <header className="home-dashboard-header">
      <div className="home-hero-art" aria-hidden="true">
        <svg viewBox="0 0 430 190" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroWave" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#0b5bd3"/><stop offset="55%" stopColor="#123fba"/><stop offset="100%" stopColor="#101f68"/></linearGradient>
            <linearGradient id="heroAccent" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34d7c3"/><stop offset="100%" stopColor="#6d7cff"/></linearGradient>
          </defs>
          <path d="M0 120C78 74 132 146 202 110S335 58 430 90V190H0Z" fill="url(#heroWave)"/>
          <path d="M0 151C88 105 136 170 216 137S335 91 430 120" fill="none" stroke="url(#heroAccent)" strokeWidth="2" opacity=".8"/>
          <path d="M0 163C90 119 139 182 221 150S337 107 430 136" fill="none" stroke="#fff" strokeWidth="1" opacity=".13"/>
          <circle cx="350" cy="38" r="52" fill="#4f63ff" opacity=".12"/><circle cx="350" cy="38" r="34" fill="none" stroke="#8aa0ff" opacity=".22"/><circle cx="350" cy="38" r="19" fill="none" stroke="#fff" opacity=".12"/>
        </svg>
      </div>
      <div className="home-header-top">
        <div className="home-brand-lockup">
          <span className="home-logo-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M5 8C14 10 20 16 22 25L22 43C12 37 7 29 5 20V8Z" fill="currentColor"/><path d="M43 8C34 10 28 16 26 25L26 43C36 37 41 29 43 20V8Z" fill="currentColor"/><path d="M10 4C17 5 22 10 24 17C26 10 31 5 38 4V13C32 15 28 19 26 25H22C20 19 16 15 10 13V4Z" fill="currentColor"/></svg></span>
          <span><b>PROVATI LOAN</b><small>PROVATI SOMOBAY SOMITI</small></span>
        </div>
        <div className="home-header-actions">
          <div className="relative">
            <button type="button" onClick={() => setShowNotifications(v => !v)} className="home-header-icon" aria-label="Notifications"><Bell size={18}/>{unreadCount > 0 && <i/>}</button>
            <AnimatePresence>{showNotifications && (<><div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} /><motion.div initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.98}} className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"><strong>{isBn ? 'নোটিফিকেশন' : 'Notifications'}</strong>{unreadCount > 0 && <span className="text-[10px] font-black text-sky-600">{convertDigits(unreadCount,isBn)} {isBn?'নতুন':'new'}</span>}</div>
              <div className="max-h-72 overflow-y-auto">{notifications.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">{isBn ? 'নতুন কোনো নোটিফিকেশন নেই' : 'No notifications'}</div> : notifications.slice(0,6).map((n:any)=><button key={n.id} onClick={()=>markReadAndOpen(n)} className="w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"><div className="flex gap-3"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.is_read?'bg-slate-300':'bg-sky-500'}`}/><div className="min-w-0"><p className="text-xs font-bold leading-5">{n.title}</p><p className="text-[10px] text-slate-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString(isBn?'bn-BD':'en-US') : ''}</p></div></div></button>)}</div>
            </motion.div></>)}</AnimatePresence>
          </div>
          <Link to="/profile" className="home-profile-avatar"><img src={user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=0b5bd3&color=fff&bold=true`} alt="Profile"/><span/></Link>
        </div>
      </div>
      <div className="home-header-content">
        <div className="home-header-copy">
          <span className="home-eyebrow"><ShieldCheck size={13}/>{isBn?'নিরাপদ আর্থিক ড্যাশবোর্ড':'SECURE FINANCIAL DASHBOARD'}</span>
          <h1>{isBn ? 'স্বাগতম,' : 'Welcome,'} <strong>{user.first_name}</strong></h1>
          <p>{isBn ? 'আপনার প্রয়োজনের ঋণ, সঞ্চয় ও লেনদেন এক জায়গায়।' : 'Loans, savings and transactions — all in one place.'}</p>
        </div>
      </div>
    </header>
  );
}
