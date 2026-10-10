import { createPortal } from 'react-dom';
import {
  ArrowDownToLine, Banknote, CircleDollarSign, LockKeyhole,
  Wallet, X, ShieldCheck, TrendingDown, Activity,
} from 'lucide-react';
import { formatCurrency } from '../../lib/translation';
import type { DashboardStats } from '../../lib/api';

type Props = {
  isBn: boolean;
  stats: DashboardStats | null;
  balanceVisible: boolean;
  onClose: () => void;
};

export function BalanceDetailsModal({ isBn, stats, balanceVisible, onClose }: Props) {
  const currentBalance = Number(stats?.totalBalance || 0);
  const details = [
    {
      label: isBn ? 'মোট অনুমোদিত লোন' : 'Approved loans',
      value: Number(stats?.approvedLoanTotal || 0),
      note: isBn ? 'অনুমোদিত, চলমান ও সম্পন্ন লোনের মোট' : 'Approved, active and completed loans',
      icon: Banknote,
      tone: 'blue',
    },
    {
      label: isBn ? 'লোনের বকেয়া' : 'Loan outstanding',
      value: Number(stats?.loanOutstanding ?? stats?.totalOutstanding ?? 0),
      note: isBn ? 'কিস্তির সময়সূচি ও জমা পেমেন্ট অনুযায়ী' : 'From installment schedules and recorded payments',
      icon: TrendingDown,
      tone: 'amber',
    },
    {
      label: isBn ? 'মোট জমা' : 'Total deposits',
      value: Number(stats?.depositBalance || 0),
      note: isBn ? 'সম্পন্ন জমা লেনদেন' : 'Completed deposit transactions',
      icon: ArrowDownToLine,
      tone: 'cyan',
    },
    {
      label: isBn ? 'সিকিউরিটি মানি' : 'Security deposit',
      value: Number(stats?.securityDepositTotal ?? stats?.savingsBalance ?? 0),
      note: isBn ? 'সম্পন্ন সিকিউরিটি ডিপোজিট' : 'Completed security-deposit payments',
      icon: LockKeyhole,
      tone: 'violet',
    },
    {
      label: isBn ? 'প্রসেসিং ফি' : 'Processing fees',
      value: Number(stats?.processingFeeTotal || 0),
      note: isBn ? 'সম্পন্ন ফি পেমেন্ট' : 'Completed fee payments',
      icon: CircleDollarSign,
      tone: 'emerald',
    },
  ];

  const amount = (value: number) =>
    balanceVisible ? formatCurrency(value, isBn) : '৳ • • • • •';

  return createPortal(
    <div className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-[#07111f] text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="pointer-events-none absolute -right-28 top-12 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 top-[42%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#091629]/90 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-950/40">
            <Wallet size={22} className="text-white"/>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-300">PROVATI • {isBn ? 'আমার হিসাব' : 'MY ACCOUNT'}</p>
            <h2 className="mt-0.5 truncate text-lg font-black tracking-tight text-white">{isBn ? 'ব্যালেন্সের বিস্তারিত' : 'Balance overview'}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={isBn ? 'বন্ধ করুন' : 'Close'} className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 active:scale-95">
          <X size={21}/>
        </button>
      </header>

      <main className="relative z-10 h-[calc(100dvh-76px-env(safe-area-inset-top))] overflow-y-auto overscroll-contain px-4 pb-7 pt-5 sm:px-6" style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
        <section className="relative isolate overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-[#2355e8] via-[#1745b8] to-[#087f9b] p-5 shadow-[0_18px_48px_rgba(16,72,185,.25)] sm:p-7">
          <div className="pointer-events-none absolute -right-8 -top-14 h-48 w-48 rounded-full border-[28px] border-white/[0.07]"/>
          <div className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-cyan-300/10 blur-2xl"/>
          <div className="relative flex items-center gap-2 text-sm font-bold text-blue-50/90">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15"><Wallet size={17}/></span>
            {isBn ? 'বর্তমান ব্যালেন্স' : 'Current balance'}
          </div>
          <p className="relative mt-5 break-words text-[clamp(2rem,8vw,3.1rem)] font-black leading-none tracking-tight text-white tabular-nums">{amount(currentBalance)}</p>
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#062d74]/25 px-3 py-1.5 text-[11px] font-bold text-white/95">
              <Activity size={13}/> {isBn ? 'হিসাবের সারসংক্ষেপ' : 'Account summary'}
            </span>
            <span className="text-[11px] font-medium text-white/75">
              {isBn ? `চলমান লোন: ${stats?.activeLoansCount ?? 0}টি` : `Active loans: ${stats?.activeLoansCount ?? 0}`}
            </span>
          </div>
        </section>

        <div className="mb-3 mt-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-cyan-300">{isBn ? 'বিস্তারিত হিসাব' : 'BREAKDOWN'}</p>
            <h3 className="mt-1 text-base font-extrabold text-white">{isBn ? 'লোন ও জমার বিবরণ' : 'Loans & deposits'}</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300">{isBn ? '৫টি হিসাব' : '5 details'}</span>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {details.map(({ label, value, note, icon: Icon, tone }) => {
            const toneClasses: Record<string, string> = {
              blue: 'bg-blue-400/15 text-blue-200 ring-blue-300/15',
              amber: 'bg-amber-400/15 text-amber-200 ring-amber-300/15',
              cyan: 'bg-cyan-400/15 text-cyan-200 ring-cyan-300/15',
              violet: 'bg-violet-400/15 text-violet-200 ring-violet-300/15',
              emerald: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/15',
            };
            return (
              <article key={label} className="group rounded-[22px] border border-white/[0.09] bg-gradient-to-br from-[#12233b] to-[#0d1a2d] p-4 shadow-[0_10px_25px_rgba(0,0,0,.12)] transition-colors hover:border-white/15 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}>
                    <Icon size={19}/>
                  </span>
                  <p className="text-[12px] font-bold leading-snug text-slate-300">{label}</p>
                </div>
                <p className="mt-4 break-words text-[clamp(1.25rem,5vw,1.6rem)] font-black leading-tight tracking-tight text-white tabular-nums">{amount(value)}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{note}</p>
              </article>
            );
          })}
        </section>

        <aside className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><ShieldCheck size={17}/></span>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {isBn
              ? 'অনুমোদিত লোনের অঙ্ক আর বাস্তবে হাতে পাওয়া টাকা এক নাও হতে পারে। এখানে প্রতিটি হিসাব লেনদেন ও কিস্তির রেকর্ড অনুযায়ী দেখানো হয়।'
              : 'The approved loan amount may differ from money actually disbursed. Figures are calculated from recorded transactions and installment schedules.'}
          </p>
        </aside>
        <p className="px-1 pb-2 pt-5 text-center text-[10px] font-medium text-slate-500">PROVATI SOMOBAY SOMITI • {isBn ? 'সদস্য হিসাব' : 'MEMBER ACCOUNT'}</p>
      </main>
    </div>,
    document.body,
  );
}
