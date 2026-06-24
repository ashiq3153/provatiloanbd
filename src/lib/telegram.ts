export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export const getTelegramUser = (): TelegramUser => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    // @ts-ignore
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  // Mock user for local development / preview
  return {
    id: 123456789,
    first_name: 'Arif',
    last_name: 'Hossain',
    username: 'arif_hossain',
    photo_url: 'https://i.pravatar.cc/150?u=arif_hossain',
  };
};

/**
 * Sends a notification message to a user via the Telegram Bot API.
 */
export async function sendTelegramNotification(
  chatId: number,
  message: string,
  botToken?: string,
  replyMarkup?: any
): Promise<boolean> {
  const token = botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ Telegram Bot Token is missing. Notification not sent.");
    return false;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };
    
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Telegram API Error:", errData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}

