// ══════════════════════════════════════════════════════════
// Database TypeScript Types — matches Supabase schema
// ══════════════════════════════════════════════════════════

export interface Profile {
  chat_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  phone: string | null;
  address: string | null;
  nid_number: string | null;
  is_banned: boolean;
  created_at: string;
}

export interface LoanApplication {
  id: string;
  chat_id: number;
  // Loan config
  loan_category: string;
  amount: number;
  tenure_months: number;
  interest_rate: number;
  emi_amount: number;
  processing_fee: number;
  security_deposit: number;
  // Personal info
  full_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  mobile: string;
  whatsapp: string | null;
  email: string | null;
  current_address: string;
  permanent_address: string;
  nid_number: string;
  // Professional info (varies by category)
  professional_info: Record<string, string> | null;
  // Documents
  documents: Record<string, string> | null;
  // Bank info
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string | null;
  mobile_banking: string | null;
  // Nominee info
  nominee_name: string;
  nominee_relation: string;
  nominee_mobile: string;
  nominee_nid: string;
  // Status
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'active' | 'completed' | 'action_required';
  admin_feedback: string | null;
  applied_at: string;
  approved_at: string | null;
}

export interface Transaction {
  id: string;
  chat_id: number;
  loan_id: string | null;
  type: 'deposit' | 'withdraw' | 'emi_payment' | 'disbursement';
  deposit_type: string | null; // 'processing_fee' | 'security_deposit'
  amount: number;
  payment_method: string | null;
  sender_number: string | null;
  trx_id: string | null;
  screenshot_url: string | null;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface SuccessStory {
  id: string;
  name: string;
  avatar_url: string | null;
  loan_type: string | null;
  amount: number | null;
  approval_time: string | null;
  rating: number;
  is_verified: boolean;
  like_count?: number;
  dislike_count?: number;
  love_count?: number;
  loveit_count?: number;
  congratulation_count?: number;
  wow_count?: number;
  sad_count?: number;
  hundred_count?: number;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { chat_id: number; first_name: string };
        Update: Partial<Profile>;
      };
      loan_applications: {
        Row: LoanApplication;
        Insert: Omit<LoanApplication, 'id' | 'applied_at' | 'approved_at' | 'admin_feedback' | 'status'> & { status?: string };
        Update: Partial<LoanApplication>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Transaction>;
      };
      success_stories: {
        Row: SuccessStory;
        Insert: Omit<SuccessStory, 'id'>;
        Update: Partial<SuccessStory>;
      };
    };
  };
}
