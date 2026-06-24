/**
 * Set Telegram Webhook — Vercel Serverless Function
 * Endpoint: GET /api/set-webhook
 *
 * Call this ONCE after deployment to register the webhook URL with Telegram.
 * Visit: https://your-vercel-app.vercel.app/api/set-webhook
 */

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || "8539494845:AAEbWQfOpCrAzulsbefYn25uTeyiQ_By6Mg";

export default async function handler(req, res) {
  const host = req.headers.host || "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/telegram-webhook`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
        }),
      }
    );
    const data = await response.json();

    return res.status(200).json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
