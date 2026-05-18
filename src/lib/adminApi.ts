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
  const { error } = await supabase
    .from('loan_applications')
    .update({ status, admin_feedback: feedback, approved_at: status === 'approved' ? new Date().toISOString() : null })
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
