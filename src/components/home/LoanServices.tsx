import { ChevronRight, UserRound, BriefcaseBusiness, Plane, House } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type LoanServicesProps = { isBn: boolean; categoryName: (category?: string) => string };

export function LoanServices({ isBn }: LoanServicesProps) {
  const navigate = useNavigate();
  const categories = [
    { id: 'personal', bn: 'ব্যক্তিগত', en: 'Personal', icon: UserRound, tone: 'category-personal' },
    { id: 'business', bn: 'ব্যবসায়িক', en: 'Business', icon: BriefcaseBusiness, tone: 'category-business' },
    { id: 'probashi', bn: 'প্রবাসী', en: 'Probashi', icon: Plane, tone: 'category-probashi' },
    { id: 'home', bn: 'বাড়ি', en: 'Home', icon: House, tone: 'category-home' },
  ];

  return (
    <section aria-labelledby="home-loan-services">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">{isBn ? 'ঋণ সেবা' : 'LOAN SERVICES'}</p>
          <h2 id="home-loan-services" className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{isBn ? 'আপনার প্রয়োজন অনুযায়ী' : 'Choose a service'}</h2>
        </div>
        <button type="button" onClick={() => navigate('/loans')} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-sky-300">
          {isBn ? 'সব লোন' : 'All loans'} <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {categories.map(({ id, bn, en, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate('/apply?category=' + id)}
            aria-label={isBn ? bn + ' লোনের জন্য আবেদন' : 'Apply for ' + en + ' loan'}
            className={'home-category-tile ' + tone + ' relative isolate overflow-hidden text-left min-w-0 h-[92px] sm:h-[100px] rounded-[17px] p-3 flex flex-col items-start justify-between active:scale-[.97] transition-transform'}
          >
            <span aria-hidden="true" className="home-tile-orb absolute -right-5 -top-5 w-16 h-16 rounded-full pointer-events-none" />
            <span className="relative z-10 w-9 h-9 rounded-full category-icon flex items-center justify-center"><Icon size={18} /></span>
            <span className="relative z-10 block text-[11px] sm:text-xs font-extrabold category-title truncate max-w-full">{isBn ? bn : en}</span>
            <ChevronRight size={15} className="absolute right-2 top-2 z-10 text-white/90" />
          </button>
        ))}
      </div>
    </section>
  );
}
