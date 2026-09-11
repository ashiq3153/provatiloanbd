import { supabase } from './supabase';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../types/database';

// Admin authorization is enforced separately. These client helpers must not be
// treated as an authorization boundary; the database/server must enforce it.

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) console.error('getAllProfiles error:', error);
  return data || [];
}

export async function banUser(chatId: number, isBanned: boolean): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ is_banned: isBanned }).eq('chat_id', chatId);
  if (error) {
    console.error('banUser error:', error);
    return false;
  }
  return true;
}

export async function lockUser(chatId: number, isLocked: boolean, reason?: string | null): Promise<boolean> {
  const updateData: any = { is_locked: isLocked };
  if (isLocked && reason) updateData.lock_reason = reason;
  if (!isLocked) updateData.lock_reason = null;

  const { error } = await supabase.from('profiles').update(updateData).eq('chat_id', chatId);
  if (error) {
    console.error('lockUser error:', error);
    return false;
  }
  return true;
}

export async function deleteUser(chatId: number): Promise<boolean> {
  // Since we don't have cascade delete set up in foreign keys for all tables maybe,
  // we delete transactions, loan applications, and support messages first to be safe, then the profile.
  await supabase.from('transactions').delete().eq('chat_id', chatId);
  await supabase.from('loan_applications').delete().eq('chat_id', chatId);
  await supabase.from('support_messages').delete().eq('chat_id', chatId);

  const { error } = await supabase.from('profiles').delete().eq('chat_id', chatId);
  if (error) {
    console.error('deleteUser error:', error);
    return false;
  }
  return true;
}

export async function getAllLoanApplications(): Promise<LoanApplication[]> {
  const { data, error } = await supabase.from('loan_applications').select('*').order('applied_at', { ascending: false });
  if (error) console.error('getAllLoanApplications error:', error);
  return data || [];
}

export async function updateLoanApplicationStatus(id: string, status: LoanApplication['status'], feedback?: string): Promise<boolean> {
  if (status === 'approved') {
    // Approval + disbursement must be atomic. The database function locks the
    // loan row, updates it, and creates the completed disbursement as one unit.
    const { error } = await supabase.rpc('approve_loan_atomic', {
      p_loan_id: id,
      p_feedback: feedback || null,
    });

    if (error) {
      console.error('approve_loan_atomic error:', error);
      return false;
    }
    return true;
  }

  // Standard update for non-approved statuses
  const { error } = await supabase
    .from('loan_applications')
    .update({ status, admin_feedback: feedback, approved_at: null })
    .eq('id', id);
  if (error) {
    console.error('updateLoanApplicationStatus error:', error);
    return false;
  }
  return true;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  if (error) console.error('getAllTransactions error:', error);
  return data || [];
}

export async function updateTransactionStatus(id: string, status: Transaction['status']): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id);
  if (error) {
    console.error('updateTransactionStatus error:', error);
    return false;
  }
  return true;
}

export async function getSystemSettings(key: string): Promise<any> {
  const { data, error } = await supabase.from('system_settings').select('value').eq('key', key).single();
  if (error) {
    console.error('getSystemSettings error:', error);
    return null;
  }
  return data?.value || null;
}

export async function updateSystemSettings(key: string, value: any): Promise<boolean> {
  // Try to update first
  const { data: existing } = await supabase.from('system_settings').select('id').eq('key', key).single();

  if (existing) {
    const { error } = await supabase.from('system_settings').update({ value }).eq('key', key);
    if (error) {
      console.error('updateSystemSettings error:', error);
      return false;
    }
  } else {
    const { error } = await supabase.from('system_settings').insert([{ key, value }]);
    if (error) {
      console.error('insertSystemSettings error:', error);
      return false;
    }
  }
  return true;
}

export async function getAllAdminSuccessStories(): Promise<SuccessStory[]> {
  const { data, error } = await supabase.from('success_stories').select('*').order('rating', { ascending: false });
  if (error) console.error('getAllAdminSuccessStories error:', error);
  return data || [];
}

export async function addSuccessStory(story: Omit<SuccessStory, 'id'>): Promise<boolean> {
  const { error } = await supabase.from('success_stories').insert([story]);
  if (error) {
    console.error('addSuccessStory error:', error);
    return false;
  }
  return true;
}

export async function deleteSuccessStory(id: string): Promise<boolean> {
  const { error } = await supabase.from('success_stories').delete().eq('id', id);
  if (error) {
    console.error('deleteSuccessStory error:', error);
    return false;
  }
  return true;
}
