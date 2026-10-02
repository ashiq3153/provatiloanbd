import { Bell } from 'lucide-react';
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
        <header className="home-dashboard-header relative overflow-hidden flex flex-col gap-3 rounded-b-[26px] px-3 py-3 -mx-3 sm:-mx-4 sm:px-5 shadow-md">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 text-white">
              <span className="home-logo-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C14 10 20 16 22 25L22 43C12 37 7 29 5 20V8Z" fill="currentColor"/><path d="M43 8C34 10 28 16 26 25L26 43C36 37 41 29 43 20V8Z" fill="currentColor"/><path d="M10 4C17 5 22 10 24 17C26 10 31 5 38 4V13C32 15 28 19 26 25H22C20 19 16 15 10 13V4Z" fill="currentColor"/></svg></span>
              <span className="min-w-0"><span className="block text-[17px] leading-tight font-black tracking-wide whitespace-nowrap">PROVATI LOAN</span><span className="home-brand-subtitle block text-[8px] leading-tight tracking-[.12em] font-semibold text-white/85 whitespace-nowrap">PROVATI SOMOBAY SOMITI</span></span>
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

  );
}
