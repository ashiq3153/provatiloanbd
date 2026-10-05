import { useMemo, useState } from 'react';
import { ArrowLeft, Search, UserRound, Building2, Plane, GraduationCap, Siren, ShieldCheck, ChevronRight, X, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { getCategories } from './apply-loan-utils';

const cardStyles = {
  personal: {
    border: 'border-emerald-100 dark:border-emerald-900/50',
    icon: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300',
    limit: 'bg-emerald-600',
    choose: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  },
  business: {
    border: 'border-amber-100 dark:border-amber-900/50',
    icon: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300',
    limit: 'bg-amber-600',
    choose: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  },
  expat: {
    border: 'border-violet-100 dark:border-violet-900/50',
    icon: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300',
    limit: 'bg-violet-600',
    choose: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  },
  student: {
    border: 'border-sky-100 dark:border-sky-900/50',
    icon: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300',
    limit: 'bg-sky-600',
    choose: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  },
} as const;

export default function LoanCategories() {
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';
  const [query, setQuery] = useState('');
  const all = getCategories(isBn, systemSettings);
  const visible = useMemo(() => all.filter(c => ['personal', 'business', 'expat', 'student'].includes(c.id)), [all]);
  const filtered = visible.filter(c => `${c.title} ${c.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const emergency = all.find(c => c.id === 'emergency');

  const choose = (id: string) => navigate(`/apply?category=${id}`);

  return (
    <div className="loan-easy-font min-h-full bg-white dark:bg-[#070d18] text-slate-950 dark:text-white">
      <header className="px-4 pt-4 pb-3 bg-white dark:bg-[#070d18]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            className="w-11 h-11 rounded-full bg-slate-50 dark:bg-[#101a2b] border border-slate-100 dark:border-slate-800 flex items-center justify-center"
          >
            <X size={23} strokeWidth={2.2} />
          </button>

          <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-slate-50 dark:bg-[#101a2b] border border-slate-100 dark:border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
              {isBn ? 'ধাপ ১ / ৮' : 'Step 1 / 8'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/support')}
            aria-label={isBn ? 'সহায়তা' : 'Help'}
            className="w-11 h-11 rounded-full bg-slate-50 dark:bg-[#101a2b] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200"
          >
            <HelpCircle size={22} />
          </button>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full w-[25%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      </header>

      <main className="px-4 pt-5 pb-8">
        <div className="mb-5">
          <h1 className="text-[25px] leading-[1.15] font-black tracking-tight">
            {isBn ? 'লোনের ধরন বেছে নিন' : 'Choose your loan type'}
          </h1>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
            {isBn ? 'আপনার পেশা ও প্রয়োজন অনুযায়ী সঠিক লোন নির্বাচন করুন' : 'Choose the right loan based on your need and profile'}
          </p>
        </div>

        <div className="h-[54px] rounded-[17px] bg-white dark:bg-[#0e1727] border border-slate-200 dark:border-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.06)] flex items-center gap-3 px-4">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-[13px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder={isBn ? 'ক্যাটাগরি বা প্রয়োজন সার্চ করুন...' : 'Search category or purpose...'}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          {filtered.map(cat => {
            const s = cardStyles[cat.id as keyof typeof cardStyles];
            const Icon = cat.id === 'personal' ? UserRound : cat.id === 'business' ? Building2 : cat.id === 'expat' ? Plane : GraduationCap;
            return (
              <article key={cat.id} className={`min-h-[318px] rounded-[24px] border bg-white dark:bg-[#0d1728] ${s.border} shadow-[0_5px_18px_rgba(15,23,42,0.06)] p-4 flex flex-col`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-[52px] h-[52px] rounded-[17px] flex items-center justify-center ${s.icon}`}>
                    <Icon size={25} strokeWidth={2.15} />
                  </div>
                  <span className={`text-white text-[10px] font-black px-3 py-1.5 rounded-full whitespace-nowrap ${s.limit}`}>
                    {cat.limit}
                  </span>
                </div>

                <h2 className="mt-5 text-[18px] leading-[1.2] font-black tracking-tight">
                  {cat.title} {isBn ? 'লোন' : 'Loan'}
                </h2>
                <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                  {cat.id === 'expat' ? 'PROBASHI LOAN' : cat.id === 'personal' ? 'PERSONAL LOAN' : cat.id === 'business' ? 'BUSINESS LOAN' : 'STUDENT LOAN'}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                  <p className="flex gap-2"><span className="text-emerald-500 font-black">✓</span><span>{cat.features[0]}</span></p>
                  <p className="flex gap-2"><span className="text-emerald-500 font-black">✓</span><span>{cat.procTime} {isBn ? 'অনুমোদন' : 'approval'}</span></p>
                </div>

                <button type="button" onClick={() => choose(cat.id)} className={`mt-auto h-[48px] rounded-[14px] flex items-center justify-center gap-1.5 text-[12px] font-black ${s.choose}`}>
                  {isBn ? 'বাছাই করুন' : 'Choose'} <ChevronRight size={17} />
                </button>
              </article>
            );
          })}
        </div>

        {emergency && (
          <article className="mt-4 rounded-[24px] bg-gradient-to-r from-rose-500 to-pink-500 text-white p-5 shadow-[0_8px_24px_rgba(244,63,94,0.20)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-white/15 border border-white/20 px-3 py-1 text-[9px] font-black">
                  {isBn ? 'দ্রুততম লোন সার্ভিস' : 'FASTEST LOAN SERVICE'}
                </span>
                <h2 className="mt-3 text-[21px] leading-tight font-black">{isBn ? 'জরুরি লোন (ইমার্জেন্সি)' : 'Emergency Loan'}</h2>
                <p className="mt-1 text-[11px] leading-5 text-white/90">{isBn ? 'হঠাৎ চিকিৎসা খরচ বা পারিবারিক প্রয়োজনে দ্রুত সহায়তা' : 'Fast support for urgent medical or family needs'}</p>
              </div>
              <span className="bg-white text-rose-600 rounded-full px-3.5 py-1.5 text-[10px] font-black whitespace-nowrap">{emergency.limit}</span>
            </div>
            <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold">{isBn ? '১ ঘণ্টায় প্রসেস • প্রয়োজনীয় কাগজপত্র' : 'Fast processing • required documents'}</span>
              <button type="button" onClick={() => choose('emergency')} className="h-[46px] px-5 rounded-[14px] bg-white text-rose-600 text-[12px] font-black flex items-center gap-1">
                {isBn ? 'আবেদন' : 'Apply'} <ChevronRight size={17} />
              </button>
            </div>
          </article>
        )}

        <div className="mt-5 rounded-[16px] bg-slate-50 dark:bg-[#0d1728] border border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
          <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            {isBn ? 'বাংলাদেশ ব্যাংক কর্তৃক লাইসেন্সপ্রাপ্ত ও নিরাপদ লেনদেন' : 'Secure online application and protected customer information.'}
          </p>
        </div>
      </main>
    </div>
  );
}
