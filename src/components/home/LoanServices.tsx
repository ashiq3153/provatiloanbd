import { ChevronRight, UserRound, BriefcaseBusiness, Plane, House, Percent, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type LoanServicesProps = { isBn:boolean; categoryName?: (category?:string)=>string };

export function LoanServices({isBn}:LoanServicesProps){
  const navigate=useNavigate();
  const categories=[
    {id:'personal',bn:'ব্যক্তিগত',en:'Personal',icon:UserRound,rate:'0.35%',from:'৫০K+',tone:'loan-tone-blue'},
    {id:'business',bn:'ব্যবসায়িক',en:'Business',icon:BriefcaseBusiness,rate:'0.34%',from:'১L+',tone:'loan-tone-navy'},
    {id:'probashi',bn:'প্রবাসী',en:'Probashi',icon:Plane,rate:'0.30%',from:'১L+',tone:'loan-tone-teal'},
    {id:'home',bn:'বাড়ি',en:'Home',icon:House,rate:'0.20%',from:'৫L+',tone:'loan-tone-slate'}
  ];
  return <section aria-labelledby="home-loan-services">
    <div className="loan-section-head"><div><p>{isBn?'ঋণ সেবা':'LOAN SERVICES'}</p><h2 id="home-loan-services">{isBn?'আপনার প্রয়োজন অনুযায়ী':'Choose your loan'}</h2></div><button type="button" onClick={()=>navigate('/loans')} className="loan-all-link">{isBn?'সব লোন':'All loans'} <ChevronRight size={14}/></button></div>
    <div className="loan-category-grid">{categories.map(({id,bn,en,icon:Icon,rate,from,tone})=><button key={id} type="button" onClick={()=>navigate('/apply?category='+id)} className={'premium-loan-tile '+tone}>
      <span className="loan-tile-icon"><Icon size={17}/></span><span className="loan-tile-copy"><span className="loan-tile-name">{isBn?bn:en}</span><span className="loan-tile-meta"><span><Percent size={9}/>{rate}</span><span><WalletCards size={9}/>{from}</span></span></span><ChevronRight className="loan-tile-arrow" size={15}/>
    </button>)}</div>
  </section>;
}