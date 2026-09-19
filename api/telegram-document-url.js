import { createClient } from "@supabase/supabase-js";
import { verifyInitData } from "./telegram-auth.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Server database credentials are not configured");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { initData, path } = req.body || {};
    const verified = verifyInitData(initData);
    if (!verified?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid Telegram initData" });
    }

    const telegramChatId = String(Number(verified.user.id));
    if (typeof path !== "string" || !path.startsWith(telegramChatId + "/")) {
      return res.status(403).json({ ok: false, error: "Invalid document path" });
    }

    const db = adminClient();
    const { data, error } = await db.storage
      .from("loan_documents")
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      console.error("telegram-document-url error:", error);
      return res.status(500).json({ ok: false, error: "Could not create file URL" });
    }

    return res.status(200).json({ ok: true, url: data.signedUrl });
  } catch (error) {
    console.error("telegram-document-url error:", error);
    return res.status(400).json({ ok: false, error: "Could not create file URL" });
  }
}
