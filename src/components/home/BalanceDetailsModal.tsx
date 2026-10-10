import { ArrowDownToLine, Banknote, CircleDollarSign, LockKeyhole, Wallet, X } from 'lucide-react';
import { formatCurrency } from '../../lib/translation';
import type { DashboardStats } from '../../lib/api';

type Props = {
  isBn: boolean;
  stats: DashboardStats | null;
  balanceVisible: boolean;
  onClose: () => void;
};

export function BalanceDetailsModal({ isBn, stats, balanceVisible, onClose }: Props) {
  const values = [
    {
      label: isBn ? 'বর্তমান ব্যালেন্স' : 'Current balance',
      value: Number(stats?.totalBalance || 0),
      note: isBn ? 'অনুমোদিত ঋণ থেকে সম্পন্ন/চলমান উত্তোলন বাদে' : 'Approved loan less completed/pending withdrawals',
      icon: Wallet,
    },
    {
      label: isBn ? 'মোট অনুমোদিত লোন' : 'Total approved loans',
      value: Number(stats?.approvedLoanTotal || 0),
      note: isBn ? 'অনুমোদিত, চলমান ও সম্পন্ন লোনের মোট' : 'Approved, active and completed loans',
      icon: Banknote,
    },
    {
      label: isBn ? 'লোনের বকেয়া' : 'Loan outstanding',
      value: Number(stats?.loanOutstanding ?? stats?.totalOutstanding ?? 0),
      note: isBn ? 'কিস্তির সময়সূচি ও জমা পেমেন্ট অনুযায়ী' : 'Based on EMI schedule and recorded payments',
      icon: CircleDollarSign,
    },
    {
      label: isBn ? 'মোট জমা' : 'Total deposits',
      value: Number(stats?.depositBalance || 0),
      note: isBn ? 'সম্পন্ন জমা লেনদেন' : 'Completed deposit transactions',
      icon: ArrowDownToLine,
    },
    {
      label: isBn ? 'সিকিউরিটি মানি' : 'Security deposit',
      value: Number(stats?.securityDepositTotal ?? stats?.savingsBalance ?? 0),
      note: isBn ? 'সম্পন্ন সিকিউরিটি ডিপোজিট' : 'Completed security-deposit payments',
      icon: LockKeyhole,
    },
    {
      label: isBn ? 'প্রসেসিং ফি' : 'Processing fees',
      value: Number(stats?.processingFeeTotal || 0),
      note: isBn ? 'সম্পন্ন ফি পেমেন্ট' : 'Completed fee payments',
      icon: CircleDollarSign,
    },
  ];

  const renderAmount = (amount: number) =>
    balanceVisible ? formatCurrency(amount, isBn) : '৳ • • • • •';

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={isBn ? 'ব্যালেন্সের বিস্তারিত' : 'Balance details'}
        className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xl border border-white/10 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] uppercase font-black tracking-[.16em] text-blue-600 dark:text-sky-300">PROVATI • {isBn ? 'আমার হিসাব' : 'MY ACCOUNT'}</p>
            <h2 className="text-xl font-black mt-1">{isBn ? 'ব্যালেন্সের বিস্তারিত' : 'Balance details'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isBn ? 'আপনার লোন ও জমার আলাদা হিসাব' : 'A breakdown of your loans and deposits'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={isBn ? 'বন্ধ করুন' : 'Close'} className="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X size={18}/></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {values.map(({ label, value, note, icon: Icon }, index) => (
            <article key={label} className={`rounded-2xl border p-4 ${index === 0 ? 'border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/35' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60'}`}>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Icon size={16}/>
                <p className="text-[11px] font-bold">{label}</p>
              </div>
              <p className="text-xl font-black mt-3 tabular-nums">{renderAmount(value)}</p>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 mt-1">{note}</p>
            </article>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 mt-4">
          {isBn
            ? 'অনুমোদিত লোনের অঙ্ক আর বাস্তবে হাতে পাওয়া টাকা এক নাও হতে পারে। এখানে প্রতিটি হিসাব লেনদেন ও কিস্তির রেকর্ড অনুযায়ী দেখানো হয়।'
            : 'The approved loan amount may differ from money actually disbursed. Figures are calculated from recorded transactions and installment schedules.'}
        </p>
      </section>
    </div>
  );
}
