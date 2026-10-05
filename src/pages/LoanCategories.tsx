import { useMemo, useState } from 'react';
import { ArrowLeft, Search, UserRound, Building2, Plane, GraduationCap, Siren, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { getCategories } from './apply-loan-utils';

const accent = {
  personal: { card: 'bg-emerald-50/70 dark:bg-[#0f2b29] border-emerald-100 dark:border-emerald-900/60', icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300', pill: 'bg-emerald-600', soft: 'bg-emerald-50 dark:bg-emerald-950/40' },
  business: { card: 'bg-amber-50/70 dark:bg-[#2a2516] border-amber-100 dark:border-amber-900/60', icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300', pill: 'bg-amber-600', soft: 'bg-amber-50 dark:bg-amber-950/40' },
  expat: { card: 'bg-violet-50/70 dark:bg-[#21172f] border-violet-100 dark:border-violet-900/60', icon: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300', pill: 'bg-violet-600', soft: 'bg-violet-50 dark:bg-violet-950/40' },
  student: { card: 'bg-sky-50/70 dark:bg-[#122632] border-sky-100 dark:border-sky-900/60', icon: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300', pill: 'bg-sky-600', soft: 'bg-sky-50 dark:bg-sky-950/40' },
} as const;

export default function LoanCategories() {
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';
  const [query, setQuery] = useState('');

  const all = getCategories(isBn, systemSettings);
  const visible = useMemo(
    () => all.filter(cat => ['personal', 'business', 'expat', 'student'].includes(cat.id)),
    [all]
  );
  const filtered = visible.filter(cat => {
    const haystack = `${cat.title} ${cat.id} ${cat.reqDocs.join(' ')}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const emergency = all.find(cat => cat.id === 'emergency');

  const choose = (id: string) => navigate(`/apply?category=${id}`);

  return (
    <div className="loan-easy-font min-h-full bg-[#f8fafc] dark:bg-[#08111f] text-slate-950 dark:text-white transition-colors">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0b1728]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} aria-label={isBn ? 'ফিরে যান' : 'Go back'} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isBn ? 'লোন ক্যাটাগরি' : 'Loan Categories'}
            </span>
          </div>
          <button onClick={() => navigate('/support')} aria-label={isBn ? 'সহায়তা' : 'Help'} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <ShieldCheck size={19} />
          </button>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      </header>

      <main className="px-4 pt-5 pb-8">
        <div className="mb-4">
          <h1 className="text-[24px] leading-tight font-black tracking-tight">{isBn ? 'লোনের ধরন বেছে নিন' : 'Choose your loan type'}</h1>
          <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
            {isBn ? 'আপনার প্রয়োজন ও যোগ্যতা অনুযায়ী সঠিক লোন নির্বাচন করুন' : 'Select the loan that best matches your need and eligibility'}
          </p>
        </div>

        <div className="h-12 rounded-2xl bg-white dark:bg-[#0f1b2d] border border-slate-200 dark:border-slate-800 flex items-center gap-2 px-4 shadow-sm">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder={isBn ? 'ক্যাটাগরি বা প্রয়োজন সার্চ করুন...' : 'Search category or purpose...'}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {filtered.map(cat => {
            const a = accent[cat.id as keyof typeof accent];
            const Icon = cat.id === 'personal' ? UserRound : cat.id === 'business' ? Building2 : cat.id === 'expat' ? Plane : GraduationCap;
            return (
              <article key={cat.id} className={`rounded-[22px] border p-4 shadow-sm ${a.card}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.icon}`}>
                    <Icon size={23} strokeWidth={2.2} />
                  </div>
                  <span className={`text-white text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${a.pill}`}>
                    {cat.limit}
                  </span>
                </div>
                <h2 className="mt-4 text-[17px] font-black leading-tight">{cat.title} {isBn ? 'লোন' : 'Loan'}</h2>
                <p className="mt-1 text-[9px] uppercase tracking-wide font-semibold text-slate-400">{cat.id === 'expat' ? 'PROBASHI LOAN' : cat.id === 'personal' ? 'PERSONAL LOAN' : cat.id === 'business' ? 'BUSINESS LOAN' : 'STUDENT LOAN'}</p>
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-2"><span className="text-emerald-500 font-black">✓</span>{cat.features[0]}</p>
                  <p className="flex items-center gap-2"><span className="text-emerald-500 font-black">✓</span>{cat.procTime} {isBn ? 'অনুমোদন' : 'approval'}</p>
                </div>
                <button onClick={() => choose(cat.id)} className={`mt-4 w-full h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1 ${a.soft} text-slate-800 dark:text-white active:scale-[.98]`}>
                  {isBn ? 'বাছাই করুন' : 'Choose'} <ChevronRight size={15} />
                </button>
              </article>
            );
          })}
        </div>

        {emergency && (
          <article className="mt-4 rounded-[22px] bg-gradient-to-r from-rose-500 to-pink-500 text-white p-5 shadow-lg shadow-rose-500/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Siren size={24} />
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black">{isBn ? 'দ্রুততম লোন সার্ভিস' : 'FAST LOAN SERVICE'}</span>
                  <h2 className="mt-2 text-[19px] font-black">{isBn ? 'জরুরি লোন' : 'Emergency Loan'}</h2>
                </div>
              </div>
              <span className="bg-white text-rose-600 rounded-full px-3 py-1 text-[10px] font-black">{emergency.limit}</span>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-white/90">{isBn ? 'হঠাৎ চিকিৎসা খরচ বা জরুরি পারিবারিক প্রয়োজনে দ্রুত সহায়তা।' : 'Fast support for unexpected medical costs or urgent family needs.'}</p>
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold">{isBn ? '২–৬ ঘণ্টা • দ্রুত প্রসেসিং' : '2–6 hours • fast processing'}</span>
              <button onClick={() => choose('emergency')} className="h-10 px-5 rounded-xl bg-white text-rose-600 text-xs font-black flex items-center gap-1">
                {isBn ? 'আবেদন' : 'Apply'} <ChevronRight size={15} />
              </button>
            </div>
          </article>
        )}

        <div className="mt-5 rounded-2xl bg-white dark:bg-[#0f1b2d] border border-slate-200 dark:border-slate-800 p-3.5 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            {isBn ? 'নিরাপদ অনলাইন আবেদন ও তথ্য সুরক্ষার জন্য প্রয়োজনীয় যাচাই সম্পন্ন করা হয়।' : 'Secure online applications with required verification and protected customer information.'}
          </p>
        </div>
      </main>
    </div>
  );
}
