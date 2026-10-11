import { createClient } from "@supabase/supabase-js";
import { verifyInitData } from "./telegram-auth.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_CHAT_IDS = new Set(
  String(process.env.TELEGRAM_ADMIN_CHAT_IDS || "").split(",").map(v => v.trim()).filter(Boolean)
);
const DOCUMENT_VIEW_ROLES = new Set(["owner", "admin", "finance", "support"]);

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Server database credentials are not configured");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isSafePrivatePath(path) {
  return typeof path === "string" &&
    /^\d+\/[A-Za-z0-9._-]+$/.test(path) &&
    !path.includes("..") &&
    !path.includes("\\");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  res.setHeader("Cache-Control", "no-store");

  try {
    const { initData, path } = req.body || {};
    const verified = verifyInitData(initData);
    if (!verified?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid Telegram initData" });
    }

    const telegramChatId = Number(verified.user.id);
    if (!Number.isSafeInteger(telegramChatId) || telegramChatId <= 0 || !isSafePrivatePath(path)) {
      return res.status(400).json({ ok: false, error: "Invalid private document path" });
    }

    const pathOwnerId = path.split("/")[0];
    const db = adminClient();

    // Applicants may request signed URLs only for files in their own Telegram folder.
    // Cross-user reads require both the server-side admin allowlist and an allowed role.
    if (pathOwnerId !== String(telegramChatId)) {
      if (!ADMIN_CHAT_IDS.has(String(telegramChatId))) {
        return res.status(403).json({ ok: false, error: "Document access denied" });
      }
      const { data: role, error: roleError } = await db.rpc("get_admin_role", {
        p_chat_id: telegramChatId,
      });
      if (roleError) {
        console.error("Document role lookup failed:", roleError);
        return res.status(403).json({ ok: false, error: "Document access denied" });
      }
      const effectiveRole = role || "owner";
      if (!DOCUMENT_VIEW_ROLES.has(effectiveRole)) {
        return res.status(403).json({ ok: false, error: "Document access denied" });
      }
    }

    const { data, error } = await db.storage
      .from("loan_documents")
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      console.error("telegram-document-url error:", error);
      return res.status(404).json({ ok: false, error: "Document not found or unavailable" });
    }

    return res.status(200).json({ ok: true, url: data.signedUrl });
  } catch (error) {
    console.error("telegram-document-url error:", error);
    return res.status(400).json({ ok: false, error: "Could not create file URL" });
  }
}
