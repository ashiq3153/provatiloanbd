import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreditCard, PiggyBank, FolderOpen, Headphones } from 'lucide-react';

type QuickServicesProps = { isBn: boolean };

export function QuickServices({ isBn }: QuickServicesProps) {
  const quickActions = [
    { label: isBn ? 'কিস্তি' : 'EMI', sub: isBn ? 'পরিশোধ করুন' : 'Make payment', icon: CreditCard, link: '/pay' },
    { label: isBn ? 'সঞ্চয়' : 'Savings', sub: isBn ? 'জমা দিন' : 'Deposit', icon: PiggyBank, link: '/deposit' },
    { label: isBn ? 'ডকুমেন্ট' : 'Documents', sub: isBn ? 'নথি দেখুন' : 'View files', icon: FolderOpen, link: '/profile' },
    { label: isBn ? 'আরও' : 'More', sub: isBn ? 'সাপোর্ট ও সহায়তা' : 'Support & help', icon: Headphones, link: '/support' },
  ];

  return (
    <section>
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">{isBn ? 'সদস্য সেবা' : 'MEMBER SERVICES'}</p>
          <h2 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{isBn ? 'দ্রুত সেবা' : 'Quick services'}</h2>
        </div>
        <Link to="/support" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-sky-300">{isBn ? 'সব দেখুন' : 'View all'} <ChevronRight size={16}/></Link>
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {quickActions.map(({label,sub,icon:Icon,link}, index) => (
          <Link key={link} to={link} className={`home-service-tile service-tone-${index} relative isolate overflow-hidden min-w-0 h-[112px] sm:h-[126px] rounded-[18px] p-2.5 sm:p-3 flex flex-col items-start justify-between active:scale-[.97] transition-transform`}>
            <span aria-hidden="true" className="home-tile-orb absolute -right-5 -top-5 w-16 h-16 rounded-full pointer-events-none"/>
            <span className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full service-icon flex items-center justify-center"><Icon size={18}/></span>
            <span className="relative z-10 min-w-0 w-full"><span className="block text-[11px] sm:text-sm font-extrabold service-title truncate">{label}</span><span className="block text-[9px] sm:text-[11px] service-subtitle mt-0.5 leading-tight truncate">{sub}</span></span>
            <ChevronRight size={16} className="absolute right-2 top-2 z-10 text-white/90"/>
          </Link>
        ))}
      </div>
    </section>
  );
}
