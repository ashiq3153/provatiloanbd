import { supabase } from './supabase';
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
  | 'delete_chat_message';

async function callAdmin<T>(adminAction: AdminAction, payload: Record<string, unknown> = {}): Promise<T | null> {
  const telegramWebApp = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  const initData = telegramWebApp?.initData;
  if (!initData) {
    console.error('Admin gateway: Telegram initData is missing');
    return null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    console.error('Admin gateway: authenticated session is missing', sessionError);
    return null;
  }

  const response = await fetch('/api/telegram-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, accessToken: sessionData.session.access_token, action: 'admin', adminAction, payload }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error('Admin gateway request failed:', result?.error || response.statusText);
    return null;
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
export async function updateTransactionStatus(id: string, status: Transaction['status']): Promise<boolean> { return (await callAdmin<boolean>('update_transaction', { id, status })) === true; }
export async function getSystemSettings(key: string): Promise<any> { return await callAdmin<any>('get_system_setting', { key }); }
export async function updateSystemSettings(key: string, value: any): Promise<boolean> { return (await callAdmin<boolean>('update_system_setting', { key, value })) === true; }
export async function getAllAdminSuccessStories(): Promise<SuccessStory[]> { return (await callAdmin<SuccessStory[]>('get_success_stories')) || []; }
export async function addSuccessStory(story: Omit<SuccessStory, 'id'>): Promise<boolean> { return (await callAdmin<boolean>('add_success_story', { story })) === true; }
export async function deleteSuccessStory(id: string): Promise<boolean> { return (await callAdmin<boolean>('delete_success_story', { id })) === true; }

export async function getAllChatMessages(): Promise<any[]> { return (await callAdmin<any[]>('get_chat_messages')) || []; }
export async function sendAdminChatMessage(chatId: number, message: string, replyTo?: string | null, attachmentUrl?: string | null): Promise<boolean> {
  return (await callAdmin<boolean>('send_chat_message', { chatId, message, replyTo: replyTo || null, attachmentUrl: attachmentUrl || null })) === true;
}
export async function editChatMessage(id: string, message: string): Promise<boolean> { return (await callAdmin<boolean>('edit_chat_message', { id, message })) === true; }
export async function markChatMessagesSeen(ids: string[]): Promise<boolean> { if (!ids.length) return true; return (await callAdmin<boolean>('mark_chat_seen', { ids })) === true; }
export async function deleteChatMessage(id: string): Promise<boolean> { return (await callAdmin<boolean>('delete_chat_message', { id })) === true; }
