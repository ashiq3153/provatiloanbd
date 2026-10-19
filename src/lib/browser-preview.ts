/** True for Vercel Preview builds only. This flag is absent from Production. */
export function isBrowserPreviewMode(): boolean {
  return import.meta.env.VITE_BROWSER_PREVIEW === 'true';
}
