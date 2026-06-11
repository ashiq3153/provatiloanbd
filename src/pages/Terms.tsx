import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Landmark, FileText, CheckCircle2, AlertCircle, HelpCircle, UserCheck, ShieldAlert, BadgeAlert } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function Terms() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(language === 'bn' ? 'bn' : 'en');
  const [activeSection, setActiveSection] = useState<string>('all');

  const isBn = currentLang === 'bn';

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
    { id: 'faq', titleBn: '১১. সাধারণ জিজ্ঞাসা (FAQ)', titleEn: '11. FAQ', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors pb-10 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? 'নীতিমালা ও শর্তাবলী' : 'Policies & Terms'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Provati Somobay Somiti
            </p>
          </div>
        </div>
        
        {/* Language Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setCurrentLang('bn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${currentLang === 'bn' ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setCurrentLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${currentLang === 'en' ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6 relative">
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 h-max space-y-2 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
          <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 px-3 tracking-widest mb-3">
            {isBn ? 'সূচিপত্র' : 'Table of Contents'}
          </p>
          <button
            onClick={() => setActiveSection('all')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSection === 'all' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
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
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isSel ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <Icon size={14} className={isSel ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
                <span>{isBn ? s.titleBn : s.titleEn}</span>
              </button>
            );
          })}
        </aside>

        {/* Policies Content */}
        <div className="flex-1 space-y-6">
          {/* Section 1: Terms & Conditions */}
          {(activeSection === 'all' || activeSection === 'terms') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <FileText className="text-primary-500" size={20} />
                {isBn ? '১. নিয়ম ও শর্তাবলী' : '1. Terms & Conditions'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>ক. <b>প্রভাতি সমবায় সমিতি</b> অ্যাপ্লিকেশনের মাধ্যমে ঋণ আবেদনের ক্ষেত্রে আবেদনকারীকে অবশ্যই সমিতির একজন বৈধ সদস্য হতে হবে এবং তার সমস্ত তথ্য সঠিক হতে হবে।</p>
                  <p>খ. কর্তৃপক্ষের সিদ্ধান্ত লোন অনুমোদন, পুনর্নিরীক্ষণ (Revision), অথবা বাতিলের ক্ষেত্রে চূড়ান্ত বলে গণ্য হবে এবং আবেদনকারী তা মেনে নিতে বাধ্য থাকবেন।</p>
                  <p>গ. ভুল তথ্য প্রদান বা জাল প্রমাণপত্র আপলোড করা হলে সমিতি কর্তৃপক্ষ কোনো নোটিশ ছাড়াই ব্যবহারকারীর অ্যাকাউন্ট সাময়িকভাবে বা চিরতরে স্থগিত (Suspended/Banned) করার অধিকার সংরক্ষণ করে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>a. To apply for a loan through <b>Provati Somobay Somiti</b>, the applicant must be a registered member, and all provided details must be accurate.</p>
                  <p>b. The authority\'s decisions regarding loan approval, rejection, or revision requests are final and binding on all applicants.</p>
                  <p>c. Submission of fraudulent data or forged documents will lead to instant suspension/ban of the user account without prior notice.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 2: Loan Guidelines */}
          {(activeSection === 'all' || activeSection === 'guidelines') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="text-primary-500" size={20} />
                {isBn ? '২. ঋণ নির্দেশিকা' : '2. Loan Guidelines'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                  <p>ঋণ পাওয়ার জন্য আবেদনকারীকে তার পেশা অনুযায়ী সঠিক ক্যাটাগরি নির্বাচন করতে হবে। প্রতিটি ক্যাটাগরির জন্য ঋণের সর্বোচ্চ সীমা এবং মাসিক সুদের হার আলাদা হতে পারে:</p>
                  <ul className="list-disc pl-5 space-y-1.5 font-medium">
                    <li><b>ব্যক্তিগত লোন (Personal):</b> চাকুরিজীবীদের জন্য সর্বোচ্চ ৫,০০,০০০ টাকা পর্যন্ত ঋণ। মাসিক সুদ ১.২%।</li>
                    <li><b>ব্যবসায়িক লোন (Business):</b> ব্যবসায়ীদের জন্য সর্বোচ্চ ৫০,০০,০০০ টাকা পর্যন্ত ঋণ। মাসিক সুদ ১.৫%।</li>
                    <li><b>প্রবাসী লোন (Probashi):</b> রেমিট্যান্স যোদ্ধাদের জন্য সর্বোচ্চ ১০,০০,০০০ টাকা পর্যন্ত ঋণ। মাসিক সুদ ১.০%।</li>
                    <li><b>শিক্ষা লোন (Student):</b> শিক্ষার্থীদের জন্য সর্বোচ্চ ৫,০০,০০০ টাকা পর্যন্ত ঋণ। মাসিক সুদ ০.৮%।</li>
                    <li><b>জরুরি লোন (Emergency):</b> তাৎক্ষণিক প্রয়োজনের জন্য সর্বোচ্চ ১,০০,০০০ টাকা পর্যন্ত ঋণ। মাসিক সুদ ২.০%।</li>
                    <li><b>মহিলা উদ্যোক্তা লোন (Women):</b> নারী উদ্যোক্তাদের জন্য সর্বোচ্চ ২০,০০,০০০ টাকা পর্যন্ত ঋণ। মাসিক সুদ ০.৮%।</li>
                  </ul>
                  <p>ঋণের মাসিক কিস্তি (EMI) লোন ক্যালকুলেটরের মাধ্যমে স্বয়ংক্রিয়ভাবে হিসাব করা হয়। সময়কাল ৬ থেকে ১২০ মাসের মধ্যে স্ন্যাপ পয়েন্ট অনুযায়ী নির্বাচন করা যাবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                  <p>Applicants must select the appropriate category matching their profession. Loan limits and interest rates are defined as follows:</p>
                  <ul className="list-disc pl-5 space-y-1.5 font-medium">
                    <li><b>Personal Loan:</b> For salaried employees up to BDT 500,000. Monthly rate 1.2%.</li>
                    <li><b>Business Loan:</b> For entrepreneurs up to BDT 5,000,000. Monthly rate 1.5%.</li>
                    <li><b>Probashi Loan:</b> For overseas workers up to BDT 1,000,000. Monthly rate 1.0%.</li>
                    <li><b>Student Loan:</b> For students up to BDT 500,000. Monthly rate 0.8%.</li>
                    <li><b>Emergency Loan:</b> For urgent situations up to BDT 100,000. Monthly rate 2.0%.</li>
                    <li><b>Women Entrepreneur Loan:</b> For female entrepreneurs up to BDT 2,000,000. Monthly rate 0.8%.</li>
                  </ul>
                  <p>Equated Monthly Installments (EMI) are auto-calculated. Repayment periods are snappable between 6 and 120 months depending on category limits.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 3: Important Notices */}
          {(activeSection === 'all' || activeSection === 'notices') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <BadgeAlert className="text-amber-500" size={20} />
                {isBn ? '৩. গুরুত্বপূর্ণ নোটিশ' : '3. Important Notices'}
              </h2>
              {isBn ? (
                <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 leading-relaxed space-y-2">
                  <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> প্রসেসিং ফি বাধ্যতামুলক:</p>
                  <p>ঋণ আবেদন প্রসেস করার জন্য নির্ধারিত "প্রসেসিং ফি" ডিপোজিট করা বাধ্যতামূলক। ফি প্রদান ছাড়া কোনো আবেদন রিভিউর আওতায় নেওয়া হবে না এবং এটি সম্পূর্ণ অফেরতযোগ্য।</p>
                  <p className="font-bold mt-3">অ্যাডমিন রিভিউ এবং চ্যাট:</p>
                  <p>যাচাইকরণের সময় কোনো তথ্যে ঘাটতি থাকলে অ্যাডমিন থেকে সংশোধন (Revision) নোট পাঠানো হতে পারে, যা আপনার টেলিগ্রামে নোটিফিকেশনের মাধ্যমে জানানো হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 leading-relaxed space-y-2">
                  <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Processing Fee is Mandatory:</p>
                  <p>To begin evaluating your loan profile, the processing fee must be deposited. Unpaid files will not be reviewed. Processing fees are non-refundable.</p>
                  <p className="font-bold mt-3">Admin Reviews & Revisions:</p>
                  <p>If any details require updates, revision notes will be sent to the user, triggering immediate Telegram messages for correction.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 4: User Responsibilities */}
          {(activeSection === 'all' || activeSection === 'responsibilities') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <UserCheck className="text-primary-500" size={20} />
                {isBn ? '৪. ব্যবহারকারীর দায়িত্ব' : '4. User Responsibilities'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>১. ব্যবহারকারীকে অবশ্যই তার নিজস্ব সচল মোবাইল ব্যাংকিং নম্বর অথবা ব্যাংক অ্যাকাউন্ট ব্যবহার করতে হবে।</p>
                  <p>২. লোন আবেদনের সময় আপলোডকৃত ডকুমেন্টস (যেমন: এনআইডি, সেলফি ও আয়ের প্রমাণপত্র) পরিষ্কার এবং স্পষ্ট হতে হবে।</p>
                  <p>৩. ঋণের কিস্তি (EMI) প্রতি মাসের নির্ধারিত তারিখের মধ্যে পেমেন্ট গেটওয়ের মাধ্যমে পরিশোধ করা ব্যবহারকারীর ব্যক্তিগত দায়িত্ব।</p>
                  <p>৪. অন্য কোনো ব্যক্তির হয়ে ঋণ আবেদন করা অথবা ডুপ্লিকেট অ্যাকাউন্ট পরিচালনা করা আইনত দণ্ডনীয় এবং এর ফলে অ্যাকাউন্ট বাতিল হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
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
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <Landmark className="text-primary-500" size={20} />
                {isBn ? '৫. সঞ্চয় ও ডিপোজিট নীতিমালা' : '5. Savings & Deposit Policies'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                  <p>লোন প্রসেস ও বিতরণের স্বার্থে দুই ধরনের ডিপোজিট প্রযোজ্য হয়ে থাকে:</p>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900 dark:text-white">• প্রসেসিং ফি (Processing Fee):</p>
                    <p className="pl-4">লোনের পরিমাণ ৫০,০০০ থেকে ১০,০০,০০০ টাকা পর্যন্ত হলে <b>১% প্রসেসিং ফি</b> এবং ১০,০০,০০০ টাকার ওপরে হলে <b>০.৫% প্রসেসিং ফি</b> প্রযোজ্য। এটি ফাইল প্রসেসিংয়ের জন্য অফেরতযোগ্য ফি।</p>
                    
                    <p className="font-bold text-gray-900 dark:text-white">• সঞ্চয় আমানত (Savings Deposit / Security Deposit):</p>
                    <p className="pl-4">সমিতি সদস্যদের নিরাপত্তা ও আমানত সুরক্ষার্থে ৫০,০০০ থেকে ৫,০০,০০০ টাকা ঋণের জন্য <b>১০% সঞ্চয়</b> এবং ৫,০০,০০০ টাকার ওপরে হলে <b>৫% সঞ্চয়</b> ডিপোজিট করা বাধ্যতামূলক। এই সঞ্চয় ব্যালেন্স আপনার একাউন্টে জমা থাকবে এবং লোন বিতরণের পরেও এটি আপনার একাউন্টেই দৃশ্যমান থাকবে।</p>
                  </div>
                  <p className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-[11px] font-bold">
                    *বিশেষ সতর্কবার্তা: যেকোনো ভুয়া ট্রানজেকশন আইডি (DEP-xxxxx) অথবা অন্যের স্ক্রিনশট পেমেন্ট প্রুফ হিসেবে সাবমিট করলে সম্পূর্ণ ঋণ বাতিলসহ সদস্যপদ স্থায়ীভাবে স্থগিত করা হবে।
                  </p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                  <p>Two types of deposits apply under the microfinance structure:</p>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900 dark:text-white">• Processing Fee:</p>
                    <p className="pl-4">For loan amounts between BDT 50,000 to BDT 1,000,000, a <b>1% processing fee</b> is charged. For loans above BDT 1,000,000, the fee is <b>0.5%</b>. This fee is non-refundable.</p>
                    
                    <p className="font-bold text-gray-900 dark:text-white">• Savings Deposit:</p>
                    <p className="pl-4">To support cooperative savings, BDT 50,000 to BDT 500,000 loans require a <b>10% savings deposit</b>. Loans above BDT 500,000 require a <b>5% savings deposit</b>. This deposit remains locked in your account and is fully visible even after loan disbursement.</p>
                  </div>
                  <p className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-[11px] font-bold">
                    *Fraud Notice: Submitting fake screenshot proofs or forged Transaction IDs (DEP-xxxxx) will lead to immediate cancellation of the application and a permanent account ban.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Section 6: Loan Approval Conditions */}
          {(activeSection === 'all' || activeSection === 'approval_cond') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <CheckCircle2 className="text-primary-500" size={20} />
                {isBn ? '৬. ঋণ অনুমোদন শর্তাবলী' : '6. Loan Approval Conditions'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>ঋণ আবেদনের চূড়ান্ত অনুমোদনের জন্য নিম্নোক্ত শর্তগুলো পূরণ হতে হবে:</p>
                  <p>১. ব্যবহারকারীর প্রোফাইল তথ্য সম্পূর্ণ হতে হবে এবং কোনো ডুপ্লিকেট বা ভুয়া আবেদন সনাক্ত হওয়া যাবে না।</p>
                  <p>২. এনআইডি কার্ডের সামনের ও পেছনের স্পষ্ট ছবি এবং আবেদনকারীর স্পষ্ট লাইভ সেলফি আপলোড হতে হবে।</p>
                  <p>৩. প্রসেসিং ফি এবং সঞ্চয় আমানত ডিপোজিটের প্রমাণপত্র সঠিক হতে হবে এবং এডমিন প্যানেল কর্তৃক তা ভেরিফাইড (Completed) হতে হবে।</p>
                  <p>৪. পূর্বে কোনো অনাদায়ী বা ওভারডিউ লোন থাকা যাবে না।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
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
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <Landmark className="text-primary-500" size={20} />
                {isBn ? '৭. লোন উত্তোলন শর্তাবলী' : '7. Withdrawal Conditions'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>ক. লোন চূড়ান্তভাবে অনুমোদিত হওয়ার পর অনুমোদিত ঋণের টাকা ব্যবহারকারীর "মোট ব্যালেন্স" (Total Balance) এ যোগ হবে।</p>
                  <p>খ. আবেদন করার পূর্বে মোট ব্যালেন্স ০ থাকবে। লোন অনুমোদনের পরেই কেবল ব্যবহারকারী উক্ত টাকা উত্তোলনের জন্য রিকোয়েস্ট পাঠাতে পারবেন।</p>
                  <p>গ. ব্যবহারকারী যখন টাকা উত্তোলন করবেন, তখন তার মোট ব্যালেন্স থেকে সমপরিমাণ অর্থ কেটে নেওয়া হবে।</p>
                  <p>ঘ. সঞ্চয় ব্যালেন্স সম্পূর্ণ পৃথক এবং এটি লোন উত্তোলনের পরেও আপনার একাউন্টে দৃশ্যমান ও সংরক্ষিত থাকবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>a. Upon approval, the approved loan amount is credited directly to the user\'s "Total Balance".</p>
                  <p>b. Before loan approval, the Total Balance displays BDT 0. Withdrawal requests can only be placed after the status updates to Approved.</p>
                  <p>c. When a member withdraws the loan, the available Total Balance is reduced accordingly.</p>
                  <p>d. The Savings Balance is stored separately and remains fully visible and protected after loan withdrawal.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 8: Verification Rules */}
          {(activeSection === 'all' || activeSection === 'verification_rules') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="text-primary-500" size={20} />
                {isBn ? '৮. যাচাইকরণ নিয়মাবলী' : '8. Verification Rules'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>১. <b>পরিচয়পত্র যাচাইকরণ:</b> আবেদনকারীকে অবশ্যই জাতীয় পরিচয়পত্রের (NID) সামনের এবং পেছনের মূল অংশ ক্যামেরার মাধ্যমে পরিষ্কারভাবে তুলে আপলোড করতে হবে। স্ক্যান কপি বা অস্পষ্ট ছবি বাতিল করা হবে।</p>
                  <p>২. <b>জীবন্ততা পরীক্ষা (Selfie Verification):</b> আবেদনকারীর সেলফি ছবি আপলোড করতে হবে, যেখানে তার মুখমণ্ডল স্পষ্ট দেখা যায়। পরিচয় জালিয়াতি রোধে এটি বাধ্যতামূলক।</p>
                  <p>৩. <b>পেশাগত প্রমাণপত্র:</b> ক্যাটাগরি অনুযায়ী অফিস আইডি কার্ড, ট্রেড লাইসেন্স, পাসপোর্ট কপি বা স্টুডেন্ট আইডি কার্ড সঠিক ফরম্যাটে (PDF/Image) আপলোড করতে হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>1. <b>Identity Checks:</b> High-quality photographs of the original NID card front and back must be uploaded. Scans or blurred photographs will be rejected.</p>
                  <p>2. <b>Selfie Verification:</b> Clear selfie photographs are required to verify the applicant's identity and prevent impersonation.</p>
                  <p>3. <b>Professional Proofs:</b> Depending on the category, office ID card, trade license, passport visa copy, or student ID card must be uploaded in image/PDF format.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 9: Privacy Policy */}
          {(activeSection === 'all' || activeSection === 'privacy') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <ShieldAlert className="text-primary-500" size={20} />
                {isBn ? '৯. গোপনীয়তা নীতি' : '9. Privacy Policy'}
              </h2>
              {isBn ? (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>ক. আপনার ব্যক্তিগত তথ্য (নাম, পিতার নাম, মাতার নাম, এনআইডি নম্বর, মোবাইল ব্যাংকিং তথ্য, এবং আয়ের উৎস) অত্যন্ত নিরাপদে রাখা হয় এবং তৃতীয় কোনো পক্ষের সাথে তা শেয়ার করা হয় না।</p>
                  <p>খ. ঋণ আবেদনের প্রতিটি ধাপের রিয়েল-টাইম আপডেট প্রদান করতে আমরা আবেদনকারীর টেলিগ্রাম চ্যাট আইডি (Telegram Chat ID) ব্যবহার করি।</p>
                  <p>গ. আপনার সমস্ত ফাইল ও আপলোডকৃত ছবি Supabase সিকিউর স্টোরেজে এনক্রিপ্ট করে সংরক্ষণ করা হয় এবং তা কেবল সমিতির অনুমোদিত কর্মকর্তাদের রিভিউ করার অ্যাক্সেস থাকে।</p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <p>a. Your personal details (names, NID numbers, mobile banking info, and salary proofs) are encrypted and stored safely, never shared with third parties.</p>
                  <p>b. We collect the user\'s Telegram Chat ID to send automatic real-time transaction and loan application updates.</p>
                  <p>c. Uploaded documentation is stored securely in Supabase buckets, accessible only by verified auditing officers.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 10: Warnings & Risk Notices */}
          {(activeSection === 'all' || activeSection === 'warnings') && (
            <section className="bg-white dark:bg-rose-950/10 rounded-[28px] p-6 border border-rose-100 dark:border-rose-900/30 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-rose-600 dark:text-rose-400 border-b border-rose-150 dark:border-rose-900 pb-3 flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={20} />
                {isBn ? '১০. সতর্কবার্তা ও ঝুঁকি নোটিশ' : '10. Warnings & Risk Notices'}
              </h2>
              {isBn ? (
                <div className="text-xs text-rose-800 dark:text-rose-300 space-y-2.5 leading-relaxed">
                  <p>• <b>ঋণ খেলাপি সতর্কতা (Default Warning):</b> সময়মতো মাসিক কিস্তি পরিশোধে ব্যর্থ হলে আপনার অ্যাকাউন্টটি লাল তালিকাভুক্ত (Overdue status) হবে, যা পরবর্তীতে নতুন কোনো লোন পাওয়ার যোগ্যতাকে চিরতরে বাতিল করতে পারে।</p>
                  <p>• <b>জালিয়াতি দমন (Anti-Fraud Policy):</b> যদি কোনো আবেদনকারীর মোবাইল নাম্বার, ব্যাংক একাউন্ট বা এনআইডি জালিয়াতি বা অন্যের তথ্য ব্যবহারের মাধ্যমে সনাক্ত হয়, তবে "Fake Apply Detected" অ্যালার্ম ট্রিগার হবে এবং অ্যাকাউন্ট সাথে সাথে সাসপেন্ড করা হবে।</p>
                  <p>• <b>সমবায় নীতিমালা:</b> প্রভাতি সমবায় সমিতির আইন অনুযায়ী সমিতির সিদ্ধান্তই ঋণের আবেদন নিষ্পত্তি করার জন্য চূড়ান্ত কর্তৃপক্ষ হিসেবে গণ্য হবে।</p>
                </div>
              ) : (
                <div className="text-xs text-rose-800 dark:text-rose-300 space-y-2.5 leading-relaxed">
                  <p>• <b>Payment Default:</b> Failure to repay monthly EMIs will lead to loan classification (Overdue) and may permanently affect credit eligibility for future cooperative loans.</p>
                  <p>• <b>Anti-Fraud Trigger:</b> Attempting to apply with duplicate phone numbers, nominee NIDs, bank routing credentials, or fake transaction numbers triggers a "Fake Apply Detected" flag and results in permanent suspension.</p>
                  <p>• <b>Cooperative Rules:</b> In accordance with the Provati Somobay Somiti bylaws, the administration\'s audits and files disposition are final.</p>
                </div>
              )}
            </section>
          )}

          {/* Section 11: FAQ */}
          {(activeSection === 'all' || activeSection === 'faq') && (
            <section className="bg-white dark:bg-gray-900 rounded-[28px] p-6 border border-gray-100 dark:border-gray-850 shadow-sm transition-colors space-y-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <HelpCircle className="text-primary-500" size={20} />
                {isBn ? '১১. সাধারণ জিজ্ঞাসা (FAQ)' : '11. FAQ'}
              </h2>
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    {isBn ? 'প্রশ্নঃ প্রসেসিং ফি এবং সঞ্চয় আমানত কত শতাংশ?' : 'Q: What percentage is the processing fee and savings deposit?'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {isBn 
                      ? 'উত্তরঃ প্রসেসিং ফি ১% (১০ লাখ টাকার উপরে ০.৫%) যা অফেরতযোগ্য। সঞ্চয় আমানত ১০% (৫ লাখ টাকার উপরে ৫%) যা আপনার অ্যাকাউন্টে জমা থাকে এবং উত্তোলনের পরও সুরক্ষিত থাকে।' 
                      : 'A: Processing fee is 1% (0.5% above 1M BDT) and is non-refundable. Savings deposit is 10% (5% above 500k BDT) which remains locked and fully visible in your savings balance.'}
                  </p>
                </div>
                
                <div className="border-t border-gray-50 dark:border-gray-800 pt-3">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    {isBn ? 'প্রশ্নঃ ডিপোজিট করার পর লোন রিভিউ হতে কত সময় লাগে?' : 'Q: How long does the review take after deposits are made?'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {isBn 
                      ? 'উত্তরঃ প্রসেসিং ফি এবং সঞ্চয় আমানত এর স্ক্রিনশট ও নাম্বার সহ ডিপোজিট সাবমিট করার পর এডমিন ভেরিফাই সম্পন্ন করলেই লোন আবেদনটি স্বয়ংক্রিয়ভাবে "Under Review" স্ট্যাটাসে চলে যায়। সাধারণত ১২ থেকে ৪৮ ঘণ্টার মধ্যে ঋণ ফাইলটি অনুমোদন বা সিদ্ধান্ত লাভ করে।' 
                      : 'A: Once both processing fee and savings deposits are submitted and verified by the admin, the application automatically moves to "Under Review". Audit decisions are finalized within 12 to 48 hours.'}
                  </p>
                </div>

                <div className="border-t border-gray-50 dark:border-gray-800 pt-3">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    {isBn ? 'প্রশ্নঃ আমার আবেদন রিভিশন (Revision Required) চাওয়া হয়েছে কেন?' : 'Q: Why has my application been marked as Revision Required?'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
