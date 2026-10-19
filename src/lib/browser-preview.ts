/** True when the current window was launched as a Telegram Mini App. */
export function hasTelegramInitData(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
}

/** True for Vercel Preview builds only. This flag is absent from Production. */
export function isBrowserPreviewMode(): boolean {
  return import.meta.env.VITE_BROWSER_PREVIEW === 'true';
}
