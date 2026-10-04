import { ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, convertDigits } from '../../lib/translation';
import type { SuccessStory } from '../../types/database';

type Props={isBn:boolean;stories:SuccessStory[];storyReactions:Record<string,{like:number;love:number;wow:number}>;onReact:(story:SuccessStory,type:'like'|'love'|'wow')=>void};

export function SuccessStories({isBn,stories,storyReactions,onReact}:Props){
  const uniqueStories=Array.from(new Map(stories.map(story=>[story.id,story])).values()).slice(0,10);
  if(!uniqueStories.length)return null;

  return <section aria-labelledby="home-success-stories">
    <div className="flex items-end justify-between mb-3">
      <div><p className="text-[10px] uppercase tracking-wider font-black text-slate-500">{isBn?'সদস্যদের অভিজ্ঞতা':'SUCCESS STORIES'}</p><h2 id="home-success-stories" className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{isBn?'সাফল্যের গল্প':'Success Stories'}</h2></div>
      <Link to="/success-stories" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-sky-300">{isBn?'সব দেখুন':'View all'} <ChevronRight size={16}/></Link>
    </div>

    <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory" aria-label={isBn?'সাফল্যের গল্প':'Success stories'}>
      <div className="flex gap-3 w-max">
        {uniqueStories.map(story=><article key={story.id} className="home-success-story w-[calc(100vw-2rem)] max-w-[620px] min-w-[calc(100vw-2rem)] sm:min-w-[min(620px,calc(100vw-3rem))] shrink-0 snap-start rounded-[22px] p-4 sm:p-5 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Star size={17} fill="currentColor"/></span>
              <div className="min-w-0"><p className="text-sm sm:text-base font-extrabold">{isBn?'সদস্যের সাফল্যের গল্প':'Member success story'}</p><p className="text-[10px] sm:text-xs text-white/75 mt-0.5">{isBn?'প্রভাতী লোনের একজন সদস্যের অভিজ্ঞতা':'A member journey with Provati Loan'}</p></div>
            </div>
            {story.is_verified&&<span className="home-story-verified text-[9px] font-extrabold rounded-full px-2.5 py-1 shrink-0">{isBn?'যাচাইকৃত':'Verified'}</span>}
          </div>

          <div className="relative z-10 mt-4 flex items-center gap-3 sm:gap-4">
            <img src={story.avatar_url||('https://ui-avatars.com/api/?name='+encodeURIComponent(story.name)+'&background=0ea5e9&color=fff&bold=true')} alt="" className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full object-cover border-2 border-white/80 bg-white/20 shrink-0"/>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-bold leading-snug line-clamp-3">{story.testimonial||(isBn?'প্রভাতী লোনের সেবায় আমি সন্তুষ্ট।':'I am satisfied with the Provati Loan service.')}</p>
              <p className="text-xs sm:text-sm font-extrabold mt-2 truncate">{story.name}</p>
              <p className="text-[10px] sm:text-xs text-white/75 mt-0.5 truncate">{story.loan_type||(isBn?'ঋণ সদস্য':'Loan member')}{story.amount?' • '+formatCurrency(story.amount,isBn):''}</p>
            </div>
          </div>

          <div className="relative z-10 mt-3 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
            <div className="flex text-amber-300 shrink-0" aria-label={(story.rating||5)+' stars'}>{Array.from({length:Math.min(story.rating||5,5)}).map((_,i)=><Star key={i} size={12} fill="currentColor"/>)}</div>
            <div className="flex items-center gap-1.5">{(['like','love','wow'] as const).map(type=>{const base=type==='like'?Number(story.like_count||0):type==='love'?Number(story.love_count||0):Number(story.wow_count||0);const count=storyReactions[story.id]?.[type]??base;return <button key={type} type="button" onClick={()=>onReact(story,type)} aria-label={type} className="px-2 py-1 rounded-full bg-white/15 border border-white/25 text-[10px] text-white active:scale-95 transition">{type==='like'?'👍':type==='love'?'❤️':'😮'} {convertDigits(count,isBn)}</button>})}</div>
          </div>
        </article>)}
      </div>
    </div>
    <div className="flex justify-center gap-1.5 mt-2" aria-hidden="true">{uniqueStories.slice(0,Math.min(uniqueStories.length,5)).map((story,i)=><span key={story.id} className={'w-1.5 h-1.5 rounded-full '+(i===0?'bg-sky-500':'bg-slate-300 dark:bg-slate-700')}/>)}</div>
  </section>;
}
