import { ArrowLeft, Clock3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';

export default function PlaceholderPage({ title }: { title: string }) {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const isBn = language === 'bn';

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0b1220] px-5 py-8 transition-colors">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={isBn ? 'পেছনে যান' : 'Go back'}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {isBn ? 'সদস্য সেবা' : 'Member service'}
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111c2e]">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-7 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
              {isBn ? 'শীঘ্রই আসছে' : 'Coming soon'}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          </div>

          <div className="px-6 py-6">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isBn
                ? 'এই সেবাটি বর্তমানে প্রস্তুত করা হচ্ছে। চালু হলে আপনার সদস্য অ্যাকাউন্ট থেকেই সরাসরি ব্যবহার করতে পারবেন।'
                : 'This service is currently being prepared. Once available, you will be able to use it directly from your member account.'}
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isBn ? 'আপনার সদস্য তথ্য সুরক্ষিত' : 'Your member information is protected'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {isBn ? 'সেবা চালু হওয়ার আগে কোনো অতিরিক্ত তথ্য জমা দেওয়ার প্রয়োজন নেই।' : 'No additional information is required before this service becomes available.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              {isBn ? 'হোমে ফিরে যান' : 'Back to home'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
