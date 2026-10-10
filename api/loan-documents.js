const BUCKETS = new Set(["loan_documents", "deposit_screenshots"]);

function isSafeObjectPath(path, expectedChatId) {
  const parts = path.split("/");
  if (parts.length < 2 || parts.some((part) => !part || part === "." || part === "..")) {
    return false;
  }
  if (parts[0] !== String(expectedChatId)) return false;
  // The upload endpoint sanitizes file names to this character set. Keeping the
  // same constraint prevents encoded separators and path traversal in stored refs.
  return parts.every((part) => /^[A-Za-z0-9._-]+$/.test(part));
}

/**
 * Normalize a user-owned Storage reference to "bucket/userId/object-name".
 * Accepts current signed/public Supabase URLs, already-normalized references,
 * and legacy bare object paths. It deliberately discards query tokens.
 */
export function normalizeStorageReference(
  value,
  expectedChatId,
  supabaseUrl,
  options = {},
) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid storage reference");
  }

  const chatId = Number(expectedChatId);
  if (!Number.isSafeInteger(chatId) || chatId <= 0) {
    throw new Error("Invalid storage owner");
  }

  const allowedBuckets = Array.isArray(options.allowedBuckets)
    ? options.allowedBuckets
    : ["loan_documents"];
  const allowed = new Set(allowedBuckets.filter((bucket) => BUCKETS.has(bucket)));
  if (!allowed.size) throw new Error("No supported storage buckets are allowed");

  let bucket = options.defaultBucket || allowedBuckets[0] || "loan_documents";
  let objectPath = value.trim();

  if (/^https?:\/\//i.test(objectPath)) {
    let parsed;
    let configured;
    try {
      parsed = new URL(objectPath);
      configured = new URL(supabaseUrl);
    } catch {
      throw new Error("Invalid storage URL");
    }
    if (parsed.origin !== configured.origin) {
      throw new Error("Storage URL origin does not match this project");
    }
    const match = parsed.pathname.match(
      /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/,
    );
    if (!match) throw new Error("Unsupported Supabase Storage URL");
    try {
      bucket = decodeURIComponent(match[1]);
      objectPath = decodeURIComponent(match[2]);
    } catch {
      throw new Error("Invalid encoded storage path");
    }
  } else {
    if (objectPath.includes("://") || objectPath.startsWith("/") || objectPath.includes("?") || objectPath.includes("#")) {
      throw new Error("Invalid storage reference format");
    }
    // New records include the bucket prefix. Older records may contain only
    // the object path; those use the explicit default bucket for that column.
    const firstSlash = objectPath.indexOf("/");
    const firstSegment = firstSlash === -1 ? "" : objectPath.slice(0, firstSlash);
    if (BUCKETS.has(firstSegment)) {
      bucket = firstSegment;
      objectPath = objectPath.slice(firstSlash + 1);
    }
  }

  if (!allowed.has(bucket)) throw new Error("Storage bucket is not allowed for this field");
  if (!isSafeObjectPath(objectPath, chatId)) {
    throw new Error("Storage path does not belong to this user or is malformed");
  }

  return bucket + "/" + objectPath;
}

export function splitStorageReference(reference) {
  if (typeof reference !== "string") throw new Error("Invalid storage reference");
  const slash = reference.indexOf("/");
  if (slash <= 0 || slash === reference.length - 1) {
    throw new Error("Invalid normalized storage reference");
  }
  const bucket = reference.slice(0, slash);
  const path = reference.slice(slash + 1);
  if (!BUCKETS.has(bucket)) throw new Error("Unsupported storage bucket");
  return { bucket, path };
}
