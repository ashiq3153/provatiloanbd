import { ChevronRight, Sparkles, ArrowUpRight, ShieldCheck, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/translation';

export function LoanStatusCard({ activeLoan, latestApplication, isBn, outstanding, nextInstallment, nextEmiDate, categoryName, applicationStatus }: {
  activeLoan:any; latestApplication:any; isBn:boolean; outstanding:number; nextInstallment:any; nextEmiDate:string|null;
  categoryName:(c?:string)=>string; applicationStatus:(s?:string)=>{bn:string;en:string;tone:string};
}) {
  const tone=(s:string)=>s==='green'?'green':s==='amber'?'amber':s==='red'?'red':s==='sky'?'sky':'slate';

  if (!latestApplication && !activeLoan) {
    return (
      <section className="home-loan-status-card loan-status-empty">
        <div className="loan-status-glow" aria-hidden="true"/>
        <div className="loan-status-content">
          <div className="loan-status-icon"><Sparkles size={20}/></div>
          <div className="min-w-0 flex-1">
            <p className="loan-status-eyebrow">{isBn?'পরবর্তী গুরুত্বপূর্ণ কাজ':'NEXT IMPORTANT ACTION'}</p>
            <h2 className="loan-status-title">{isBn?'আপনার জন্য সঠিক লোন বেছে নিন':'Find the right loan for you'}</h2>
            <p className="loan-status-copy">{isBn?'আপনার প্রয়োজন ও সামর্থ্য অনুযায়ী লোন দেখে আবেদন শুরু করুন।':'Explore loan options that fit your needs and start your application in a few simple steps.'}</p>
            <div className="loan-status-pills">
              <span>{isBn?'৫০ হাজার+':'From ৳50K'}</span>
              <span>{isBn?'সহজ আবেদন':'Simple apply'}</span>
            </div>
          </div>
        </div>
        <Link to="/loans" className="loan-status-cta">
          <span>{isBn?'লোন দেখুন':'Explore loans'}</span>
          <ArrowUpRight size={17}/>
        </Link>
      </section>
    );
  }

  if (activeLoan) {
    return (
      <section className="home-loan-status-card loan-status-active">
        <div className="loan-status-row">
          <div className="loan-status-icon active"><ShieldCheck size={20}/></div>
          <div className="min-w-0 flex-1">
            <p className="loan-status-eyebrow">{isBn?'ঋণের অবস্থা':'LOAN STATUS'}</p>
            <h2 className="loan-status-title">{categoryName(activeLoan.loan_category)}</h2>
          </div>
          <span className="loan-status-badge green">{isBn?'চলমান':'ACTIVE'}</span>
        </div>
        <div className="loan-status-metrics">
          <div><span>{isBn?'বকেয়া':'Outstanding'}</span><strong>{formatCurrency(outstanding,isBn)}</strong></div>
          <div><span>{isBn?'পরবর্তী কিস্তি':'Next EMI'}</span><strong>{nextInstallment?formatCurrency(nextInstallment.total_due,isBn):'—'}</strong></div>
        </div>
        <div className="loan-status-footer">
          <span>{nextEmiDate ? <><CalendarDays size={13}/> {(isBn?'দেয় তারিখ: ':'Due: ')+nextEmiDate}</> : (isBn?'আপনার ঋণ হিসাব':'Your loan account')}</span>
          <Link to="/pay">{isBn?'কিস্তি দিন':'Pay EMI'} <ChevronRight size={14}/></Link>
        </div>
      </section>
    );
  }

  const s=applicationStatus(latestApplication.status);
  const toneClass=tone(s.tone);

  return (
    <section className="home-loan-status-card loan-status-active">
      <div className="loan-status-row">
        <div className="loan-status-icon"><ArrowUpRight size={20}/></div>
        <div className="min-w-0 flex-1">
          <p className="loan-status-eyebrow">{isBn?'আবেদনের অবস্থা':'APPLICATION STATUS'}</p>
          <h2 className="loan-status-title">{categoryName(latestApplication.loan_category)}</h2>
        </div>
        <span className={'loan-status-badge '+toneClass}>{isBn?s.bn:s.en}</span>
      </div>
      <div className="loan-status-metrics">
        <div><span>{isBn?'আবেদনের পরিমাণ':'Requested amount'}</span><strong>{formatCurrency(latestApplication.amount,isBn)}</strong></div>
        <div><span>{isBn?'আবেদনের তারিখ':'Applied on'}</span><strong>{new Date(latestApplication.applied_at).toLocaleDateString(isBn?'bn-BD':'en-GB',{day:'2-digit',month:'short'})}</strong></div>
      </div>
      {latestApplication.admin_feedback && (
        <div className="loan-status-feedback"><b>{isBn?'অ্যাডমিন বার্তা':'Admin message'}</b><span>{latestApplication.admin_feedback}</span></div>
      )}
      <Link to={latestApplication.status==='action_required'?'/apply?edit='+latestApplication.id:'/application/'+latestApplication.id} className="loan-status-cta">
        <span>{latestApplication.status==='action_required'?(isBn?'আবেদন আপডেট করুন':'Update application'):(isBn?'আবেদনের বিস্তারিত':'View application')}</span>
        <ArrowUpRight size={17}/>
      </Link>
    </section>
  );
}
