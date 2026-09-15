export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * Returns only the Telegram runtime user for display/UI purposes.
 * This data MUST NOT be used for authorization.
 * Throws when Telegram user data is unavailable so callers cannot silently
 * continue with a fabricated identity.
 */
export const getTelegramUser = (): TelegramUser => {
  // @ts-ignore
  const user = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : undefined;
  if (!user?.id) {
    throw new Error('Telegram user is unavailable');
  }
  return user as TelegramUser;
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
 * The server verifies raw Telegram initData and enforces chat ownership.
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
