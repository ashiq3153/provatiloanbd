export function hasTelegramInitData(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
}

export function isBrowserPreviewMode(): boolean {
  return import.meta.env.VITE_BROWSER_PREVIEW === 'true' && !hasTelegramInitData();
}
