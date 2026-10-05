import { ChevronRight, UserRound, BriefcaseBusiness, GraduationCap, ShieldCheck, HeartPulse, Plane, UsersRound, CarFront, House } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type LoanServicesProps = {
  isBn: boolean;
  categoryName: (category?: string) => string;
};

export function LoanServices({ isBn, categoryName }: LoanServicesProps) {
  const navigate = useNavigate();
  const categories = [
    ['personal', isBn ? 'ব্যক্তিগত' : 'Personal'],
    ['business', isBn ? 'ব্যবসায়িক' : 'Business'],
    ['home', isBn ? 'বাড়ি' : 'Home'],
    ['medical', isBn ? 'চিকিৎসা' : 'Medical'],
    ['car', isBn ? 'গাড়ি' : 'Car'],
    ['student', isBn ? 'শিক্ষার্থী' : 'Student'],
    ['probashi', isBn ? 'প্রবাসী' : 'Probashi'],
    ['women', isBn ? 'নারী উদ্যোক্তা' : 'Women'],
  ];
  const loanCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      personal: UserRound,
      business: BriefcaseBusiness,
      home: House,
      medical: HeartPulse,
      probashi: Plane,
      women: UsersRound,
      car: CarFront,
      student: GraduationCap,
    };
    return icons[category] || ShieldCheck;
  };

  return (
    <section>
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">{isBn ? 'ঋণ সেবা' : 'LOAN SERVICES'}</p>
          <h2 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{isBn ? 'আপনার প্রয়োজন অনুযায়ী' : 'Choose a service'}</h2>
        </div>
        <button onClick={() => navigate("/loan-categories")} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-sky-300">{isBn ? 'সব দেখুন' : 'View all'} <ChevronRight size={16}/></button>
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {(['personal','business','student','emergency'] as const).map((id) => {
          const found = categories.find(([category]) => category === id);
          const label = found?.[1] || categoryName(id);
          return (
            <button key={id} onClick={() => navigate(`/apply?category=${id}`)} className={`home-category-tile category-${id} relative isolate overflow-hidden text-left min-w-0 h-[88px] sm:h-[98px] rounded-[16px] p-2.5 sm:p-3 flex flex-col items-start justify-between active:scale-[.97] transition-transform`}>
              <span aria-hidden="true" className="home-tile-orb absolute -right-5 -top-5 w-16 h-16 rounded-full pointer-events-none"/>
              <span className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full category-icon flex items-center justify-center">{(() => { const Icon = loanCategoryIcon(id); return <Icon size={17}/>; })()}</span>
              <span className="relative z-10 block text-[10px] sm:text-xs font-extrabold category-title truncate max-w-full">{label}</span>
              <ChevronRight size={15} className="absolute right-2 top-2 z-10 text-white/90"/>
            </button>
          );
        })}
      </div>
    </section>
  );
}
