import { supabase } from './supabase';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../types/database';

// Helper for admin APIs. Assumes RLS policies allow these operations or service role is used.
// (In a real app, you would use a service role key for admin operations, or proper RLS rules where is_admin = true)

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
  // we delete transactions and loan applications first to be safe, then the profile.
  await supabase.from('transactions').delete().eq('chat_id', chatId);
  await supabase.from('loan_applications').delete().eq('chat_id', chatId);
  
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
    // 1. Fetch loan details first to get chat_id and amount
    const { data: loan, error: fetchError } = await supabase
      .from('loan_applications')
      .select('chat_id, amount, id, loan_category, account_number')
      .eq('id', id)
      .single();
    
    if (fetchError || !loan) {
      console.error('Error fetching loan for disbursement:', fetchError);
      return false;
    }

    // 2. Update status of loan
    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({ status, admin_feedback: feedback, approved_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('updateLoanApplicationStatus error:', updateError);
      return false;
    }

    // 3. Check if a disbursement transaction already exists for this loan
    const { data: existingTxn, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('loan_id', loan.id)
      .eq('type', 'disbursement')
      .maybeSingle();

    if (!checkError && !existingTxn) {
      // 4. Create completed disbursement transaction to credit the user's balance
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
          chat_id: loan.chat_id,
          loan_id: loan.id,
          type: 'disbursement',
          deposit_type: null,
          amount: loan.amount,
          payment_method: 'bank',
          sender_number: loan.account_number,
          trx_id: `DISB-${loan.id.slice(0, 8).toUpperCase()}`,
          screenshot_url: null,
          status: 'completed'
        });

      if (txnError) {
        console.error('Error creating disbursement transaction:', txnError);
      }
    }
    return true;
  } else {
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
