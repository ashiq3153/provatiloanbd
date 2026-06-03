// ══════════════════════════════════════════════════════════
// Supabase API Service — Centralized DB Operations
// ══════════════════════════════════════════════════════════

import { supabase } from './supabase';
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

// ── Document Upload API ──────────────────────────────────

export async function uploadDocument(file: File, userId: number, docType: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${docType}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('loan_documents')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('uploadDocument error:', error);
    return null;
  }

  const { data } = supabase.storage.from('loan_documents').getPublicUrl(filePath);
  return data.publicUrl;
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
  const [transactions, loans] = await Promise.all([
    getTransactions(chatId),
    getLoanApplications(chatId),
  ]);

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'approved');
  const pendingApplications = loans.filter(l => l.status === 'pending');

  // 1. Calculate approved loan amount
  const approvedLoanAmount = activeLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  // 2. Calculate savings balance (completed security_deposit transactions)
  const savingsBalance = transactions
    .filter(t => t.type === 'deposit' && t.deposit_type === 'security_deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 3. Calculate deposit balance (completed deposits: processing fees, security deposits, other deposits)
  const depositBalance = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 4. Calculate withdraw balance (completed withdrawals)
  const withdrawBalance = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 5. Calculate total withdrawn loan amount (both completed and pending withdrawals to reduce available balance)
  const totalWithdrawnLoanAmount = transactions
    .filter(t => t.type === 'withdraw' && (t.status === 'completed' || t.status === 'pending'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 6. Calculate total balance (available for withdrawal)
  const totalBalance = Math.max(0, approvedLoanAmount - totalWithdrawnLoanAmount);
  
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  return {
    totalBalance,
    depositBalance,
    withdrawBalance,
    savingsBalance,
    activeLoansCount: activeLoans.length,
    pendingApplications: pendingApplications.length,
    totalOutstanding,
  };
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
    t => t.deposit_type === 'processing_fee' && t.status === 'completed'
  );
  const securityDeposit = transactions.find(
    t => t.deposit_type === 'security_deposit' && t.status === 'completed'
  );

  const processingFeeAmount = transactions
    .filter(t => t.deposit_type === 'processing_fee' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const securityDepositAmount = transactions
    .filter(t => t.deposit_type === 'security_deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    processingFee: !!processingFeeDeposit,
    securityDeposit: !!securityDeposit,
    processingFeeAmount,
    securityDepositAmount,
  };
}
