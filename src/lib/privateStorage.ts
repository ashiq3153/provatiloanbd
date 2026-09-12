import { supabase } from './supabase';

const PRIVATE_BUCKET = 'loan_documents';
const SIGNED_URL_TTL_SECONDS = 60 * 5;

/** Upload a file into the user's private folder and return its storage path.
 * The caller should persist this path, never a public or expiring URL.
 */
export async function uploadPrivateDocument(
  file: File,
  telegramChatId: number,
  purpose: string,
): Promise<string | null> {
  if (!Number.isSafeInteger(telegramChatId) || telegramChatId <= 0) {
    console.error('uploadPrivateDocument: invalid Telegram chat ID');
    return null;
  }

  const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  const safePurpose = purpose.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'document';
  const filePath = `${telegramChatId}/${safePurpose}_${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) {
    console.error('uploadPrivateDocument error:', error);
    return null;
  }

  return filePath;
}

/** Create a short-lived viewing URL for a previously stored private path. */
export async function createPrivateDocumentUrl(filePath: string): Promise<string | null> {
  if (!filePath || filePath.startsWith('/') || filePath.includes('..')) return null;

  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error('createPrivateDocumentUrl error:', error);
    return null;
  }

  return data.signedUrl;
}
