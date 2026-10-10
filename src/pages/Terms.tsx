import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Landmark, FileText, CheckCircle2, AlertCircle, HelpCircle, UserCheck, ShieldAlert, BadgeAlert } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { convertDigits } from '../lib/translation';

export default function Terms() {
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(language === 'bn' ? 'bn' : 'en');
  const [activeSection, setActiveSection] = useState<string>('all');

  const isBn = currentLang === 'bn';
  const monthlyRateLabel = (key: string, fallback: number) => {
    const configured = Number(systemSettings?.[key]);
    const rate = Number.isFinite(configured) && configured >= 0 ? configured : fallback;
    return convertDigits((rate * 100).toFixed(2).replace(/\.?0+$/, '') + '%', isBn);
  };
  const loanLimitLabel = (key: string, fallback: number) => {
    const configured = Number(systemSettings?.categories?.[key]?.maxAmount);
    const amount = Number.isFinite(configured) && configured > 0 ? configured : fallback;
    return convertDigits(amount.toLocaleString('en-IN'), isBn);
  };







  const sections = [
    { id: 'terms', titleBn: '১. নিয়ম ও শর্তাবলী', titleEn: '1. Terms & Conditions', icon: FileText },
    { id: 'guidelines', titleBn: '২. ঋণ নির্দেশিকা', titleEn: '2. Loan Guidelines', icon: ShieldCheck },
    { id: 'notices', titleBn: '৩. গুরুত্বপূর্ণ নোটিশ', titleEn: '3. Important Notices', icon: BadgeAlert },
    { id: 'responsibilities', titleBn: '৪. ব্যবহারকারীর দায়িত্ব', titleEn: '4. User Responsibilities', icon: UserCheck },
    { id: 'deposit_policy', titleBn: '৫. সঞ্চয় ও ডিপোজিট নীতিমালা', titleEn: '5. Savings & Deposit Policies', icon: Landmark },
    { id: 'approval_cond', titleBn: '৬. ঋণ অনুমোদন শর্তাবলী', titleEn: '6. Loan Approval Conditions', icon: CheckCircle2 },
    { id: 'withdrawal_cond', titleBn: '৭. লোন উত্তোলন শর্তাবলী', titleEn: '7. Withdrawal Conditions', icon: Landmark },
    { id: 'verification_rules', titleBn: '৮. যাচাইকরণ নিয়মাবলী', titleEn: '8. Verification Rules', icon: ShieldCheck },
    { id: 'privacy', titleBn: '৯. গোপনীয়তা নীতি', titleEn: '9. Privacy Policy', icon: ShieldAlert },
    { id: 'warnings', titleBn: '১০. সতর্কবার্তা ও ঝুঁকি নোটিশ', titleEn: '10. Warnings & Risk Notices', icon: AlertCircle },
    { id: 'appeals', titleBn: '১১. অভিযোগ ও আপিল', titleEn: '11. Complaints & Appeals', icon: HelpCircle },
    { id: 'faq', titleBn: '১২. সাধারণ জিজ্ঞাসা (FAQ)', titleEn: '12. FAQ', icon: HelpCircle },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-[#0b1220] flex flex-col relative transition-colors font-sans pb-12">
      {/* Premium Neumorphic Header */}
      <div className="px-5 py-4 sticky top-0 z-30 flex items-center justify-between bg-slate-50 dark:bg-[#0b1220] shrink-0 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all border-0 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? 'নীতিমালা ও শর্তাবলী' : 'Policies & Terms'}
            </h1>
            <p className="text-[10px] font-bold text-gray-505 dark:text-gray-400 uppercase tracking-wide">
              Provati Somobay Somiti
            </p>
          </div>
        </div>
        
        {/* Language Switcher */}
        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 border-0">
          <button
            onClick={() => setCurrentLang('bn')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-0 cursor-pointer ${currentLang === 'bn' ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-none' : 'text-gray-500 dark:text-gray-400 bg-transparent hover:text-gray-900 dark:hover:text-white'}`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setCurrentLang('en')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-0 cursor-pointer ${currentLang === 'en' ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-none' : 'text-gray-500 dark:text-gray-400 bg-transparent hover:text-gray-900 dark:hover:text-white'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6 relative">
        {/* Table of Contents sidebar */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 h-max space-y-2 bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm p-4 rounded-[24px] border-0 transition-colors bg-transparent">
          <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 px-3 tracking-widest mb-3">
            {isBn ? 'সূচিপত্র' : 'Table of Contents'}
          </p>
          <button
            onClick={() => setActiveSection('all')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all border-0 cursor-pointer ${
              activeSection === 'all' 
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-none' 
                : 'text-gray-600 dark:text-gray-400 bg-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isBn ? 'সবগুলো বিষয়' : 'All Sections'}
          </button>
          {sections.map((s) => {
            const Icon = s.icon;
            const isSel = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-0 cursor-pointer ${
                  isSel 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-none' 
                    : 'text-gray-600 dark:text-gray-400 bg-transparent hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={14} className={isSel ? 'text-white' : 'text-gray-400'} />
                <span>{isBn ? s.titleBn : s.titleEn}</span>
              </button>
            );
          })}
        </aside>

        {/* Policies Content */}
        <div className="flex-1 space-y-6">
          {/* Section 1: Terms & Conditions */}
          {(activeSection === 'all' || activeSection === 'terms') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <FileText className="text-primary-500" size={20} />
                {isBn ? '১. নিয়ম ও শর্তাবলী' : '1. Terms & Conditions'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>ক. <b>প্রভাতি সমবায় সমিতি</b> অ্যাপ্লিকেশনের মাধ্যমে ঋণ আবেদনের ক্ষেত্রে আবেদনকারীকে অবশ্যই সমিতির একজন বৈধ সদস্য হতে হবে এবং তার সমস্ত তথ্য সঠিক হতে হবে।</p>
                  <p>খ. ঋণ অনুমোদন বা প্রত্যাখ্যানের সিদ্ধান্ত প্রযোজ্য নীতিমালা ও যাচাইয়ের ভিত্তিতে নেওয়া হবে। সিদ্ধান্ত পুনর্বিবেচনার অনুরোধ জানাতে ব্যবহারকারী অ্যাপের সহায়তা (Support) পৃষ্ঠা ব্যবহার করতে পারবেন।</p>
                  <p>গ. ভুল তথ্য বা জাল নথির যুক্তিসংগত সন্দেহ হলে যাচাইয়ের জন্য অ্যাকাউন্ট সাময়িকভাবে সীমিত করা হতে পারে। নিশ্চিত জালিয়াতির ক্ষেত্রে প্রযোজ্য ব্যবস্থা নেওয়া হবে; ব্যবহারকারী Support পৃষ্ঠার মাধ্যমে পুনর্বিবেচনার অনুরোধ করতে পারবেন।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>a. To apply for a loan through <b>Provati Somobay Somiti</b>, the applicant must be a registered member, and all provided details must be accurate.</p>
                  <p>b. Loan approval or rejection decisions are made under applicable policies and verification. Applicants may request reconsideration through the in-app Support page.</p>
                  <p>c. Suspected false information or forged documents may lead to a temporary restriction while reviewed. Appropriate action may follow confirmed fraud; users may request reconsideration through the in-app Support page.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 2: Loan Guidelines */}
          {(activeSection === 'all' || activeSection === 'guidelines') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="text-primary-500" size={20} />
                {isBn ? '২. ঋণ নির্দেশিকা' : '2. Loan Guidelines'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed font-bold">
                  <p>ঋণ পাওয়ার জন্য আবেদনকারীকে তার পেশা অনুযায়ী সঠিক ক্যাটাগরি নির্বাচন করতে হবে। প্রতিটি ক্যাটাগরির জন্য ঋণের সর্বোচ্চ সীমা এবং মাসিক সুদের হার আলাদা হতে পারে:</p>
                  <ul className="list-disc pl-5 space-y-1.5 font-extrabold">
                    <li><b>ব্যক্তিগত লোন (Personal):</b> চাকুরিজীবীদের জন্য সর্বোচ্চ {loanLimitLabel('personal', 500000)} টাকা পর্যন্ত ঋণ। মাসিক সুদ {monthlyRateLabel('minRatePersonal', 0.0055)}।</li>
                    <li><b>ব্যবসায়িক লোন (Business):</b> ব্যবসায়ীদের জন্য সর্বোচ্চ {loanLimitLabel('business', 5000000)} টাকা পর্যন্ত ঋণ। মাসিক সুদ {monthlyRateLabel('minRateBusiness', 0.0055)}।</li>
                    <li><b>প্রবাসী লোন (Probashi):</b> রেমিট্যান্স যোদ্ধাদের জন্য সর্বোচ্চ {loanLimitLabel('expat', 1000000)} টাকা পর্যন্ত ঋণ। মাসিক সুদ {monthlyRateLabel('minRateExpat', 0.005)}।</li>
                    <li><b>শিক্ষা লোন (Student):</b> শিক্ষার্থীদের জন্য সর্বোচ্চ {loanLimitLabel('student', 500000)} টাকা পর্যন্ত ঋণ। মাসিক সুদ {monthlyRateLabel('minRateStudent', 0.005)}।</li>
                    <li><b>জরুরি লোন (Emergency):</b> তাৎক্ষণিক প্রয়োজনের জন্য সর্বোচ্চ {loanLimitLabel('emergency', 100000)} টাকা পর্যন্ত ঋণ। মাসিক সুদ {monthlyRateLabel('minRateEmergency', 0.006)}।</li>
                    <li><b>মহিলা উদ্যোক্তা লোন (Women):</b> নারী উদ্যোক্তাদের জন্য সর্বোচ্চ {loanLimitLabel('women', 2000000)} টাকা পর্যন্ত ঋণ। মাসিক সুদ {monthlyRateLabel('minRateWomen', 0.0055)}।</li>
                  </ul>
                  <p className="font-bold">ঋণের মাসিক কিস্তি (EMI) লোন ক্যালকুলেটরের মাধ্যমে স্বয়ংক্রিয়ভাবে হিসাব করা হয়। সময়কাল ৬ থেকে ১২০ মাসের মধ্যে স্ন্যাপ পয়েন্ট অনুযায়ী নির্বাচন করা যাবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed font-bold">
                  <p>Applicants must select the appropriate category matching their profession. Loan limits and interest rates are defined as follows:</p>
                  <ul className="list-disc pl-5 space-y-1.5 font-extrabold">
                    <li><b>Personal Loan:</b> For salaried employees up to BDT {loanLimitLabel('personal', 500000)}. Monthly rate {monthlyRateLabel('minRatePersonal', 0.0055)}.</li>
                    <li><b>Business Loan:</b> For entrepreneurs up to BDT {loanLimitLabel('business', 5000000)}. Monthly rate {monthlyRateLabel('minRateBusiness', 0.0055)}.</li>
                    <li><b>Probashi Loan:</b> For overseas workers up to BDT {loanLimitLabel('expat', 1000000)}. Monthly rate {monthlyRateLabel('minRateExpat', 0.005)}.</li>
                    <li><b>Student Loan:</b> For students up to BDT {loanLimitLabel('student', 500000)}. Monthly rate {monthlyRateLabel('minRateStudent', 0.005)}.</li>
                    <li><b>Emergency Loan:</b> For urgent situations up to BDT {loanLimitLabel('emergency', 100000)}. Monthly rate {monthlyRateLabel('minRateEmergency', 0.006)}.</li>
                    <li><b>Women Entrepreneur Loan:</b> For female entrepreneurs up to BDT {loanLimitLabel('women', 2000000)}. Monthly rate {monthlyRateLabel('minRateWomen', 0.0055)}.</li>
                  </ul>
                  <p className="font-bold">Equated Monthly Installments (EMI) are auto-calculated. Repayment periods are snappable between 6 and 120 months depending on category limits.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 3: Important Notices */}
          {(activeSection === 'all' || activeSection === 'notices') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <BadgeAlert className="text-amber-500" size={20} />
                {isBn ? '৩. গুরুত্বপূর্ণ নোটিশ' : '3. Important Notices'}
              </h2>
              {isBn ? (
                <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 leading-relaxed space-y-2 font-bold">
                  <p className="font-extrabold flex items-center gap-1.5"><AlertCircle size={14} /> প্রসেসিং ফি বাধ্যতামুলক:</p>
                  <p>প্রযোজ্য প্রসেসিং ফি আবেদনপত্রে দেখানো হার ও পরিমাণ অনুযায়ী জমা দিতে হবে। আবেদন প্রত্যাখ্যাত বা বাতিল হলে, অথবা প্রযোজ্য ক্ষেত্রে সেবা সম্পন্ন না হলে, আবেদনকারী প্রসেসিং ফি ফেরত পাওয়ার যোগ্য হবেন। ফেরতের অনুরোধ ও যাচাইয়ের জন্য অ্যাপের Support পৃষ্ঠা ব্যবহার করুন। পেমেন্ট যাচাই ও আবেদন পর্যালোচনা পৃথক ধাপ; ফি প্রদান ঋণ অনুমোদনের নিশ্চয়তা নয়।</p>
                  <p className="font-extrabold mt-3">অ্যাডমিন রিভিউ এবং চ্যাট:</p>
                  <p>যাচাইকরণের সময় কোনো তথ্যে ঘাটতি থাকলে সংশোধন (Revision) নোট পাঠানো হতে পারে। নোটের নির্দেশনা অনুসারে তথ্য সংশোধন করে পুনরায় যাচাইয়ের জন্য জমা দিন।</p>
                </div>
              ) : (
                <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 leading-relaxed space-y-2 font-bold">
                  <p className="font-extrabold flex items-center gap-1.5"><AlertCircle size={14} /> Processing Fee is Mandatory:</p>
                  <p>The applicable processing fee must be paid at the rate and amount shown in the application. If an application is rejected or cancelled, or the service is not completed in an applicable case, the applicant is eligible for a processing-fee refund. Use the in-app Support page to request and verify a refund. Payment verification and application review are separate steps; payment does not guarantee loan approval.</p>
                  <p className="font-extrabold mt-3">Admin Reviews & Revisions:</p>
                  <p>If details require correction, a revision note may be issued. Follow the note, correct the information and resubmit for review.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 4: User Responsibilities */}
          {(activeSection === 'all' || activeSection === 'responsibilities') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <UserCheck className="text-primary-500" size={20} />
                {isBn ? '৪. ব্যবহারকারীর দায়িত্ব' : '4. User Responsibilities'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>১. ব্যবহারকারীকে অবশ্যই তার নিজস্ব সচল মোবাইল ব্যাংকিং নম্বর অথবা ব্যাংক অ্যাকাউন্ট ব্যবহার করতে হবে।</p>
                  <p>২. লোন আবেদনের সময় আপলোডকৃত ডকুমেন্টস (যেমন: এনআইডি, সেলফি ও আয়ের প্রমাণপত্র) পরিষ্কার এবং স্পষ্ট হতে হবে।</p>
                  <p>৩. ঋণের কিস্তি (EMI) প্রতি মাসের নির্ধারিত তারিখের মধ্যে পেমেন্ট গেটওয়ের মাধ্যমে পরিশোধ করা ব্যবহারকারীর ব্যক্তিগত দায়িত্ব।</p>
                  <p>৪. অন্য কোনো ব্যক্তির হয়ে ঋণ আবেদন করা অথবা ডুপ্লিকেট অ্যাকাউন্ট পরিচালনা করা আইনত দণ্ডনীয় এবং এর ফলে অ্যাকাউন্ট বাতিল হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>1. Members must use their own active mobile banking numbers or bank accounts for transactions.</p>
                  <p>2. Uploaded documents (NID cards, selfies, and income certificates) must be clearly legible and authentic.</p>
                  <p>3. Repaying Equated Monthly Installments (EMIs) on or before the monthly due dates is the sole responsibility of the user.</p>
                  <p>4. Applying on behalf of others or managing multiple duplicate accounts is strictly prohibited and will trigger automatic account termination.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 5: Savings & Deposit Policies */}
          {(activeSection === 'all' || activeSection === 'deposit_policy') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <Landmark className="text-primary-500" size={20} />
                {isBn ? '৫. সঞ্চয় ও ডিপোজিট নীতিমালা' : '5. Savings & Deposit Policies'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed font-bold">
                  <p>লোন প্রসেস ও বিতরণের স্বার্থে দুই ধরনের ডিপোজিট প্রযোজ্য হয়ে থাকে:</p>
                  <div className="space-y-2">
                    <p className="font-extrabold text-gray-900 dark:text-white">• প্রসেসিং ফি (Processing Fee):</p>
                    <p className="pl-4">প্রসেসিং ফি অ্যাডমিনের বর্তমান অনুমোদিত সিস্টেম সেটিংস অনুযায়ী নির্ধারিত হবে। পেমেন্টের আগে আবেদনপত্রে প্রদর্শিত হার ও পরিমাণ যাচাই করুন। আবেদন প্রত্যাখ্যাত বা বাতিল হলে, অথবা প্রযোজ্য ক্ষেত্রে সেবা সম্পন্ন না হলে, ফি ফেরতযোগ্য; ফেরতের অনুরোধ অ্যাপের Support পৃষ্ঠা দিয়ে করতে হবে।</p>
                    
                    <p className="font-extrabold text-gray-900 dark:text-white">• সঞ্চয় আমানত (Savings Deposit / Security Deposit):</p>
                    <p className="pl-4">সঞ্চয়/সিকিউরিটি ডিপোজিটের হার অনুমোদিত সিস্টেম সেটিংস অনুযায়ী নির্ধারিত হবে। ডিপোজিট লক থাকবে এবং Available Balance-এর অংশ হবে না। ঋণের সব কিস্তি ও প্রযোজ্য বকেয়া পরিশোধের পর হিসাব যাচাই করে মুক্তির যোগ্যতা নির্ধারণ করা হবে; আবেদন অ্যাপের Support পৃষ্ঠা দিয়ে করতে হবে।</p>
                  </div>
                  <p className="bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3 rounded-xl border border-rose-500/20 text-[11px] font-extrabold">
                    *সতর্কতা: ভুয়া ট্রানজেকশন আইডি বা অন্যের পেমেন্ট প্রমাণ জমা দিলে আবেদন প্রত্যাখ্যান ও অ্যাকাউন্ট-সংক্রান্ত ব্যবস্থা নেওয়া হতে পারে। Support পৃষ্ঠার মাধ্যমে সিদ্ধান্ত পুনর্বিবেচনার অনুরোধ করা যাবে.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed font-bold">
                  <p>Two types of deposits apply under the microfinance structure:</p>
                  <div className="space-y-2">
                    <p className="font-extrabold text-gray-900 dark:text-white">• Processing Fee:</p>
                    <p className="pl-4">The processing fee is determined by the administrator's currently approved system settings. Check the rate and amount displayed in the application before payment. The fee is refundable if the application is rejected or cancelled, or the service is not completed in an applicable case; use the in-app Support page to request a refund.</p>
                    
                    <p className="font-extrabold text-gray-900 dark:text-white">• Savings Deposit:</p>
                    <p className="pl-4">The savings/security deposit rate is determined by currently approved system settings. The deposit remains locked and is not part of the Available Balance. After all instalments and applicable outstanding dues are paid, the account will be reconciled to determine release eligibility; request this through the in-app Support page.</p>
                  </div>
                  <p className="bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3 rounded-xl border border-rose-500/20 text-[11px] font-extrabold">
                    *Fraud notice: Forged transaction IDs or another person's payment proof may lead to application rejection and appropriate account action. Users may request reconsideration through the Support page.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Section 6: Loan Approval Conditions */}
          {(activeSection === 'all' || activeSection === 'approval_cond') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <CheckCircle2 className="text-primary-500" size={20} />
                {isBn ? '৬. ঋণ অনুমোদন শর্তাবলী' : '6. Loan Approval Conditions'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>ঋণ আবেদনের চূড়ান্ত অনুমোদনের জন্য নিম্নোক্ত শর্তগুলো পূরণ হতে হবে:</p>
                  <p>১. ব্যবহারকারীর প্রোফাইল তথ্য সম্পূর্ণ হতে হবে এবং কোনো ডুপ্লিকেট বা ভুয়া আবেদন সনাক্ত হওয়া যাবে না।</p>
                  <p>২. এনআইডি কার্ডের সামনের ও পেছনের স্পষ্ট ছবি এবং আবেদনকারীর স্পষ্ট লাইভ সেলফি আপলোড হতে হবে।</p>
                  <p>৩. প্রসেসিং ফি এবং সঞ্চয় আমানত ডিপোজিটের প্রমাণপত্র সঠিক হতে হবে এবং এডমিন প্যানেল কর্তৃক তা ভেরিফাইড (Completed) হতে হবে।</p>
                  <p>৪. পূর্বে কোনো অনাদায়ী বা ওভারডিউ লোন থাকা যাবে না।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>The following conditions must be met before a loan is approved by the admin committee:</p>
                  <p>1. The applicant profile must be complete, with no duplicate or suspicious data detected.</p>
                  <p>2. High-resolution photos of NID front, back, and a live selfie must be submitted.</p>
                  <p>3. Both the processing fee and savings deposits must be approved (completed status) by the admin panel.</p>
                  <p>4. The member must not have any overdue unpaid loans in their active profiles.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 7: Withdrawal Conditions */}
          {(activeSection === 'all' || activeSection === 'withdrawal_cond') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <Landmark className="text-primary-500" size={20} />
                {isBn ? '৭. লোন উত্তোলন শর্তাবলী' : '7. Withdrawal Conditions'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>ক. ঋণ অনুমোদন, ঋণের অর্থ বিতরণ এবং উত্তোলনযোগ্য ব্যালেন্স পৃথক ধাপ। শুধু ঋণ অনুমোদিত হলেই পুরো অনুমোদিত অঙ্ক Available Balance-এ যোগ হয়েছে বলে গণ্য হবে না।</p>
                  <p>খ. Available Balance-এ কেবল যাচাইকৃত ও লেজারে নথিভুক্ত এমন অর্থ গণ্য হবে, যা বাস্তবে উত্তোলন করা যায়। উত্তোলনের অনুরোধের আগে অ্যাপে প্রদর্শিত বর্তমান ব্যালেন্স যাচাই করুন।</p>
                  <p>গ. উত্তোলন সফল হলে লেনদেনের পরিমাণ অনুযায়ী Available Balance হালনাগাদ হবে। অপেক্ষমাণ উত্তোলন অনুরোধের অর্থ প্রযোজ্য ক্ষেত্রে সাময়িকভাবে সংরক্ষিত থাকতে পারে।</p>
                  <p>ঘ. লক থাকা সঞ্চয়/সিকিউরিটি ডিপোজিট পৃথকভাবে হিসাবভুক্ত হবে এবং উত্তোলনযোগ্য ব্যালেন্সের সঙ্গে যোগ হবে না।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>a. Loan approval, disbursement and available withdrawal balance are separate stages. Approval alone does not mean that the full approved amount is available to withdraw.</p>
                  <p>b. Available Balance includes only verified funds properly recorded in the ledger and actually available for withdrawal. Check the balance displayed in the app before requesting a withdrawal.</p>
                  <p>c. After a successful withdrawal, the Available Balance is updated by the transaction amount. Funds associated with pending withdrawal requests may be reserved where applicable.</p>
                  <p>d. Locked savings/security deposits are accounted for separately and are not included in the withdrawable balance.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 8: Verification Rules */}
          {(activeSection === 'all' || activeSection === 'verification_rules') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="text-primary-500" size={20} />
                {isBn ? '৮. যাচাইকরণ নিয়মাবলী' : '8. Verification Rules'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>১. <b>পরিচয়পত্র যাচাইকরণ:</b> আবেদনকারীকে অবশ্যই জাতীয় পরিচয়পত্রের (NID) সামনের এবং পেছনের মূল অংশ ক্যামেরার মাধ্যমে পরিষ্কারভাবে তুলে আপলোড করতে হবে। স্ক্যান কপি বা অস্পষ্ট ছবি বাতিল করা হবে।</p>
                  <p>২. <b>জীবন্ততা পরীক্ষা (Selfie Verification):</b> আবেদনকারীর সেলফি ছবি আপলোড করতে হবে, যেখানে তার মুখমণ্ডল স্পষ্ট দেখা যায়। পরিচয় জালিয়াতি রোধে এটি বাধ্যতামূলক।</p>
                  <p>৩. <b>পেশাগত প্রমাণপত্র:</b> ক্যাটাগরি অনুযায়ী অফিস আইডি কার্ড, ট্রেড লাইসেন্স, পাসপোর্ট কপি বা স্টুডেন্ট আইডি কার্ড সঠিক ফরম্যাটে (PDF/Image) আপলোড করতে হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>1. <b>Identity Checks:</b> High-quality photographs of the original NID card front and back must be uploaded. Scans or blurred photographs will be rejected.</p>
                  <p>2. <b>Selfie Verification:</b> Clear selfie photographs are required to verify the applicant's identity and prevent impersonation.</p>
                  <p>3. <b>Professional Proofs:</b> Depending on the category, office ID card, trade license, passport visa copy, or student ID card must be uploaded in image/PDF format.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 9: Privacy Policy */}
          {(activeSection === 'all' || activeSection === 'privacy') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <ShieldAlert className="text-primary-500" size={20} />
                {isBn ? '৯. গোপনীয়তা নীতি' : '9. Privacy Policy'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>ক. ঋণ আবেদন ও হিসাব পরিচালনার জন্য নাম, যোগাযোগের তথ্য, ঠিকানা, এনআইডি, পেশা/আয়ের তথ্য, ব্যাংক বা মোবাইল ব্যাংকিং তথ্য, নমিনি এবং আপলোড করা নথির মতো তথ্য প্রক্রিয়া করা হতে পারে। প্রয়োজনীয় সেবা-প্রদানকারী তথ্য প্রক্রিয়া করতে পারে; তাই কোনো তৃতীয় পক্ষের সঙ্গে কখনো তথ্য শেয়ার হয় না—এমন পরম নিশ্চয়তা দেওয়া হচ্ছে না।</p>
                  <p>খ. ঋণ আবেদনের প্রতিটি ধাপের রিয়েল-টাইম আপডেট প্রদান করতে আমরা আবেদনকারীর টেলিগ্রাম চ্যাট আইডি (Telegram Chat ID) ব্যবহার করি।</p>
                  <p>গ. আপলোড করা নথি অ্যাপের স্টোরেজে সংরক্ষণ করা হয় এবং অ্যাক্সেস নিয়ন্ত্রণের মাধ্যমে তা সীমিত রাখার ব্যবস্থা রয়েছে। এনক্রিপশন, সংরক্ষণকাল ও প্রবেশাধিকার সম্পর্কে দাবি যাচাইকৃত প্রযুক্তিগত ব্যবস্থার সঙ্গে সামঞ্জস্যপূর্ণ হতে হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>a. To process applications and manage accounts, the app may process names, contact details, addresses, NID, occupation/income details, bank or mobile-banking information, nominee details and uploaded documents. Necessary service providers may process data under applicable safeguards; the app does not make an absolute claim that information is never shared with any third party.</p>
                  <p>b. We collect the user's Telegram Chat ID to send automatic real-time transaction and loan application updates.</p>
                  <p>c. Uploaded documents are stored in the app's storage with intended access controls. Claims about encryption, retention and exclusive access must match verified technical controls.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 10: Warnings & Risk Notices */}
          {(activeSection === 'all' || activeSection === 'warnings') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-rose-600 dark:text-rose-400 border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={20} />
                {isBn ? '১০. সতর্কবার্তা ও ঝুঁকি নোটিশ' : '10. Warnings & Risk Notices'}
              </h2>
              {isBn ? (
                <div className="text-xs text-rose-800 dark:text-rose-400 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 leading-relaxed space-y-2.5 font-bold">
                  <p>• <b>ঋণ খেলাপি সতর্কতা:</b> সময়মতো কিস্তি পরিশোধ না হলে ঋণ overdue হিসেবে চিহ্নিত হতে পারে এবং ভবিষ্যৎ আবেদনের যোগ্যতা প্রভাবিত হতে পারে। প্রযোজ্য ব্যবস্থা নীতিমালা অনুযায়ী নেওয়া হবে।</p>
                  <p>• <b>জালিয়াতি দমন (Anti-Fraud Policy):</b> যদি কোনো আবেদনকারীর মোবাইল নাম্বার, ব্যাংক একাউন্ট বা এনআইডি জালিয়াতি বা অন্যের তথ্য ব্যবহারের মাধ্যমে সনাক্ত হয়, তবে "Fake Apply Detected" অ্যালার্ম ট্রিগার হবে এবং অ্যাকাউন্ট সাথে সাথে সাসপেন্ড করা হবে।</p>
                  <p>• <b>সমবায় নীতিমালা:</b> ঋণ-সংক্রান্ত সিদ্ধান্ত অনুমোদিত নীতিমালা অনুযায়ী নেওয়া হবে। আবেদনকারী অভিযোগ বা পুনর্বিবেচনার অনুরোধ জানাতে পারবেন।</p>
                </div>
              ) : (
                <div className="text-xs text-rose-800 dark:text-rose-300 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 leading-relaxed space-y-2.5 font-bold">
                  <p>• <b>Payment Default:</b> Failure to repay monthly EMIs will lead to loan classification (Overdue) and may permanently affect credit eligibility for future cooperative loans.</p>
                  <p>• <b>Anti-Fraud Policy:</b> Suspected duplicate identities or forged payment proofs may trigger review or temporary restriction. Confirmed fraud may result in appropriate action; users may request reconsideration through the Support page.</p>
                  <p>• <b>Cooperative Rules:</b> Administrative decisions are made under applicable approved policies. This does not remove the applicant's ability to raise a complaint or request reconsideration.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 11: Complaints & Appeals */}
          {(activeSection === 'all' || activeSection === 'appeals') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <HelpCircle className="text-primary-500" size={20} />
                {isBn ? '১১. অভিযোগ ও আপিল' : '11. Complaints & Appeals'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>১. আবেদন প্রত্যাখ্যান, ভুল তথ্য হিসেবে চিহ্নিত হওয়া, পেমেন্ট/ডিপোজিটের হিসাবের অমিল বা অন্য কোনো আবেদন-সংক্রান্ত সিদ্ধান্ত পুনর্বিবেচনার জন্য অ্যাপের Support পৃষ্ঠা ব্যবহার করুন। সেখানে বর্তমানে চালু যোগাযোগ মাধ্যম নির্বাচন করে আবেদন নম্বর, সমস্যার বিবরণ এবং প্রাসঙ্গিক প্রমাণ দিন।</p>
                  <p>২. অভিযোগ জমা দেওয়া ঋণ অনুমোদন, অর্থ বিতরণ বা স্বয়ংক্রিয় ফেরতের নিশ্চয়তা নয়। অভিযোগ যাচাই করে প্রযোজ্য নীতিমালা অনুযায়ী উত্তর দেওয়া হবে।</p>
                  <p>৩. Support পৃষ্ঠায় কোনো যোগাযোগ মাধ্যম “সেট করা নেই” দেখালে সেই মাধ্যম বর্তমানে সক্রিয় নয়। স্বতন্ত্র অভিযোগ-টিকিট ও ট্র্যাকিং ব্যবস্থা এখনও নিশ্চিত নয়; প্রশাসনকে একটি কার্যকর যোগাযোগ মাধ্যম সক্রিয় করতে হবে।</p>
                  <button type="button" onClick={() => navigate('/support')} className="mt-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-black text-white">সহায়তা পৃষ্ঠায় যান</button>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed font-bold">
                  <p>1. To request reconsideration of a rejected application, an incorrect information flag, a payment/deposit discrepancy or another application-related decision, use the Support page in the app. Select a currently enabled contact channel and provide the application reference, issue description and relevant evidence.</p>
                  <p>2. Filing a complaint does not guarantee loan approval, disbursement or an automatic refund. The complaint will be reviewed and answered under the applicable policy.</p>
                  <p>3. If a Support contact channel is marked “Not configured,” it is not active. A dedicated complaint ticket and tracking system is not currently confirmed; the administrator must configure a working contact channel.</p>
                  <button type="button" onClick={() => navigate('/support')} className="mt-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-black text-white">Open Support</button>
                </div>
              )}
            </section>
          )}

          {/* Section 12: FAQ */}
          {(activeSection === 'all' || activeSection === 'faq') && (
            <section className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm rounded-[24px] p-5 space-y-4 border-0 transition-colors">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-3 flex items-center gap-2">
                <HelpCircle className="text-primary-500" size={20} />
                {isBn ? '১২. সাধারণ জিজ্ঞাসা (FAQ)' : '12. FAQ'}
              </h2>
              <div className="space-y-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                <div>
                  <h4 className="font-extrabold text-gray-900 dark:text-white mb-1">
                    {isBn ? 'প্রশ্নঃ প্রসেসিং ফি ফেরত ও সঞ্চয় আমানতের নিয়ম কী?' : 'Q: What are the processing-fee refund and savings-deposit rules?'}
                  </h4>
                  <p className="leading-relaxed">
                    {isBn
                      ? 'উত্তরঃ ফি ও ডিপোজিটের হার অ্যাডমিনের অনুমোদিত সিস্টেম সেটিংস অনুযায়ী নির্ধারিত হবে; পেমেন্টের আগে আবেদনপত্রে প্রদর্শিত অঙ্ক যাচাই করুন। আবেদন প্রত্যাখ্যাত বা বাতিল হলে প্রসেসিং ফি ফেরতযোগ্য। সঞ্চয়/সিকিউরিটি ডিপোজিট লক থাকবে এবং সব কিস্তি ও প্রযোজ্য বকেয়া পরিশোধের পর হিসাব যাচাই করে মুক্তির যোগ্যতা নির্ধারণ হবে। ফেরত বা মুক্তির অনুরোধ অ্যাপের Support পৃষ্ঠা দিয়ে জানাতে হবে.'
                      : 'Fee and deposit rates follow the administrator\'s approved settings; check the displayed amount before payment. The processing fee is refundable if the application is rejected or cancelled. The savings/security deposit remains locked and release eligibility is reviewed after all instalments and applicable dues are paid. Use the in-app Support page to request a refund or release review.'}
                  </p>
                </div>
                
                <div className="border-t border-gray-150 dark:border-gray-850 pt-3">
                  <h4 className="font-extrabold text-gray-900 dark:text-white mb-1">
                    {isBn ? 'প্রশ্নঃ ডিপোজিট করার পর লোন রিভিউ হতে কত সময় লাগে?' : 'Q: How long does the review take after deposits are made?'}
                  </h4>
                  <p className="leading-relaxed">
                    {isBn 
                      ? 'উত্তরঃ প্রয়োজনীয় তথ্য ও নথি জমা এবং প্রযোজ্য পেমেন্ট যাচাইয়ের পর প্রাথমিক পর্যালোচনার লক্ষ্যমাত্রা সাধারণত ১২–৪৮ ঘণ্টা। এটি অনুমোদনের নিশ্চয়তা নয়; অসম্পূর্ণ নথি, সংশোধন বা অতিরিক্ত যাচাইয়ের কারণে সময় বাড়তে পারে। আবেদনটির স্ট্যাটাস অ্যাপে দেখুন.'
                      : 'A: After required information and documents are submitted and applicable payments are verified, the target for initial review is generally 12–48 hours. This is not a guarantee of approval; incomplete documents, revisions or extra checks may extend the timeline. Check the application status in the app.'}
                  </p>
                </div>

                <div className="border-t border-gray-150 dark:border-gray-800 pt-3">
                  <h4 className="font-extrabold text-gray-900 dark:text-white mb-1">
                    {isBn ? 'প্রশ্নঃ আমার আবেদন রিভিশন (Revision Required) চাওয়া হয়েছে কেন?' : 'Q: Why has my application been marked as Revision Required?'}
                  </h4>
                  <p className="leading-relaxed">
                    {isBn 
                      ? 'উত্তরঃ আপনার আপলোডকৃত NID অস্পষ্ট হলে, সেলফি ভেরিফিকেশন না মিললে বা কোনো তথ্যে অমিল থাকলে এডমিন রিভিশন নোট পাঠায়। নোটে দেওয়া মন্তব্য অনুযায়ী তথ্য আপডেট করলেই ফাইল পুনরায় রিভিউর জন্য সাবমিট হয়ে যাবে।' 
                      : 'A: An application is placed under revision if NID uploads are blurry, selfie verification fails, or field mismatches occur. Correcting the values matching the admin\'s notes will submit the file back for review.'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
