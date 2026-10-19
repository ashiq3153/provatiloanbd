import { ArrowUpRight, BriefcaseBusiness, GraduationCap, HeartPulse, House, Plane, ShieldCheck, WalletCards } from 'lucide-react';

const categories = [
  { title: 'ব্যক্তিগত ঋণ', en: 'Personal loan', icon: WalletCards, color: 'from-sky-500 to-blue-600' },
  { title: 'ব্যবসায়িক ঋণ', en: 'Business loan', icon: BriefcaseBusiness, color: 'from-emerald-500 to-teal-600' },
  { title: 'প্রবাসী ঋণ', en: 'Probashi loan', icon: Plane, color: 'from-violet-500 to-indigo-600' },
  { title: 'শিক্ষা ঋণ', en: 'Education loan', icon: GraduationCap, color: 'from-amber-500 to-orange-600' },
  { title: 'জরুরি ঋণ', en: 'Emergency loan', icon: HeartPulse, color: 'from-rose-500 to-pink-600' },
  { title: 'নারী উদ্যোক্তা ঋণ', en: 'Women entrepreneur', icon: House, color: 'from-fuchsia-500 to-purple-600' },
];

export default function BrowserPreviewHome() {
  return (
    <main className="min-h-[100dvh] bg-slate-950 text-white p-4 sm:p-7">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-xs font-bold text-amber-200">
          <span>PREVIEW MODE · ডেমো UI — কোনো প্রকৃত সদস্য/ব্যালেন্সের তথ্য নয়</span>
          <span className="rounded-full border border-amber-200/30 px-2.5 py-1">Read-only</span>
        </div>
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600"><ShieldCheck size={25} /></div>
            <div><p className="text-xs font-bold tracking-[0.2em] text-sky-300">PROVATI SOMOBAY SOMITI</p><h1 className="text-xl font-black">PROVATI LOAN</h1></div>
          </div>
          <a href="https://t.me/provatiloanpssbot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-extrabold hover:bg-sky-400">Telegram-এ খুলুন <ArrowUpRight size={15} /></a>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-sky-300/20 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-6 sm:p-8 shadow-xl shadow-blue-950/40">
            <p className="text-sm font-semibold text-sky-100">স্বাগতম, রাহিম উদ্দিন</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black leading-tight">আপনার আর্থিক পরিকল্পনা<br/>শুরু হোক সহজভাবে</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">প্রয়োজন অনুযায়ী ঋণের ধরন বেছে নিন। আবেদন জমা দিতে Telegram Mini App-এ প্রবেশ করুন।</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://t.me/provatiloanpssbot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-blue-800">আবেদন করুন <ArrowUpRight size={16}/></a>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold"><ShieldCheck size={16}/> নিরাপদ আবেদন</div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-900 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Demo application</p>
            <h3 className="mt-3 text-lg font-black">ব্যক্তিগত ঋণ</h3>
            <p className="mt-1 text-sm text-slate-400">আবেদন আইডি: DEMO-001</p>
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
              <p className="text-xs text-amber-200">নমুনা স্ট্যাটাস</p><p className="mt-1 font-extrabold text-amber-100">রিভিউয়ের অপেক্ষায়</p>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">এটি শুধু স্ক্রিন দেখার জন্য নমুনা। কোনো বাস্তব আবেদন ডেটাবেজ থেকে আনা হয়নি।</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Loan products</p><h2 className="mt-1 text-xl font-black">ঋণের ধরন নির্বাচন করুন</h2></div><p className="text-xs text-slate-500">৬টি বিভাগ</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item) => { const Icon = item.icon; return <article key={item.en} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4 transition hover:border-sky-300/30"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}><Icon size={22}/></div><div className="min-w-0"><h3 className="font-extrabold">{item.title}</h3><p className="mt-1 text-xs text-slate-400">{item.en}</p></div><ArrowUpRight className="ml-auto text-slate-500" size={16}/></article>; })}
          </div>
        </section>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">ইন্টারঅ্যাকটিভ আবেদন, বাস্তব ডেটা ও যাচাইকৃত অ্যাডমিন ফিচার ব্যবহার করতে Telegram-এর ভেতরে অ্যাপটি খুলুন। এই preview deploy Production-এ সক্রিয় নয়।</p>
      </div>
    </main>
  );
}
