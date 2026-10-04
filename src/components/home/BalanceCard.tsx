import { Eye, EyeOff, ArrowUpRight, WalletCards, CircleDollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Skeleton } from '../Skeleton';
import { formatCurrency } from '../../lib/translation';

type BalanceCardProps = {
  isBn:boolean;
  balanceView:'savings'|'outstanding';
  setBalanceView:(v:'savings'|'outstanding')=>void;
  balanceVisible:boolean;
  setBalanceVisible:(v:boolean|((v:boolean)=>boolean))=>void;
  loading:boolean;
  stats:any;
  outstanding:number;
  userId:string|number;
};

export function BalanceCard({
  isBn,balanceView,setBalanceView,balanceVisible,setBalanceVisible,loading,stats,outstanding,userId
}:BalanceCardProps){
  const amount = balanceView==='savings'
    ? Number(stats?.savingsBalance||0)
    : Number(stats?.totalOutstanding||outstanding);

  return (
    <section className="pv-home-financial-hero home-financial-card home-balance-art">
      <div className="balance-art-grid" aria-hidden="true"/>
      <div className="balance-art-orb balance-art-orb-a" aria-hidden="true"/>
      <div className="balance-art-orb balance-art-orb-b" aria-hidden="true"/>
      <div className="balance-art-accent" aria-hidden="true"/>

      <div className="balance-card-top">
        <div className="balance-brand">
          <span className="balance-brand-dot"><WalletCards size={13}/></span>
          <span>PROVATI • {isBn?'আমার হিসাব':'MY ACCOUNT'}</span>
        </div>
        <button
          type="button"
          onClick={()=>setBalanceVisible(v=>!v)}
          className="balance-visibility"
          aria-label={balanceVisible ? (isBn?'ব্যালেন্স লুকান':'Hide balance') : (isBn?'ব্যালেন্স দেখান':'Show balance')}
        >
          {balanceVisible?<Eye size={18}/>:<EyeOff size={18}/>}
        </button>
      </div>

      <div className="balance-main">
        <div>
          <p className="balance-kicker">{balanceView==='savings' ? (isBn?'সঞ্চয় ব্যালেন্স':'Savings balance') : (isBn?'ঋণের বকেয়া':'Loan outstanding')}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={balanceView+'-'+balanceVisible}
              initial={{opacity:0,y:7}}
              animate={{opacity:1,y:0}}
              exit={{opacity:0,y:-5}}
              transition={{duration:.18}}
              className="balance-amount"
            >
              {loading ? <Skeleton className="h-10 w-36 bg-white/15"/> : balanceVisible ? formatCurrency(amount,isBn) : '৳ • • • • • •'}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="balance-side-stat">
          <CircleDollarSign size={18}/>
          <span>{isBn?'নিরাপদ হিসাব':'Secure account'}</span>
        </div>
      </div>

      <div className="balance-switch" role="tablist" aria-label={isBn?'হিসাব নির্বাচন':'Account view'}>
        <button
          type="button"
          role="tab"
          aria-selected={balanceView==='savings'}
          onClick={()=>setBalanceView('savings')}
          className={balanceView==='savings'?'is-active':''}
        >
          {isBn?'সঞ্চয়':'Savings'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={balanceView==='outstanding'}
          onClick={()=>setBalanceView('outstanding')}
          className={balanceView==='outstanding'?'is-active':''}
        >
          {isBn?'বকেয়া':'Outstanding'}
        </button>
      </div>

      <div className="balance-footer">
        <span>{isBn?'সদস্য আইডি':'Member ID'} <strong>PSS-{String(userId).padStart(6,'0').slice(-6)}</strong></span>
        <span className="balance-live"><i/> {isBn?'সক্রিয়':'Active'}</span>
      </div>
    </section>
  );
}
