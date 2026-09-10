export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * Returns the Telegram user supplied by the Mini App runtime.
 * This is UI-only data and MUST NOT be used for authorization.
 */
export const getTelegramUser = (): TelegramUser | null => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    // @ts-ignore
    return window.Telegram.WebApp.initDataUnsafe.user;
  }

  // No mock identity in the security-sensitive v1.1 flow.
  return null;
};

/**
 * Sends raw Telegram initData to the server for cryptographic validation.
 * The browser never receives or handles the bot token.
 */
export async function getVerifiedTelegramUser(): Promise<TelegramUser | null> {
  // @ts-ignore
  const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  const initData = webApp?.initData || '';
  if (!initData) return null;

  try {
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.ok && data?.user?.id ? data.user : null;
  } catch (error) {
    console.error('Telegram server authentication error:', error);
    return null;
  }
}

/**
 * Sends a Telegram notification through the server-side Vercel function.
 * In a Telegram Mini App, raw initData is included so the server can
 * cryptographically verify the caller before sending to that chat.
 */
export async function sendTelegramNotification(
  chatId: number,
  message: string,
  _botToken?: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    const response = await fetch('/api/telegram-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        reply_markup: replyMarkup,
        initData,
      }),
    });

    if (!response.ok) {
      let errData: any;
      try {
        errData = await response.json();
      } catch {
        errData = { error: await response.text() };
      }
      console.error('Telegram API Error:', errData);
      return false;
    }

    const data = await response.json().catch(() => ({ ok: true }));
    return data?.ok !== false;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}
