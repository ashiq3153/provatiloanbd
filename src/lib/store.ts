import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  systemSettings: any;
  soundEnabled: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  setSystemSettings: (settings: any) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'bn', // Defaulting to Bangla as requested context implies Bangla might be preferred, or English
      systemSettings: null,
      soundEnabled: true,
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        }),
      setLanguage: (lang) => set({ language: lang }),
      setSystemSettings: (settings) => set({ systemSettings: settings }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: 'app-settings',
    }
  )
);
