import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, RefreshCw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../lib/store';
import { getSuccessStories, reactToSuccessStory } from '../lib/api';
import { SuccessStories } from '../components/home/SuccessStories';
import type { SuccessStory } from '../types/database';

export default function SuccessStoriesPage() {
  const language = useAppStore(state => state.language);
  const isBn = language === 'bn';
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [reactions, setReactions] = useState<Record<string, { like: number; love: number; wow: number }>>({});
  const [loading, setLoading] = useState(true);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try { setStories(await getSuccessStories()); }
    catch (error) { console.error('Success stories page load failed:', error); toast.error(isBn ? 'সাফল্যের গল্প আনা যায়নি' : 'Could not load success stories'); }
    finally { setLoading(false); }
  }, [isBn]);
  useEffect(() => { void loadStories(); }, [loadStories]);

  const handleReact = async (story: SuccessStory, type: 'like' | 'love' | 'wow') => {
    const ok = await reactToSuccessStory(story.id, type);
    if (!ok) { toast.error(isBn ? 'রিঅ্যাকশন দেওয়া যায়নি' : 'Could not add reaction'); return; }
    const field = (type + '_count') as 'like_count' | 'love_count' | 'wow_count';
    setReactions(prev => ({ ...prev, [story.id]: {
      like: prev[story.id]?.like ?? Number(story.like_count || 0),
      love: prev[story.id]?.love ?? Number(story.love_count || 0),
      wow: prev[story.id]?.wow ?? Number(story.wow_count || 0),
      [type]: (prev[story.id]?.[type] ?? Number(story[field] || 0)) + 1,
    }}));
  };

  return (
    <main className="min-h-screen px-3 sm:px-4 pt-4 pb-28 bg-[#f6f8fc] dark:bg-[#0b1220] text-slate-900 dark:text-slate-100">
      <header className="flex items-center gap-3 mb-5">
        <Link to="/" aria-label={isBn ? 'হোমে ফিরুন' : 'Back home'} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"><ArrowLeft size={19}/></Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">{isBn ? 'সদস্যদের অভিজ্ঞতা' : 'MEMBER STORIES'}</p>
          <h1 className="text-xl font-black">{isBn ? 'লাইভ সাফল্যের গল্প' : 'Live Success Stories'}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isBn ? 'অ্যাডমিন কর্তৃক প্রকাশিত সদস্যদের সাফল্যের গল্প' : 'Stories published by the admin team'}</p>
        </div>
        <button type="button" onClick={() => void loadStories()} disabled={loading} aria-label={isBn ? 'আবার লোড করুন' : 'Refresh'} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={18}/> : <RefreshCw size={18}/>}</button>
      </header>
      {loading ? <div className="py-16 flex flex-col items-center gap-3 text-slate-500"><LoaderCircle size={26} className="animate-spin"/><p className="text-sm font-bold">{isBn ? 'সাফল্যের গল্প লোড হচ্ছে…' : 'Loading success stories…'}</p></div>
      : stories.length ? <div className="space-y-4"><p className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'মোট ' + stories.length + 'টি গল্প' : stories.length + ' stories'}</p><SuccessStories isBn={isBn} stories={stories} storyReactions={reactions} onReact={handleReact}/></div>
      : <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm"><span className="mx-auto mb-4 flex w-14 h-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500"><Star size={25}/></span><h2 className="font-black text-base">{isBn ? 'এখনো কোনো সাফল্যের গল্প প্রকাশিত হয়নি' : 'No success stories published yet'}</h2><p className="text-xs leading-5 text-slate-500 dark:text-slate-400 mt-2">{isBn ? 'অ্যাডমিন সাফল্যের গল্প প্রকাশ করলে এখানে দেখা যাবে।' : 'Stories published by the admin will appear here.'}</p><button type="button" onClick={() => void loadStories()} className="mt-5 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-extrabold">{isBn ? 'আবার চেষ্টা করুন' : 'Try again'}</button></section>}
    </main>
  );
}
