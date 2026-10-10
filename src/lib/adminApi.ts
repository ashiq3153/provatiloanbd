import { supabase, ensureSupabaseAuthSession } from './supabase';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../types/database';

type AdminAction =
  | 'get_profiles'
  | 'get_loans'
  | 'get_transactions'
  | 'get_success_stories'
  | 'get_system_setting'
  | 'ban_user'
  | 'lock_user'
  | 'delete_user'
  | 'update_transaction'
  | 'update_loan'
  | 'update_system_setting'
  | 'add_success_story'
  | 'delete_success_story'
  | 'get_chat_messages'
  | 'send_chat_message'
  | 'edit_chat_message'
  | 'mark_chat_seen'
  | 'delete_chat_message'
  | 'send_telegram_message'
  | 'broadcast_telegram_message'
  | 'get_financial_report'
  | 'get_kyc_queue'
  | 'update_kyc_review'
  | 'set_admin_status';

async function callAdmin<T>(adminAction: AdminAction, payload: Record<string, unknown> = {}): Promise<T> {
  const telegramWebApp = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  const initData = telegramWebApp?.initData;
  if (!initData) {
    throw new Error('Admin gateway: Telegram initData is missing');
  }

  const session = await ensureSupabaseAuthSession();
  if (!session?.access_token) {
    throw new Error('Admin gateway: authenticated session is missing');
  }

  const response = await fetch('/api/telegram-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, action: 'admin', adminAction, payload }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || response.statusText || 'Admin gateway request failed');
  }
  return result.data as T;
}

export async function getAllProfiles(): Promise<Profile[]> { return (await callAdmin<Profile[]>('get_profiles')) || []; }
export async function banUser(chatId: number, isBanned: boolean): Promise<boolean> { return (await callAdmin<boolean>('ban_user', { chatId, isBanned })) === true; }
export async function lockUser(chatId: number, isLocked: boolean, reason?: string | null): Promise<boolean> { return (await callAdmin<boolean>('lock_user', { chatId, isLocked, reason: reason || null })) === true; }
export async function deleteUser(chatId: number): Promise<boolean> { return (await callAdmin<boolean>('delete_user', { chatId })) === true; }
export async function getAllLoanApplications(): Promise<LoanApplication[]> { return (await callAdmin<LoanApplication[]>('get_loans')) || []; }
export async function updateLoanApplicationStatus(id: string, status: LoanApplication['status'], feedback?: string): Promise<boolean> { return (await callAdmin<boolean>('update_loan', { id, status, feedback: feedback || null })) === true; }
export async function getAllTransactions(): Promise<Transaction[]> { return (await callAdmin<Transaction[]>('get_transactions')) || []; }
export async function updateTransactionStatus(id: string, status: Transaction['status'], verificationNote?: string): Promise<boolean> {
  return (await callAdmin<boolean>('update_transaction', { id, status, verificationNote })) === true;
}
export async function getSystemSettings(key: string): Promise<any> { return await callAdmin<any>('get_system_setting', { key }); }
export async function updateSystemSettings(key: string, value: any): Promise<boolean> { return (await callAdmin<boolean>('update_system_setting', { key, value })) === true; }
export async function getAllAdminSuccessStories(): Promise<SuccessStory[]> { return (await callAdmin<SuccessStory[]>('get_success_stories')) || []; }
export async function addSuccessStory(story: Omit<SuccessStory, 'id'>): Promise<boolean> { return (await callAdmin<boolean>('add_success_story', { story })) === true; }
export async function deleteSuccessStory(id: string): Promise<boolean> { return (await callAdmin<boolean>('delete_success_story', { id })) === true; }

/**
 * Sends a Telegram Bot API message to any chat_id on the admin's behalf.
 * The bot token stays server-only (TELEGRAM_BOT_TOKEN env var) and is never
 * sent to or handled by the browser. Requires the caller to be a verified admin
 * (checked server-side against TELEGRAM_ADMIN_CHAT_IDS).
 */
export async function sendAdminTelegramMessage(chatId: number, message: string, replyMarkup?: any): Promise<boolean> {
  return (await callAdmin<boolean>('send_telegram_message', { chatId, message, replyMarkup })) === true;
}


export async function broadcastAdminTelegramMessage(chatIds: number[], message: string, replyMarkup?: any): Promise<{ delivered: number; failed: number } | null> {
  return await callAdmin<{ delivered: number; failed: number }>('broadcast_telegram_message', { chatIds, message, replyMarkup });
}

export async function getFinancialReconciliationReport(): Promise<any | null> {
  return await callAdmin<any>('get_financial_report', {});
}

export async function getKycReviewQueue(): Promise<any[]> {
  return await callAdmin<any[]>('get_kyc_queue', {}) || [];
}

export async function updateKycReview(id: string, status: 'under_review' | 'verified' | 'rejected' | 'needs_revision', reviewerNote?: string): Promise<boolean> {
  return (await callAdmin<boolean>('update_kyc_review', { reviewId: id, status, reviewerNote })) === true;
}


/**
 * Updates the singleton admin presence record through the verified server gateway.
 * The browser must not write directly to admin_status because that table is read-only for clients.
 */
export async function setAdminPresence(isOnline: boolean): Promise<boolean> {
  return (await callAdmin<boolean>('set_admin_status', { isOnline })) === true;
}
