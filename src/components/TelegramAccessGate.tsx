import { ArrowUpRight, ShieldCheck, Send } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function TelegramAccessGate({ isAdmin = false }: { isAdmin?: boolean }) {
  const { language, setLanguage } = useAppStore();
  const isBn = language === 'bn';
  const botUrl = 'https://t.me/provatiloanpssbot';

  return (
    <main className="min-h-[100dvh] bg-slate-950 text-white flex items-center justify-center p-5">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-900/90 p-6 sm:p-9 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-900/40">
              <ShieldCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">PROVATI LOAN</p>
              <p className="text-sm text-slate-400">{isAdmin ? 'Secure Admin Panel' : 'Telegram Mini App'}</p>
            </div>
          </div>
          <button type="button" onClick={() => setLanguage(isBn ? 'en' : 'bn')} className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/5">
            {isBn ? 'English' : 'বাংলা'}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-300">
            {isBn ? 'Telegram যাচাই প্রয়োজন' : 'Telegram verification required'}
          </p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">
            {isBn ? 'অ্যাপটি Telegram-এর ভেতর থেকে খুলুন' : 'Open the app inside Telegram'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isBn
              ? (isAdmin ? 'অ্যাডমিন প্যানেলে সদস্যদের ব্যক্তিগত তথ্য সুরক্ষিত রাখতে Telegram-এর যাচাইকৃত অ্যাডমিন সেশন দরকার। আপনার অ্যাডমিন বটের “Admin Panel” বাটন ব্যবহার করুন।' : 'সদস্যের পরিচয় যাচাই ও আবেদন নিরাপদ রাখতে অ্যাপটি Telegram Mini App হিসেবে চালু করতে হবে। সাধারণ ব্রাউজার সেশনে Telegram পরিচয় পাওয়া যায় না, তাই খালি স্ক্রিন না দেখিয়ে এই নির্দেশনা দেখানো হচ্ছে।')
              : (isAdmin ? 'The Admin Panel requires a verified Telegram admin session to protect members’ personal data. Use the “Admin Panel” button in your admin bot.' : 'The app must run as a Telegram Mini App to verify members and submit applications securely. A regular browser session has no Telegram identity, so this guidance is shown instead of a blank screen.')}
          </p>
        </div>

        <a href={botUrl} target="_blank" rel="noopener noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-950/50 transition hover:bg-sky-400">
          <Send size={17} />
          {isBn ? 'Telegram বট খুলুন' : 'Open Telegram bot'}
          <ArrowUpRight size={16} />
        </a>
        <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">
          {isBn ? 'এখানে কোনো প্রকৃত আবেদন, ব্যালেন্স বা অ্যাডমিন অ্যাকশন চালানো হয়নি।' : 'No real application, balance, or admin action is run on this browser screen.'}
        </p>
      </section>
    </main>
  );
}
