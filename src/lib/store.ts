import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '../types/database';

interface AppState {
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  systemSettings: any;
  soundEnabled: boolean;
  userProfile: Profile | null;
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  setSystemSettings: (settings: any) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setUserProfile: (profile: Profile | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'bn', // Defaulting to Bangla as requested context implies Bangla might be preferred, or English
      systemSettings: null,
      soundEnabled: true,
      userProfile: null,
      // Dark mode is the default; preserve user choice across sessions.
      toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setLanguage: (lang) => set({ language: lang }),
      setSystemSettings: (settings) => set({ systemSettings: settings }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setUserProfile: (profile) => set({ userProfile: profile }),
    }),
    {
      name: 'app-settings',
    }
  )
);
