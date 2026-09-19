// ══════════════════════════════════════════════════════════
// Supabase API Service — Centralized DB Operations
// ══════════════════════════════════════════════════════════

import { supabase, ensureSupabaseAuthSession } from './supabase';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../types/database';

// ── Profile APIs ─────────────────────────────────────────

export async function getProfile(chatId: number): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('chat_id', chatId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getProfile error:', error);
  }
  return data;
}

export async function upsertProfile(profile: Partial<Profile> & { chat_id: number; first_name: string }): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'chat_id' })
    .select()
    .single();

  if (error) {
    console.error('upsertProfile error:', error);
    return null;
  }
  return data;
}

// ── Loan Application APIs ────────────────────────────────

export async function submitLoanApplication(application: Omit<LoanApplication, 'id' | 'applied_at' | 'approved_at' | 'admin_feedback' | 'status'>): Promise<LoanApplication | null> {
  const { data, error } = await supabase
    .from('loan_applications')
    .insert({
      ...application,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('submitLoanApplication error:', error);
    return null;
  }
  return data;
}

export async function updateLoanApplication(id: string, application: Partial<LoanApplication>): Promise<LoanApplication | null> {
  const { data, error } = await supabase
    .from('loan_applications')
    .update({ ...application, status: 'pending' }) // Reset to pending after update
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateLoanApplication error:', error);
    return null;
  }
  return data;
}

export async function checkDuplicateApplication(
  mobile: string,
  email: string | null,
  accountNumber: string,
  nomineeNid: string,
  nidNumber: string,
  passportNumber: string | null,
  excludeId?: string | null
): Promise<string | null> {
  let query = supabase.from('loan_applications').select('id, mobile, email, account_number, nominee_nid, nid_number, professional_info');
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  query = query.neq('status', 'rejected').neq('status', 'cancelled').neq('status', 'completed');
  
  const orConditions = [
    `mobile.eq.${mobile}`,
    `account_number.eq.${accountNumber}`,
    `nominee_nid.eq.${nomineeNid}`,
    `nid_number.eq.${nidNumber}`
  ];
  if (email) orConditions.push(`email.eq.${email}`);
  if (passportNumber) orConditions.push(`professional_info->>passportNumber.eq.${passportNumber}`);
  
  query = query.or(orConditions.join(','));
  
  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;

  const duplicate = data[0];
  if (duplicate.mobile === mobile) return 'Mobile Number';
  if (email && duplicate.email === email) return 'Email Address';
  if (duplicate.account_number === accountNumber) return 'Bank Account Number';
  if (duplicate.nid_number === nidNumber) return 'NID Number';
  if (duplicate.nominee_nid === nomineeNid) return 'Nominee NID';
  if (passportNumber && duplicate.professional_info && (duplicate.professional_info as any).passportNumber === passportNumber) return 'Passport Number';
  
  return 'Information';
}

export async function getLoanApplications(chatId: number): Promise<LoanApplication[]> {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('chat_id', chatId)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('getLoanApplications error:', error);
    return [];
  }
  return data || [];
}

export async function getLoanApplicationById(applicationId: string): Promise<LoanApplication | null> {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error) {
    console.error('getLoanApplicationById error:', error);
    return null;
  }
  return data;
}

export async function getActiveLoans(chatId: number): Promise<LoanApplication[]> {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('chat_id', chatId)
    .in('status', ['active', 'approved'])
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('getActiveLoans error:', error);
    return [];
  }
  return data || [];
}

// ── Transaction APIs ─────────────────────────────────────

export async function getTransactions(chatId: number): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getTransactions error:', error);
    return [];
  }
  return data || [];
}

export async function createTransaction(txn: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(txn)
    .select()
    .single();

  if (error) {
    console.error('createTransaction error:', error);
    return null;
  }
  return data;
}

// ── Success Stories API ──────────────────────────────────

export async function getSuccessStories(): Promise<SuccessStory[]> {
  const { data, error } = await supabase
    .from('success_stories')
    .select('*')
    .order('rating', { ascending: false });

  if (error) {
    console.error('getSuccessStories error:', error);
    return [];
  }
  return data || [];
}

export async function reactToSuccessStory(storyId: string, reactionType: string): Promise<boolean> {
  const { data, error: fetchError } = await supabase
    .from('success_stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (fetchError || !data) {
    console.error('reactToSuccessStory fetch error:', fetchError);
    return false;
  }

  const column = `${reactionType}_count`;
  const currentCount = (data as any)[column] || 0;

  const { error: updateError } = await supabase
    .from('success_stories')
    .update({ [column]: currentCount + 1 })
    .eq('id', storyId);

  if (updateError) {
    console.error('reactToSuccessStory update error:', updateError);
    return false;
  }

  return true;
}

