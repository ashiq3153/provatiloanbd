import { createClient } from "@supabase/supabase-js";
import { verifyInitData } from "./telegram-auth.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Server database credentials are not configured");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeFileName(name) {
  return String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { initData, fileName, contentType, fileSize } = req.body || {};
    const verified = verifyInitData(initData);

    if (!verified?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid Telegram initData" });
    }

    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ ok: false, error: "Unsupported file type" });
    }

    if (!Number.isFinite(Number(fileSize)) || Number(fileSize) <= 0 || Number(fileSize) > MAX_BYTES) {
      return res.status(413).json({ ok: false, error: "File is too large. Maximum size is 10 MB." });
    }

    const telegramChatId = Number(verified.user.id);
    const filePath = telegramChatId + "/" + Date.now() + "_" + safeFileName(fileName);

    const db = adminClient();
    const { data, error } = await db.storage
      .from("loan_documents")
      .createSignedUploadUrl(filePath);

    if (error || !data?.token) {
      console.error("telegram-upload signed upload URL error:", error);
      return res.status(500).json({ ok: false, error: "Could not create upload URL" });
    }

    return res.status(200).json({
      ok: true,
      path: filePath,
      token: data.token,
    });
  } catch (error) {
    console.error("telegram-upload error:", error);
    return res.status(400).json({ ok: false, error: "Could not prepare file upload" });
  }
}
