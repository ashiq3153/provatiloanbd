function validatePrivatePath(path, telegramChatId) {
  const ownerPrefix = `${telegramChatId}/`;
  if (
    typeof path !== "string" ||
    !path.startsWith(ownerPrefix) ||
    path.includes("..") ||
    path.includes("\\") ||
    path.split("/").length !== 2 ||
    !/^\d+\/[A-Za-z0-9._-]+$/.test(path)
  ) {
    throw new Error("Invalid private document reference");
  }
  return path;
}

/** Normalize a new private object path or a legacy same-project signed URL to a path. */
export function normalizeUserPrivateDocumentReference(value, telegramChatId, supabaseUrl) {
  if (value == null || value === "") return null;
  const ownerId = Number(telegramChatId);
  if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
    throw new Error("Invalid Telegram identity for document upload");
  }

  if (typeof value !== "string") throw new Error("Invalid private document reference");
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    let parsed;
    let configured;
    try {
      parsed = new URL(value);
      configured = new URL(supabaseUrl);
    } catch {
      throw new Error("Invalid private document URL");
    }
    const marker = "/object/sign/loan_documents/";
    const index = parsed.pathname.indexOf(marker);
    if (parsed.origin !== configured.origin || index < 0) {
      throw new Error("External or non-private document URLs are not accepted");
    }
    try {
      path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    } catch {
      throw new Error("Invalid private document URL encoding");
    }
  }
  return validatePrivatePath(path, ownerId);
}

/** Validate document maps before the service-role gateway persists them. */
export function normalizeUserPrivateDocumentMap(documents, telegramChatId, supabaseUrl) {
  if (documents == null) return documents;
  if (typeof documents !== "object" || Array.isArray(documents)) {
    throw new Error("Invalid loan documents");
  }
  const normalized = {};
  for (const [key, value] of Object.entries(documents)) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) throw new Error("Invalid document field");
    const path = normalizeUserPrivateDocumentReference(value, telegramChatId, supabaseUrl);
    if (path) normalized[key] = path;
  }
  return normalized;
}
