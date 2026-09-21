// ══════════════════════════════════════════════════════════
// Supabase API Service — Centralized DB Operations
// ══════════════════════════════════════════════════════════

import { supabase, ensureSupabaseAuthSession } from './supabase';
import { getTelegramUser } from './telegram';
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
  try {
    // New loan creation is server-verified with Telegram initData. The server
    // derives chat_id from the verified Telegram user, syncs the profile, and
    // inserts only an allowlisted set of loan fields with status=pending.
    // This avoids a browser/RLS session race without weakening RLS policies.
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    if (!initData) throw new Error('Telegram initData is missing');

    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        action: 'loan',
        loanAction: 'submit',
        payload: application,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !result?.data) {
      console.error('submitLoanApplication gateway error:', result?.error || response.statusText);
      return null;
    }
    return result.data as LoanApplication;
  } catch (error) {
    console.error('submitLoanApplication error:', error);
    return null;
  }
}

export async function updateLoanApplication(id: string, application: Partial<LoanApplication>): Promise<LoanApplication | null> {
  try {
    // Revision updates are also Telegram-verified and ownership-scoped on the
    // server, avoiding browser RLS/session failures after action_required.
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    if (!initData) throw new Error('Telegram initData is missing');
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action: 'loan', loanAction: 'update', loanId: id, payload: application }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !result?.data) {
      console.error('updateLoanApplication gateway error:', result?.error || response.statusText);
      return null;
    }
    return result.data as LoanApplication;
  } catch (error) {
    console.error('updateLoanApplication error:', error);
    return null;
  }
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
  try {
    // Duplicate validation is server-side and Telegram-verified so it cannot
    // be affected by the browser's Supabase identity/session race.
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    if (!initData) return null;
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        action: 'loan',
        loanAction: 'check_duplicate',
        payload: { mobile, email, accountNumber, nomineeNid, nidNumber, passportNumber, excludeId },
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      console.error('Duplicate check gateway error:', result?.error || response.statusText);
      return null;
    }
    return result.duplicate || null;
  } catch (error) {
    console.error('Duplicate check error:', error);
    return null;
  }
}

export async function getLoanApplications(_chatId: number): Promise<LoanApplication[]> {
  try {
    // Read through the Telegram-verified server gateway so My Loans does not
    // depend on a stale/mismatched browser Supabase anonymous session.
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    if (!initData) return [];
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action: 'loan', loanAction: 'get_my_loans' }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      console.error('getLoanApplications gateway error:', result?.error || response.statusText);
      return [];
    }
    return (result.data || []) as LoanApplication[];
  } catch (error) {
    console.error('getLoanApplications error:', error);
    return [];
  }
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

export async function getLoanEmiSchedule(loanId: string): Promise<import('../types/database').LoanEmiSchedule[]> {
  const { data, error } = await supabase
    .from('loan_emi_schedule')
    .select('*')
    .eq('loan_id', loanId)
    .order('installment_no', { ascending: true });

  if (error) {
    console.error('getLoanEmiSchedule error:', error);
    return [];
  }
  return (data || []) as import('../types/database').LoanEmiSchedule[];
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

export async function getTransactions(_chatId: number): Promise<Transaction[]> {
  try {
    // Use the same Telegram-verified gateway for transaction history.
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    if (!initData) return [];
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action: 'transaction', transactionAction: 'get_my_transactions' }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      console.error('getTransactions gateway error:', result?.error || response.statusText);
      return [];
    }
    return (result.data || []) as Transaction[];
  } catch (error) {
    console.error('getTransactions error:', error);
    return [];
  }
}

export async function createTransaction(txn: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
  try {
    // Financial transaction creation is Telegram-verified server-side. The
    // server derives chat_id from initData and always forces status=pending.
    // This avoids browser RLS/session mismatches and prevents client-side
    // spoofing of another user's chat_id or completed transaction status.
    // @ts-ignore
    const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
    if (!initData) throw new Error('Telegram initData is missing');
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action: 'transaction', transactionAction: 'create', payload: txn }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !result?.data) {
      console.error('createTransaction gateway error:', result?.error || response.statusText);
      return null;
    }
    return result.data as Transaction;
  } catch (error) {
    console.error('createTransaction error:', error);
    return null;
  }
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

  const prepareResponse = await fetch('/api/telegram-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initData,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  const prepared = await prepareResponse.json().catch(() => null);
  if (!prepareResponse.ok || !prepared?.ok || !prepared?.path || !prepared?.token) {
    throw new Error(prepared?.error || 'Could not prepare file upload');
  }

  const { error: uploadError } = await supabase.storage
    .from('loan_documents')
    .uploadToSignedUrl(prepared.path, prepared.token, file, {
      contentType: file.type,
    });

  if (uploadError) {
    console.error('signed document upload error:', uploadError);
    throw new Error(uploadError.message || 'File upload failed');
  }

  const urlResponse = await fetch('/api/telegram-document-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, path: prepared.path }),
  });

  const urlResult = await urlResponse.json().catch(() => null);
  if (!urlResponse.ok || !urlResult?.ok || !urlResult?.url) {
    throw new Error(urlResult?.error || 'Could not create file URL');
  }

  return urlResult.url;
}

export async function uploadDocument(file: File, _userId: number, _docType: string): Promise<string | null> {
  try {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File is too large. Maximum size is 10 MB.');
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
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File is too large. Maximum size is 10 MB.');
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

export async function getMyNotifications(): Promise<any[]> {
  const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
  const user = getTelegramUser();
  const response = await fetch('/api/telegram-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, action: 'user', userAction: 'get_notifications', payload: { chatId: user.id } }),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok ? (result.data || []) : [];
}

export async function markMyNotificationRead(id: string): Promise<boolean> {
  const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
  const user = getTelegramUser();
  const response = await fetch('/api/telegram-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, action: 'user', userAction: 'mark_notification_read', payload: { id, chatId: user.id } }),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok && result.data === true;
}

export async function getMyKycReviews(): Promise<any[]> {
  const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
  const user = getTelegramUser();
  const response = await fetch('/api/telegram-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, action: 'user', userAction: 'get_kyc_reviews', payload: { chatId: user.id } }),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok ? (result.data || []) : [];
}
