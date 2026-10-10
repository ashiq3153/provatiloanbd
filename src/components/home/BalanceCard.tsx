import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Skeleton } from '../Skeleton';
import { formatCurrency } from '../../lib/translation';

type BalanceCardProps = {
  isBn: boolean;
  balanceVisible: boolean;
  setBalanceVisible: (v: boolean | ((v: boolean) => boolean)) => void;
  loading: boolean;
  stats: any;
  userId: string | number;
  onViewDetails: () => void;
};

export function BalanceCard({
  isBn, balanceVisible, setBalanceVisible, loading, stats, userId, onViewDetails,
}: BalanceCardProps) {
  const currentBalance = Number(stats?.totalBalance || 0);

  return (
    <section className="pv-home-financial-hero home-financial-card home-balance-art rounded-[24px] p-4 sm:p-5 text-white shadow-[0_14px_34px_rgba(39,52,195,.20)] overflow-hidden relative border border-white/20">
      <div className="home-balance-art-orb home-balance-art-orb-one"/>
      <div className="home-balance-art-orb home-balance-art-orb-two"/>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/75">PROVATI • {isBn ? 'আমার হিসাব' : 'My account'}</p>
          <p className="mt-2 text-xs font-bold text-white/85">{isBn ? 'বর্তমান ব্যালেন্স' : 'Current balance'}</p>
        </div>
        <button type="button" onClick={() => setBalanceVisible(v => !v)} aria-label={balanceVisible ? (isBn ? 'ব্যালেন্স লুকান' : 'Hide balance') : (isBn ? 'ব্যালেন্স দেখান' : 'Show balance')} className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white">
          {balanceVisible ? <Eye size={18}/> : <EyeOff size={18}/>}
        </button>
      </div>

      <div className="relative z-10 mt-1">
        <AnimatePresence mode="wait">
          <motion.p key={balanceVisible ? 'shown' : 'hidden'} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.2}} className="text-3xl sm:text-[38px] leading-none font-black tracking-tight text-white">
            {loading
              ? <Skeleton className="h-9 w-36 bg-white/20"/>
              : balanceVisible ? formatCurrency(currentBalance, isBn) : '৳ • • • • •'}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative z-10 mt-4 flex items-end justify-between gap-3">
        <p className="text-[10px] font-semibold text-white/75">{isBn ? 'সদস্য আইডি' : 'Member ID'}: PSS-{String(userId).padStart(6,'0').slice(-6)}</p>
        <button type="button" onClick={onViewDetails} className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 px-3 py-2 text-[10px] font-extrabold text-white shrink-0">
          {isBn ? 'বিস্তারিত দেখুন' : 'View details'} <ChevronRight size={14}/>
        </button>
      </div>
    </section>
  );
}
