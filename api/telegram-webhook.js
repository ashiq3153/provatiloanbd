/**
 * Telegram Webhook Handler — Vercel Serverless Function
 * Endpoint: POST /api/telegram-webhook
 *
 * Replies to ANY user text message with a fixed support message
 * plus an inline button to open the Telegram Mini App.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://provatiloanbd.vercel.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Send a message via Telegram Bot API.
 */
async function sendMessage(chatId, text, replyMarkup) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

/**
 * Save user to Supabase 'profiles' table.
 */
async function saveUserProfile(chatId, firstName, lastName, username) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        chat_id: chatId,
        first_name: firstName || "",
        last_name: lastName || null,
        username: username || null
      }),
    });
  } catch (err) {
    console.error("Failed to save user profile:", err);
  }
}

/**
 * The fixed support reply message.
 */
const SUPPORT_MESSAGE =
  `📢 <b>লোন আবেদন, স্ট্যাটাস চেক বা বিস্তারিত তথ্যের জন্য অনুগ্রহ করে Loan Application App টি খুলুন।</b>\n\n` +
  `সকল লোন-সংক্রান্ত সহায়তা ইন-অ্যাপ <b>Live Chat</b> সিস্টেমের মাধ্যমে পাওয়া যাবে।\n\n` +
  `আপনি সরাসরি সাপোর্টে যোগাযোগ করতে পারেন:\n` +
  `✅ Live Chat\n` +
  `✅ WhatsApp Support\n` +
  `✅ Telegram Support\n\n` +
  `নিচের বাটনটি ক্লিক করে এগিয়ে যান।`;

/**
 * Inline keyboard with Mini App button.
 */
function getMiniAppKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "📝 Open Loan Application",
          web_app: { url: MINI_APP_URL },
        },
      ],
    ],
  };
}

export default async function handler(req, res) {
  // Only accept POST requests from Telegram
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const update = req.body;

    // Handle regular text messages
    const message = update?.message;
    if (message && message.text && message.chat?.id) {
      const chatId = message.chat.id;
      const text = message.text.trim();

      // Ignore /start command (welcome message is sent from the frontend)
      // but still reply if you want — just remove this check to always reply
      if (text === "/start") {
        // Save user to DB on /start
        await saveUserProfile(chatId, message.chat.first_name, message.chat.last_name, message.chat.username);

        // Optionally send welcome for /start too
        await sendMessage(
          chatId,
          `🏦 <b>PROVATI LOAN-এ আপনাকে স্বাগতম।</b>\n\n` +
          `ব্যক্তিগত, ব্যবসায়ী, প্রবাসী ও অন্যান্য ঋণের জন্য আবেদন করতে নিচের বাটনে ক্লিক করুন।\n\n` +
          `✅ দ্রুত আবেদন\n` +
          `✅ অনলাইন প্রক্রিয়া\n` +
          `✅ আবেদন স্ট্যাটাস ট্র্যাকিং`,
          getMiniAppKeyboard()
        );
      } else {
        // Any other text → always send the fixed support message
        await sendMessage(chatId, SUPPORT_MESSAGE, getMiniAppKeyboard());
      }
    }

    // Telegram requires 200 OK response
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Still return 200 to avoid Telegram retry loops
    return res.status(200).json({ ok: false });
  }
}
