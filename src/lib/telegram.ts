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
 * Server-side initData verification is being introduced in v1.1 before
 * ownership-based RLS is enabled. Do not use initDataUnsafe for authorization.
 */
export const getTelegramUser = (): TelegramUser => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    // @ts-ignore
    return window.Telegram.WebApp.initDataUnsafe.user;
  }

  // Mock user for local development / preview only.
  return {
    id: 123456789,
    first_name: 'Arif',
    last_name: 'Hossain',
    username: 'arif_hossain',
    photo_url: 'https://i.pravatar.cc/150?u=arif_hossain',
  };
};

/**
 * Sends a Telegram notification through the server-side Vercel function.
 * The bot token is intentionally never read by browser code.
 */
export async function sendTelegramNotification(
  chatId: number,
  message: string,
  _botToken?: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        reply_markup: replyMarkup,
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
