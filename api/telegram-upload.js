import { createClient } from "@supabase/supabase-js";
import { verifyInitData } from "./telegram-auth.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_BYTES = 3 * 1024 * 1024;
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { initData, fileName, contentType, fileBase64 } = req.body || {};
    const verified = verifyInitData(initData);

    if (!verified?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid Telegram initData" });
    }

    if (typeof fileName !== "string" || !fileName.trim()) {
      return res.status(400).json({ ok: false, error: "File name is required" });
    }

    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ ok: false, error: "Unsupported file type" });
    }

    if (typeof fileBase64 !== "string" || !fileBase64) {
      return res.status(400).json({ ok: false, error: "File data is required" });
    }

    const buffer = Buffer.from(fileBase64, "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) {
      return res.status(413).json({ ok: false, error: "File is too large. Maximum size is 3 MB." });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const telegramChatId = Number(verified.user.id);
    const filePath = telegramChatId + "/" + Date.now() + "_" + safeName;

    const db = adminClient();
    const { error: uploadError } = await db.storage
      .from("loan_documents")
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("telegram-upload storage error:", uploadError);
      return res.status(500).json({ ok: false, error: "Storage upload failed" });
    }

    const { data, error: signedUrlError } = await db.storage
      .from("loan_documents")
      .createSignedUrl(filePath, 300);

    if (signedUrlError || !data?.signedUrl) {
      console.error("telegram-upload signed URL error:", signedUrlError);
      return res.status(500).json({ ok: false, error: "Could not create file URL" });
    }

    return res.status(200).json({
      ok: true,
      url: data.signedUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("telegram-upload error:", error);
    return res.status(400).json({ ok: false, error: "File upload failed" });
  }
}
