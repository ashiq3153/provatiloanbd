import { useMemo, useState } from 'react';
import {
  Award, ArrowLeft, Building2, Check, ChevronRight, CircleHelp, FileText,
  GraduationCap, HeartPulse, Info, Plane, Search, ShieldCheck, Store, UserRound, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { getCategories } from './apply-loan-utils';

type Occupation = {
  id: string;
  label: string;
  shortLabel: string;
  icon: typeof UserRound;
  categories: string[];
};

const OCCUPATIONS: Occupation[] = [
  { id: 'govt', label: 'সরকারি চাকরিজীবী', shortLabel: 'সরকারি চাকরি', icon: UserRound, categories: ['personal'] },
  { id: 'private', label: 'বেসরকারি চাকরিজীবী', shortLabel: 'বেসরকারি চাকরি', icon: UserRound, categories: ['personal'] },
  { id: 'teacher', label: 'শিক্ষক/শিক্ষিকা', shortLabel: 'শিক্ষক', icon: GraduationCap, categories: ['personal'] },
  { id: 'health', label: 'ডাক্তার/স্বাস্থ্যকর্মী', shortLabel: 'স্বাস্থ্যকর্মী', icon: HeartPulse, categories: ['personal'] },
  { id: 'engineer', label: 'ইঞ্জিনিয়ার/প্রকৌশলী', shortLabel: 'ইঞ্জিনিয়ার', icon: UserRound, categories: ['personal'] },
  { id: 'banker', label: 'ব্যাংকার/আর্থিক প্রতিষ্ঠানের কর্মী', shortLabel: 'ব্যাংকার', icon: UserRound, categories: ['personal'] },
  { id: 'lawyer', label: 'আইনজীবী', shortLabel: 'আইনজীবী', icon: UserRound, categories: ['personal'] },
  { id: 'security', label: 'পুলিশ/প্রতিরক্ষা/নিরাপত্তা কর্মী', shortLabel: 'নিরাপত্তা', icon: ShieldCheck, categories: ['personal'] },
  { id: 'professional', label: 'এনজিও/মিডিয়া/আইটি পেশাজীবী', shortLabel: 'পেশাজীবী', icon: UserRound, categories: ['personal'] },
  { id: 'freelancer', label: 'ফ্রিল্যান্সার', shortLabel: 'ফ্রিল্যান্সার', icon: UserRound, categories: ['personal'] },

  { id: 'shopkeeper', label: 'দোকানদার/খুচরা ব্যবসায়ী', shortLabel: 'দোকানদার', icon: Store, categories: ['business'] },
  { id: 'wholesale', label: 'পাইকারি ব্যবসায়ী', shortLabel: 'পাইকারি ব্যবসা', icon: Store, categories: ['business'] },
  { id: 'farmer', label: 'কৃষক/খামারি', shortLabel: 'কৃষক/খামারি', icon: Store, categories: ['business'] },
  { id: 'entrepreneur', label: 'উদ্যোক্তা/ব্যবসা প্রতিষ্ঠানের মালিক', shortLabel: 'উদ্যোক্তা', icon: Building2, categories: ['business'] },
  { id: 'online', label: 'অনলাইন ব্যবসায়ী', shortLabel: 'অনলাইন ব্যবসা', icon: Store, categories: ['business'] },
  { id: 'transport', label: 'পরিবহন ব্যবসায়ী', shortLabel: 'পরিবহন', icon: Building2, categories: ['business'] },
  { id: 'restaurant', label: 'রেস্টুরেন্ট/হোটেল ব্যবসায়ী', shortLabel: 'হোটেল/রেস্টুরেন্ট', icon: Store, categories: ['business'] },
  { id: 'service', label: 'সেবা/কারিগরি ব্যবসায়ী', shortLabel: 'সেবা ব্যবসা', icon: Building2, categories: ['business'] },
  { id: 'contractor', label: 'নির্মাণ/ঠিকাদারি ব্যবসায়ী', shortLabel: 'ঠিকাদারি', icon: Building2, categories: ['business'] },

  { id: 'expat', label: 'বিদেশে কর্মরত/প্রবাসী', shortLabel: 'প্রবাসী', icon: Plane, categories: ['expat'] },
  { id: 'expat-pro', label: 'প্রবাসী পেশাজীবী/ব্যবসায়ী', shortLabel: 'প্রবাসী পেশাজীবী', icon: Plane, categories: ['expat'] },

  { id: 'student', label: 'শিক্ষার্থী', shortLabel: 'শিক্ষার্থী', icon: GraduationCap, categories: ['student'] },
  { id: 'student-abroad', label: 'বিদেশে পড়তে ইচ্ছুক শিক্ষার্থী', shortLabel: 'বিদেশে পড়াশোনা', icon: GraduationCap, categories: ['student'] },

  { id: 'women', label: 'নারী উদ্যোক্তা/ব্যবসায়ী', shortLabel: 'নারী উদ্যোক্তা', icon: Award, categories: ['women'] },
  { id: 'women-farmer', label: 'নারী কৃষক/খামারি', shortLabel: 'নারী কৃষক', icon: Award, categories: ['women'] },
  { id: 'women-online', label: 'নারী অনলাইন উদ্যোক্তা', shortLabel: 'নারী অনলাইন', icon: Award, categories: ['women'] },

  { id: 'emergency', label: 'জরুরি চিকিৎসা/জরুরি প্রয়োজন', shortLabel: 'জরুরি প্রয়োজন', icon: HeartPulse, categories: ['emergency'] },
];

const styles: Record<string, { border: string; icon: string; accent: string; badge: string }> = {
  personal: { border: 'border-emerald-200 dark:border-emerald-900/60', icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', accent: 'bg-emerald-700', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  business: { border: 'border-amber-200 dark:border-amber-900/60', icon: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', accent: 'bg-amber-600', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  expat: { border: 'border-violet-200 dark:border-violet-900/60', icon: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', accent: 'bg-violet-700', badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  student: { border: 'border-sky-200 dark:border-sky-900/60', icon: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', accent: 'bg-sky-700', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
  women: { border: 'border-pink-200 dark:border-pink-900/60', icon: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300', accent: 'bg-pink-600', badge: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
  emergency: { border: 'border-rose-200 dark:border-rose-900/60', icon: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', accent: 'bg-rose-600', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
};

const descriptions: Record<string, string> = {
  personal: 'ব্যক্তিগত ও পারিবারিক প্রয়োজনের জন্য',
  business: 'ব্যবসা শুরু, পরিচালনা বা সম্প্রসারণের জন্য',
  expat: 'প্রবাসী ও বিদেশে কর্মরত সদস্যদের জন্য',
  student: 'শিক্ষা ও উচ্চশিক্ষার প্রয়োজনের জন্য',
  women: 'নারী উদ্যোক্তা ও ব্যবসায়ীদের জন্য',
  emergency: 'জরুরি চিকিৎসা ও অনুমোদিত জরুরি প্রয়োজনের জন্য',
};

export default function LoanCategories() {
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';
  const all = getCategories(isBn, systemSettings);
  const [occupationId, setOccupationId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const selected = OCCUPATIONS.find(item => item.id === occupationId);
  const visible = useMemo(
    () => selected ? all.filter(item => selected.categories.includes(item.id)) : all,
    [all, selected]
  );
  const quick = OCCUPATIONS.slice(0, 5);
  const results = OCCUPATIONS.filter(item => item.label.toLowerCase().includes(search.toLowerCase().trim()));
  const details = all.find(item => item.id === detailsId);

  const iconFor = (id: string) =>
    id === 'personal' ? UserRound :
    id === 'business' ? Building2 :
    id === 'expat' ? Plane :
    id === 'student' ? GraduationCap :
    id === 'women' ? Award : HeartPulse;

  return (
    <div className="loan-easy-font min-h-full bg-white dark:bg-[#070d18] text-slate-950 dark:text-white">
      <header className="px-4 pt-4 pb-3 bg-white dark:bg-[#070d18]">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#101a2b] border border-slate-100 dark:border-slate-800 flex items-center justify-center"><ArrowLeft size={20} /></button>
          <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-slate-50 dark:bg-[#101a2b] border border-slate-100 dark:border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-extrabold">ধাপ ১ / ৪</span>
          </div>
          <button onClick={() => navigate('/support')} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#101a2b] border border-slate-100 dark:border-slate-800 flex items-center justify-center"><CircleHelp size={20} /></button>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full w-1/4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-400" /></div>
      </header>

      <main className="px-4 pt-4 pb-8">
        <h1 className="text-[23px] leading-[1.15] font-black tracking-tight">সঠিক ফাইন্যান্সিং নির্বাচন করুন</h1>
        <p className="mt-1.5 text-[12px] leading-5 text-slate-500 dark:text-slate-400">আপনার পেশা নির্বাচন করলে শুধু আপনার জন্য প্রযোজ্য লোন দেখানো হবে</p>

        <section className="mt-4 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1728] p-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-black">আপনার পেশা নির্বাচন করুন</h2>
              <p className="mt-0.5 text-[10px] text-slate-400">আপনার জন্য প্রযোজ্য লোন ক্যাটাগরি নির্ধারণ হবে</p>
            </div>
            {selected && <button onClick={() => setOccupationId(null)} className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">সব দেখুন</button>}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quick.map(item => {
              const Icon = item.icon;
              const active = item.id === occupationId;
              return (
                <button key={item.id} onClick={() => setOccupationId(item.id)} className={['shrink-0 min-w-[92px] rounded-[14px] border px-3 py-2.5 text-center', active ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-slate-200 bg-slate-50/70 text-slate-700 dark:border-slate-800 dark:bg-[#101a2b] dark:text-slate-300'].join(' ')}>
                  <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-[#0b1320]"><Icon size={16} /></span>
                  <span className="mt-1 block text-[9px] font-black leading-3">{item.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <button onClick={() => setShowAll(true)} className="mt-2 w-full h-9 rounded-[11px] border border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
            সব পেশা দেখুন <ChevronRight size={14} />
          </button>

          {selected && (
            <div className="mt-3 flex items-center gap-2 rounded-[11px] bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
              <Check size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200">{selected.label}</span>
              <button onClick={() => setOccupationId(null)} className="ml-auto text-emerald-700"><X size={14} /></button>
            </div>
          )}
        </section>

        <div className="mt-5 mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black">উপলব্ধ ক্যাটাগরি সমূহ</h2>
            <p className="mt-0.5 text-[10px] text-slate-400">{selected ? 'আপনার পেশার জন্য প্রযোজ্য ক্যাটাগরি' : 'পেশা নির্বাচন করলে তালিকা স্বয়ংক্রিয়ভাবে ফিল্টার হবে'}</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{visible.length}টি</span>
        </div>

        <div className="space-y-3">
          {visible.map(cat => {
            const s = styles[cat.id];
            const Icon = iconFor(cat.id);
            return (
              <article key={cat.id} className={['rounded-[20px] border-2 bg-white dark:bg-[#0d1728] shadow-[0_4px_16px_rgba(15,23,42,0.07)] overflow-hidden', s.border].join(' ')}>
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className={['w-11 h-11 shrink-0 rounded-[13px] flex items-center justify-center', s.icon].join(' ')}><Icon size={21} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-[15px] leading-5 font-black">{cat.title} ঋণ</h3>
                          <p className="mt-0.5 text-[10px] text-slate-400">{descriptions[cat.id]}</p>
                        </div>
                        <span className={['shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black', s.badge].join(' ')}>{cat.limit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-[13px] bg-slate-50 dark:bg-[#101a2b] p-2.5">
                    <div><p className="text-[8px] text-slate-400">সুদের হার</p><p className="mt-0.5 text-[10px] font-black">{cat.intRates}/মাস</p></div>
                    <div><p className="text-[8px] text-slate-400">পরিশোধের সময়</p><p className="mt-0.5 text-[10px] font-black">{cat.tenureRange}</p></div>
                    <div><p className="text-[8px] text-slate-400">প্রসেসিং সময়</p><p className="mt-0.5 text-[10px] font-black">{cat.procTime}</p></div>
                  </div>

                  <div className="mt-2 space-y-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <p className="flex gap-1.5"><FileText size={12} className="text-emerald-600 shrink-0" />প্রধান ডকুমেন্ট: {cat.reqDocs.slice(0, 3).join(' • ')}</p>
                    <p className="flex gap-1.5"><Check size={12} className="text-emerald-600 shrink-0" />{cat.features.join(' • ')}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => setDetailsId(cat.id)} className="h-10 rounded-[12px] border border-slate-900 dark:border-slate-500 text-slate-900 dark:text-white text-[10px] font-black flex items-center justify-center gap-1"><Info size={14} />লোনের বিস্তারিত</button>
                    <button onClick={() => navigate('/apply?category=' + cat.id)} className={['h-10 rounded-[12px] text-white text-[10px] font-black flex items-center justify-center gap-1', s.accent].join(' ')}>আবেদন করুন <ChevronRight size={14} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 rounded-[15px] bg-slate-50 dark:bg-[#0d1728] border border-slate-100 dark:border-slate-800 px-3.5 py-3 flex items-center gap-2.5">
          <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
          <p className="text-[9px] leading-4 text-slate-500 dark:text-slate-400">পেশা অনুযায়ী কেবল প্রযোজ্য লোন ক্যাটাগরি দেখানো হবে। কৃষক/খামারি একটি ব্যবসায়িক পেশা হিসেবে থাকবে; মাছ, মুরগি বা সবজি আলাদা পেশা নয়।</p>
        </div>
      </main>

      {showAll && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-end justify-center">
          <div className="w-full max-w-[520px] max-h-[86vh] rounded-t-[24px] bg-white dark:bg-[#0b1320] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div><h3 className="text-[16px] font-black">সব পেশা নির্বাচন করুন</h3><p className="mt-0.5 text-[10px] text-slate-400">{OCCUPATIONS.length}টি পেশা</p></div>
                <button onClick={() => setShowAll(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="mt-3 h-10 rounded-[12px] bg-slate-50 dark:bg-[#101a2b] border border-slate-200 dark:border-slate-800 flex items-center gap-2 px-3">
                <Search size={16} className="text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পেশা খুঁজুন..." className="w-full bg-transparent outline-none text-[11px] font-semibold" />
              </div>
            </div>
            <div className="p-3 overflow-y-auto max-h-[62vh]">
              <div className="grid grid-cols-2 gap-2">
                {results.map(item => {
                  const Icon = item.icon;
                  const active = item.id === occupationId;
                  return (
                    <button key={item.id} onClick={() => { setOccupationId(item.id); setShowAll(false); setSearch(''); }} className={['text-left rounded-[14px] border p-3 flex items-center gap-2.5', active ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0e1727]'].join(' ')}>
                      <span className="w-9 h-9 rounded-[11px] flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Icon size={16} /></span>
                      <span className="min-w-0 flex-1 text-[10px] font-black leading-4">{item.label}</span>
                      {active && <Check size={15} className="text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-[60] bg-slate-950/50 flex items-end justify-center">
          <div className="w-full max-w-[520px] max-h-[88vh] rounded-t-[25px] bg-white dark:bg-[#0b1320] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className={['w-11 h-11 rounded-[13px] flex items-center justify-center', styles[details.id].icon].join(' ')}><FileText size={21} /></div>
              <div className="flex-1"><h3 className="text-[17px] font-black">{details.title} ঋণের বিস্তারিত</h3><p className="text-[10px] text-slate-400">{descriptions[details.id]}</p></div>
              <button onClick={() => setDetailsId(null)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[72vh] space-y-4">
              <section>
                <h4 className="text-[12px] font-black">লোন সংক্রান্ত তথ্য</h4>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <InfoBox label="সর্বোচ্চ লোন" value={details.limit} />
                  <InfoBox label="সুদের হার" value={details.intRates + '/মাস'} />
                  <InfoBox label="মেয়াদ" value={details.tenureRange} />
                  <InfoBox label="প্রসেসিং সময়" value={details.procTime} />
                  <InfoBox label="প্রসেসিং ফি" value={details.procFeeLabel} />
                  <InfoBox label="সঞ্চয়/ডিপোজিট" value={details.secDepositLabel} />
                </div>
              </section>
              <section>
                <h4 className="text-[12px] font-black">প্রয়োজনীয় ডকুমেন্ট</h4>
                <div className="mt-2 space-y-1.5">{details.reqDocs.map(doc => <div key={doc} className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300"><Check size={13} className="text-emerald-600" />{doc}</div>)}</div>
              </section>
              <section>
                <h4 className="text-[12px] font-black">আবেদনের ধাপ</h4>
                <ol className="mt-2 space-y-2 text-[10px] text-slate-600 dark:text-slate-300">
                  {['লোনের পরিমাণ নির্বাচন', 'তথ্য পূরণ', 'ডকুমেন্ট আপলোড', 'আবেদন জমা ও যাচাই', 'অনুমোদনের পর প্রযোজ্য ফি/ডিপোজিট', 'চূড়ান্ত অনুমোদন ও বিতরণ'].map((step, i) => <li key={step} className="flex gap-2"><span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0">{i + 1}</span><span>{step}</span></li>)}
                </ol>
              </section>
              <button onClick={() => navigate('/apply?category=' + details.id)} className={['w-full h-11 rounded-[13px] text-white text-[11px] font-black flex items-center justify-center gap-1', styles[details.id].accent].join(' ')}>এই লোনের জন্য আবেদন করুন <ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[12px] bg-slate-50 dark:bg-[#101a2b] p-3"><p className="text-[9px] text-slate-400">{label}</p><p className="mt-1 text-[11px] font-black">{value}</p></div>;
}
