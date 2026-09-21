import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Final dark fintech surface correction. Loaded after the legacy index.css
// so old glass-card rules cannot turn solid dark cards into grey overlays.
const fintechThemeFix = document.createElement('style');
fintechThemeFix.id = 'v11-fintech-theme-fix';
fintechThemeFix.textContent = `
  .dark .user-app-shell .bg-white.rounded-2xl,
  .dark .user-app-shell .bg-white.rounded-3xl,
  .dark .user-app-shell .bg-white.rounded-xl,
  .dark .user-app-shell .bg-white[class*="rounded-"],
  .dark .user-app-shell [class*="bg-white/"][class*="rounded-"] {
    background: #111c2e !important;
    background-color: #111c2e !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border-color: #26354a !important;
  }

  .dark .user-app-shell [class*="dark:bg-gray-800"],
  .dark .user-app-shell [class*="dark:bg-gray-800/"] {
    background: #111c2e !important;
    background-color: #111c2e !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .dark .user-app-shell [class*="dark:bg-gray-900"],
  .dark .user-app-shell [class*="dark:bg-gray-900/"] {
    background: #0f1724 !important;
    background-color: #0f1724 !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .dark .user-app-shell [class*="dark:bg-gray-950"],
  .dark .user-app-shell [class*="dark:bg-gray-950/"] {
    background: #0b1220 !important;
    background-color: #0b1220 !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .dark .user-app-shell [class*="dark:bg-slate-900"],
  .dark .user-app-shell [class*="dark:bg-slate-900/"] {
    background: #111c2e !important;
    background-color: #111c2e !important;
    background-image: none !important;
  }

  .dark .user-app-shell [class*="dark:bg-slate-800"],
  .dark .user-app-shell [class*="dark:bg-slate-800/"] {
    background: #162238 !important;
    background-color: #162238 !important;
    background-image: none !important;
  }

  .dark .user-app-shell .border-white\/30,
  .dark .user-app-shell .border-white\/20,
  .dark .user-app-shell .border-white\/10 {
    border-color: #26354a !important;
  }

  .dark .user-app-shell .text-gray-900,
  .dark .user-app-shell .text-gray-800 {
    color: #f8fafc !important;
  }

  .dark .user-app-shell .text-gray-500,
  .dark .user-app-shell .text-gray-400 {
    color: #94a3b8 !important;
  }
`;
document.head.appendChild(fintechThemeFix);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
