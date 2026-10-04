import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'The app could not be loaded.',
    };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isTelegramIssue = /Telegram user is unavailable|initData/i.test(this.state.message);

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <section className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-sm p-6 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl">
            🏦
          </div>
          <h1 className="text-xl font-black">PROVATI LOAN</h1>
          <p className="mt-2 text-sm text-slate-500 leading-6">
            {isTelegramIssue
              ? 'এই অ্যাপটি Telegram Mini App হিসেবে খুলুন। Telegram-এর ভিতর থেকে অ্যাপটি চালু করলে আপনার প্রোফাইল ও সুরক্ষিত তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হবে।'
              : 'অ্যাপটি এই মুহূর্তে লোড করা যাচ্ছে না। আবার চেষ্টা করুন।'}
          </p>
          {isTelegramIssue && (
            <a
              href="https://t.me/loan_pss"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white"
            >
              Telegram-এ খুলুন
            </a>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 block w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
          >
            আবার চেষ্টা করুন
          </button>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