// ── Document Upload API ──────────────────────────────────

async function uploadViaTelegramServer(file: File): Promise<string | null> {
  // @ts-ignore
  const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
  if (!initData) throw new Error('Telegram initData is missing');

  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      const comma = value.indexOf(',');
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

  const response = await fetch('/api/telegram-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initData,
      fileName: file.name,
      contentType: file.type,
      fileBase64,
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok || !result?.url) {
    throw new Error(result?.error || 'File upload failed');
  }
  return result.url;
}

export async function uploadDocument(file: File, _userId: number, _docType: string): Promise<string | null> {
  try {
    if (file.size > 3 * 1024 * 1024) {
      throw new Error('File is too large. Maximum size is 3 MB.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      throw new Error('Unsupported file type');
    }
    return await uploadViaTelegramServer(file);
  } catch (error) {
    console.error('uploadDocument error:', error);
    return null;
  }
}

export async function uploadSupportAttachment(file: File, _userId: number): Promise<string | null> {
  try {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('File is too large. Maximum size is 4 MB.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      throw new Error('Unsupported file type');
    }
    return await uploadViaTelegramServer(file);
  } catch (error) {
    console.error('uploadSupportAttachment error:', error);
    return null;
  }
}

// ── Dashboard Stats ──────────────────────────────────────

export interface DashboardStats {
  totalBalance: number;
  depositBalance: number;
  withdrawBalance: number;
  savingsBalance: number;
  activeLoansCount: number;
  pendingApplications: number;
  totalOutstanding: number;
}

export async function getDashboardStats(chatId: number): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats', { p_chat_id: chatId });
  if (error || !data) {
    console.error('getDashboardStats error:', error);
    return { totalBalance: 0, depositBalance: 0, withdrawBalance: 0, savingsBalance: 0, activeLoansCount: 0, pendingApplications: 0, totalOutstanding: 0 };
  }
  return data as DashboardStats;
}

// ── Deposit Status Check ─────────────────────────────────

export interface DepositStatus {
  processingFee: boolean;
  securityDeposit: boolean;
  processingFeeAmount: number;
  securityDepositAmount: number;
}

export async function getDepositStatus(chatId: number): Promise<DepositStatus> {
  const transactions = await getTransactions(chatId);

  const processingFeeDeposit = transactions.find(
    t => t.deposit_type?.includes('processing_fee') && t.status === 'completed'
  );
  const securityDeposit = transactions.find(
    t => t.deposit_type?.includes('security_deposit') && t.status === 'completed'
  );

  const processingFeeAmount = transactions
    .filter(t => t.deposit_type?.includes('processing_fee') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const securityDepositAmount = transactions
    .filter(t => t.deposit_type?.includes('security_deposit') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    processingFee: !!processingFeeDeposit,
    securityDeposit: !!securityDeposit,
    processingFeeAmount,
    securityDepositAmount,
  };
}


// ── Public System Settings (safe for any user) ───────────
// NOTE: system_settings no longer stores secrets (bot tokens / API keys live in
// server-only env vars), so a direct RLS-scoped read here is safe for any
// authenticated user. Admin editing still goes through the admin gateway in
// adminApi.ts so writes stay server-verified.
export async function getPublicSettings(key: string): Promise<any> {
  const { data, error } = await supabase.from('system_settings').select('value').eq('key', key).single();
  if (error) {
    console.error('getPublicSettings error:', error);
    return null;
  }
  return data?.value || null;
}

// ── Support Chat (user-side) ─────────────────────────────
// Reading/sending your own messages already works under RLS (chat_id must equal
// the caller's own bridged Telegram chat_id). There is no UPDATE policy on
// support_messages though, so marking admin messages as "seen" must go through
// the server-side chat gateway, which uses the service role.
async function callChatGateway<T>(chatAction: string, payload: Record<string, unknown> = {}): Promise<T | null> {
  // @ts-ignore
  const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
  if (!initData) {
    console.error('Chat gateway: Telegram initData is missing');
    return null;
  }
  const response = await fetch('/api/telegram-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, action: 'chat', chatAction, payload }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error('Chat gateway request failed:', result?.error || response.statusText);
    return null;
  }
  return result.data as T;
}

export async function markMyChatMessagesSeen(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  return (await callChatGateway<boolean>('mark_seen', { ids })) === true;
}
