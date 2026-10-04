import { Eye, EyeOff, WalletCards, ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Skeleton } from '../Skeleton';
import { formatCurrency } from '../../lib/translation';
import { Link } from 'react-router-dom';

type BalanceCardProps = { isBn:boolean; balanceView:'savings'|'outstanding'; setBalanceView:(v:'savings'|'outstanding')=>void; balanceVisible:boolean; setBalanceVisible:(v:boolean|((v:boolean)=>boolean))=>void; loading:boolean; stats:any; outstanding:number; userId:string|number; };

export function BalanceCard({isBn,balanceView,setBalanceView,balanceVisible,setBalanceVisible,loading,stats,outstanding,userId}:BalanceCardProps){
  const amount = balanceView==='savings' ? Number(stats?.savingsBalance||0) : Number(stats?.totalOutstanding||outstanding);
  return <section className="pv-home-financial-hero home-financial-card home-balance-art">
    <div className="balance-bank-accent" aria-hidden="true"/>
    <div className="balance-card-top">
      <div className="balance-brand"><span className="balance-brand-mark"><WalletCards size={17}/></span><span className="balance-brand-copy"><small>PROVATI FINANCE</small><strong>{isBn?'আমার হিসাব':'MY ACCOUNT'}</strong></span></div>
      <button type="button" onClick={()=>setBalanceVisible(v=>!v)} className="balance-visibility" aria-label={balanceVisible?(isBn?'ব্যালেন্স লুকান':'Hide balance'):(isBn?'ব্যালেন্স দেখান':'Show balance')}>{balanceVisible?<Eye size={16}/>:<EyeOff size={16}/>}<span>{balanceVisible?(isBn?'লুকান':'Hide'):(isBn?'দেখুন':'Show')}</span></button>
    </div>
    <div className="balance-main">
      <div className="balance-amount-block"><p className="balance-kicker">{balanceView==='savings'?(isBn?'সঞ্চয় ব্যালেন্স':'Savings balance'):(isBn?'ঋণের বকেয়া':'Loan outstanding')}</p><AnimatePresence mode="wait"><motion.p key={balanceView+'-'+balanceVisible} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-3}} transition={{duration:.14}} className="balance-amount">{loading?<Skeleton className="h-9 w-32 bg-white/10"/>:balanceVisible?formatCurrency(amount,isBn):'৳ • • • • • •'}</motion.p></AnimatePresence></div>
      <div className="balance-status-block"><span className="balance-status-dot"/><div><small>{isBn?'হিসাবের অবস্থা':'ACCOUNT STATUS'}</small><strong>{isBn?'সক্রিয়':'ACTIVE'}</strong></div></div>
    </div>
    <div className="balance-detail-row"><div><span>{isBn?'সদস্য আইডি':'Member ID'}</span><strong>PSS-{String(userId).padStart(6,'0').slice(-6)}</strong></div><Link to="/transactions" className="balance-history-link">{isBn?'লেনদেন দেখুন':'Transactions'} <ArrowUpRight size={13}/></Link></div>
    <div className="balance-switch" role="tablist" aria-label={isBn?'হিসাব নির্বাচন':'Account view'}><button type="button" role="tab" aria-selected={balanceView==='savings'} onClick={()=>setBalanceView('savings')} className={balanceView==='savings'?'is-active':''}>{isBn?'সঞ্চয়':'Savings'}</button><button type="button" role="tab" aria-selected={balanceView==='outstanding'} onClick={()=>setBalanceView('outstanding')} className={balanceView==='outstanding'?'is-active':''}>{isBn?'বকেয়া':'Outstanding'}</button></div>
  </section>;
}