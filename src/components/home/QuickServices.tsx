import { ChevronRight, CreditCard, PiggyBank, FolderOpen, Headphones, WalletCards, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

type QuickServicesProps = {
  isBn: boolean;
  onQuickBalance: () => void;
};

export function QuickServices({ isBn, onQuickBalance }: QuickServicesProps) {
  const quickActions = [
    { label: isBn ? 'কিস্তি' : 'EMI', sub: isBn ? 'পরিশোধ করুন' : 'Make payment', icon: CreditCard, link: '/pay' },
    { label: isBn ? 'সঞ্চয়' : 'Savings', sub: isBn ? 'জমা দিন' : 'Deposit', icon: PiggyBank, link: '/deposit' },
    { label: isBn ? 'ডকুমেন্ট' : 'Documents', sub: isBn ? 'নথি দেখুন' : 'View files', icon: FolderOpen, link: '/profile' },
    { label: isBn ? 'আরও' : 'More', sub: isBn ? 'সাপোর্ট ও সহায়তা' : 'Support & help', icon: Headphones, link: '/support' },
    { label: isBn ? 'কুইক ব্যালেন্স' : 'Quick Balance', sub: isBn ? 'ব্যালেন্সের হিসাব' : 'Balance breakdown', icon: WalletCards, link: null },
    { label: isBn ? 'সাফল্যের গল্প' : 'Success Stories', sub: isBn ? 'সদস্যদের সাফল্য দেখুন' : 'Member success stories', icon: Star, link: '/success-stories' },
  ];

  return (
    <section>
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">{isBn ? 'সদস্য সেবা' : 'MEMBER SERVICES'}</p>
          <h2 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{isBn ? 'দ্রুত সেবা' : 'Quick services'}</h2>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{isBn ? '৬টি সেবা' : '6 services'} <span className="ml-1">← →</span></span>
      </div>
      <div className="-mx-3 px-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
        <div className="flex gap-2.5 sm:gap-3 w-max pb-1">
          {quickActions.map(({label,sub,icon:Icon,link}, index) => {
            const tile = (
              <>
                <span aria-hidden="true" className="home-tile-orb absolute -right-5 -top-5 w-16 h-16 rounded-full pointer-events-none"/>
                <span className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full service-icon flex items-center justify-center"><Icon size={18}/></span>
                <span className="relative z-10 min-w-0 w-full">
                  <span className="block text-[11px] sm:text-sm font-extrabold service-title truncate">{label}</span>
                  <span className="block text-[9px] sm:text-[11px] service-subtitle mt-0.5 leading-tight truncate">{sub}</span>
                </span>
                <ChevronRight size={16} className="absolute right-2 top-2 z-10 text-white/90"/>
              </>
            );
            const className = `home-service-tile service-tone-${index} relative isolate overflow-hidden min-w-0 w-[138px] sm:w-[160px] h-[112px] sm:h-[126px] rounded-[18px] p-2.5 sm:p-3 flex flex-col items-start justify-between active:scale-[.97] transition-transform snap-start text-left`;
            return link
              ? <Link key={label} to={link} className={className}>{tile}</Link>
              : <button key={label} type="button" onClick={onQuickBalance} className={className} aria-label={isBn ? 'ব্যালেন্সের বিস্তারিত দেখুন' : 'Open balance details'}>{tile}</button>;
          })}
        </div>
      </div>
    </section>
  );
}
