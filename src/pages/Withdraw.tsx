import { ArrowUpFromLine, AlertCircle, X, CheckCircle, Landmark, Smartphone, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency } from '../lib/translation';
import { getTelegramUser } from '../lib/telegram';
import { getDepositStatus, createTransaction, getDashboardStats, getActiveLoans } from '../lib/api';
import type { DepositStatus } from '../lib/api';
import type { LoanApplication } from '../types/database';

export default function Withdraw() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);

  const [bankAccount, setBankAccount] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newRoutingNumber, setNewRoutingNumber] = useState('');

  useEffect(() => {
    const savedBank = localStorage.getItem('provati_user_bank');
    if (savedBank) {
      try {
        setBankAccount(JSON.parse(savedBank));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newAccountName || !newAccountNumber) {
      toast.error(isBn ? 'অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required details');
      return;
    }
    const newAcc = {
      bankName: newBankName,
      accountName: newAccountName,
      accountNumber: newAccountNumber,
      routingNumber: newRoutingNumber || undefined
    };
    localStorage.setItem('provati_user_bank', JSON.stringify(newAcc));
    setBankAccount(newAcc);
    setShowAddForm(false);
    toast.success(isBn ? 'ব্যাংক একাউন্ট সফলভাবে সংরক্ষিত হয়েছে' : 'Bank account saved successfully');
  };

  const deleteBankAccount = () => {
    localStorage.removeItem('provati_user_bank');
    setBankAccount(null);
    setNewBankName('');
    setNewAccountName('');
    setNewAccountNumber('');
    setNewRoutingNumber('');
    toast.success(isBn ? 'ব্যাংক একাউন্ট ডিলিট করা হয়েছে' : 'Bank account deleted');
  };

  // Real deposit status from Supabase
  const [depositStatus, setDepositStatus] = useState<DepositStatus>({
    processingFee: false,
    securityDeposit: false,
    processingFeeAmount: 0,
    securityDepositAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depStatus, stats, activeLoans] = await Promise.all([
          getDepositStatus(user.id),
          getDashboardStats(user.id),
          getActiveLoans(user.id),
        ]);
        setDepositStatus(depStatus);
        setAvailableBalance(stats.totalBalance);
        if (activeLoans.length > 0) {
          setActiveLoan(activeLoans[0]);
        }
      } catch (err) {
        console.error('Error fetching withdrawal details:', err);
      }
    };
    fetchData();
  }, [user.id]);

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(isBn ? 'সঠিক পরিমাণ লিখুন' : 'Enter a valid amount');
      return;
    }

    if (Number(amount) > availableBalance) {
      toast.error(isBn ? 'অপর্যাপ্ত ব্যালেন্স' : 'Insufficient balance');
      return;
    }

    if (!bankAccount) {
      toast.error(isBn ? 'অনুগ্রহ করে ব্যাংক একাউন্ট যুক্ত করুন' : 'Please add a bank account first');
      return;
    }

    // Check if processing fee and security deposit are completed
    if (!depositStatus.processingFee || !depositStatus.securityDeposit) {
      setShowDepositModal(true);
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading(isBn ? 'প্রসেস করা হচ্ছে...' : 'Processing...');
    
    try {
      const result = await createTransaction({
        chat_id: user.id,
        loan_id: null,
        type: 'withdraw',
        deposit_type: null,
        amount: Number(amount),
        payment_method: 'bank',
        sender_number: bankAccount.accountNumber,
        trx_id: `${bankAccount.bankName} - ${bankAccount.accountName}${bankAccount.routingNumber ? ` (Routing: ${bankAccount.routingNumber})` : ''}`,
        screenshot_url: null,
        status: 'pending',
      });

      if (result) {
        toast.success(isBn ? 'উত্তোলন রিকুয়েস্ট সফল হয়েছে!' : 'Withdrawal request successful!', { id: loadingId });
        navigate('/transactions');
      } else {
        toast.error(isBn ? 'সমস্যা হয়েছে' : 'Something went wrong', { id: loadingId });
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      toast.error(isBn ? 'সার্ভার সমস্যা' : 'Server error', { id: loadingId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen neu-bg flex flex-col relative transition-colors pb-10">
      {/* Premium Header */}
      <div className="neu-bg px-5 py-4 sticky top-0 z-30 shadow-md border-b border-white/20 dark:border-white/5 transition-colors flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
        >
          <ArrowUpFromLine size={20} className="-rotate-90" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'অর্থ উত্তোলন' : 'Withdraw Funds'}
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
            {isBn ? 'নিরাপদ ট্রান্সফার' : 'Secure Transfer'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">
        
        {/* Available Balance Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="neu-raised rounded-[24px] p-6 relative overflow-hidden transition-colors text-center"
        >
          <div className="w-16 h-16 neu-sunken rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 transition-colors shadow-inner text-primary-600 dark:text-primary-400">
            <ArrowUpFromLine size={28} />
          </div>
          <h2 className="text-gray-500 dark:text-gray-400 font-semibold text-sm relative z-10 transition-colors uppercase tracking-wider mb-1">
            {isBn ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Available to Withdraw'}
          </h2>
          <p className="text-4xl font-black text-gray-900 dark:text-white mt-1 relative z-10 transition-colors drop-shadow-md">
            {formatCurrency(availableBalance, isBn)}
          </p>
        </motion.div>

        {/* Withdraw Amount */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="neu-raised rounded-[24px] p-6 transition-colors"
        >
          <div className="mb-4 flex items-center justify-between">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
              {isBn ? 'উত্তোলনের পরিমাণ' : 'Withdraw Amount'}
            </label>
            <button 
              onClick={() => setAmount(availableBalance.toString())}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 neu-btn px-3 py-1.5 rounded-full active:scale-95 transition-all"
            >
              {isBn ? 'সম্পূর্ণ' : 'MAX'}
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">৳</span>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              className="w-full pl-12 pr-4 py-4 neu-input rounded-full outline-none font-black text-2xl text-gray-900 dark:text-white transition-all" 
            />
          </div>
        </motion.div>

        {/* Destination Selection */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="neu-raised rounded-[24px] p-6 transition-colors"
        >
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 transition-colors">
            {isBn ? 'মাধ্যম নির্বাচন করুন' : 'Select Destination'}
          </label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button className="neu-sunken text-primary-600 dark:text-primary-400 p-4 rounded-[20px] font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10 pointer-events-none"></div>
              <Landmark size={24} />
              <span>{isBn ? 'ব্যাংক একাউন্ট' : 'Bank Account'}</span>
            </button>
            <button className="neu-raised-sm text-gray-400 dark:text-gray-600 p-4 rounded-[20px] font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 opacity-55 cursor-not-allowed">
              <Smartphone size={24} />
              <span>{isBn ? 'মোবাইল অ্যাপ' : 'Mobile App'}</span>
            </button>
          </div>
          
          <div className="pt-4 border-t border-white/20 dark:border-white/5 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 transition-colors">
                {isBn ? 'সেভ করা একাউন্ট' : 'Saved Account'}
              </p>
              {bankAccount && (
                <button 
                  onClick={deleteBankAccount}
                  className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400/80 dark:hover:text-red-400 flex items-center gap-1 neu-btn px-3 py-1 rounded-full active:scale-95 transition-all"
                >
                  <Trash2 size={13} /> {isBn ? 'মুছে ফেলুন' : 'Delete'}
                </button>
              )}
            </div>

            {bankAccount ? (
              <div className="flex items-center justify-between neu-sunken p-4 px-6 rounded-full transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 neu-raised-sm rounded-full flex items-center justify-center transition-colors">
                    <Landmark className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm transition-colors">{bankAccount.bankName}</p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5">{bankAccount.accountName} • {bankAccount.accountNumber}</p>
                    {bankAccount.routingNumber && (
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5">{isBn ? 'রাউটিং' : 'Routing'}: {bankAccount.routingNumber}</p>
                    )}
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <CheckCircle size={14} className="text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            ) : showAddForm ? (
              <form onSubmit={saveBankAccount} className="space-y-3 neu-sunken p-4 rounded-2xl transition-all">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{isBn ? 'ব্যাংকের নাম *' : 'Bank Name *'}</label>
                  <input 
                    type="text" 
                    required 
                    value={newBankName} 
                    onChange={e => setNewBankName(e.target.value)} 
                    placeholder={isBn ? 'যেমন: ইসলামী ব্যাংক' : 'e.g. Islami Bank'}
                    className="w-full neu-input rounded-full px-4 py-2 text-xs font-bold text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{isBn ? 'একাউন্টের নাম *' : 'Account Name *'}</label>
                  <input 
                    type="text" 
                    required 
                    value={newAccountName} 
                    onChange={e => setNewAccountName(e.target.value)} 
                    placeholder={isBn ? 'যেমন: আরিফ হোসেন' : 'e.g. Arif Hossain'}
                    className="w-full neu-input rounded-full px-4 py-2 text-xs font-bold text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{isBn ? 'একাউন্ট নম্বর *' : 'Account Number *'}</label>
                  <input 
                    type="text" 
                    required 
                    value={newAccountNumber} 
                    onChange={e => setNewAccountNumber(e.target.value)} 
                    placeholder="1234567890"
                    className="w-full neu-input rounded-full px-4 py-2 text-xs font-mono text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{isBn ? 'রাউটিং নম্বর (ঐচ্ছিক)' : 'Routing Number (Optional)'}</label>
                  <input 
                    type="text" 
                    value={newRoutingNumber} 
                    onChange={e => setNewRoutingNumber(e.target.value)} 
                    placeholder="123456"
                    className="w-full neu-input rounded-full px-4 py-2 text-xs font-mono text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="flex-1 py-2 rounded-full text-xs font-bold neu-btn text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 rounded-full text-xs font-bold neu-btn-primary text-white transition-colors"
                  >
                    {isBn ? 'সেভ করুন' : 'Save Account'}
                  </button>
                </div>
              </form>
            ) : (
              <button 
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent rounded-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-500/50 dark:hover:border-primary-500/50 active:scale-[0.98] transition-all neu-raised-sm"
              >
                <Plus size={16} />
                {isBn ? 'ব্যাংক একাউন্ট যুক্ত করুন' : 'Add Bank Account'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Warning Note */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.3 }}
          className="neu-sunken p-4 rounded-2xl text-sm text-orange-800 dark:text-orange-300 flex gap-3 border border-orange-500/20 transition-colors"
        >
          <AlertCircle className="shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" size={20} />
          <p className="font-medium leading-relaxed text-xs">
            {isBn 
              ? 'উত্তোলন প্রক্রিয়া সাধারণত ২৪ ঘণ্টার মধ্যে সম্পন্ন হয়। নিশ্চিত করুন আপনার সক্রিয় লোনের জন্য কোনো ডিপোজিট বকেয়া নেই।'
              : 'Withdrawals are processed within 24 hours. Ensure your deposit requirements for active loans are met before proceeding.'}
          </p>
        </motion.div>

        <button 
          onClick={handleWithdraw} 
          disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > availableBalance} 
          className="w-full mt-2 neu-btn-primary disabled:opacity-50 disabled:active:scale-100 text-white py-4 rounded-full font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              {isBn ? 'নিশ্চিত করুন' : 'Confirm Withdrawal'}
              <ArrowRight size={20} />
            </>
          )}
        </button>

      </div>

      {/* Deposit Requirements Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="neu-raised rounded-[32px] p-6 max-w-sm w-full mx-4 border-0 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isBn ? 'ডিপোজিট প্রয়োজন' : 'Deposit Required'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="w-8 h-8 flex items-center justify-center neu-btn text-gray-500 rounded-full active:scale-95 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 mb-8 relative z-10">
                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm leading-relaxed">
                  {isBn
                    ? 'উত্তোলন করার আগে নিচের ডিপোজিটগুলো সম্পূর্ণ করুন:'
                    : 'Complete the following deposits before withdrawing:'}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 neu-sunken rounded-[16px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${depositStatus.processingFee ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                        {depositStatus.processingFee ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {isBn ? 'প্রসেসিং ফি' : 'Processing Fee'}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatCurrency(activeLoan?.processing_fee ?? 1250, isBn)}
                        </p>
                      </div>
                    </div>
                    <span className={depositStatus.processingFee ? 'neu-badge-green px-2.5 py-1 text-[10px] rounded-full font-bold' : 'neu-badge-orange px-2.5 py-1 text-[10px] rounded-full font-bold'}>
                      {depositStatus.processingFee ? (isBn ? 'সম্পন্ন' : 'Completed') : (isBn ? 'বকেয়া' : 'Pending')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 neu-sunken rounded-[16px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${depositStatus.securityDeposit ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                        {depositStatus.securityDeposit ? <CheckCircle size={20} /> : <X size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {isBn ? 'সিকিউরিটি ডিপোজিট' : 'Security Deposit'}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatCurrency(activeLoan?.security_deposit ?? 41600, isBn)}
                        </p>
                      </div>
                    </div>
                    <span className={depositStatus.securityDeposit ? 'neu-badge-green px-2.5 py-1 text-[10px] rounded-full font-bold' : 'neu-badge-red px-2.5 py-1 text-[10px] rounded-full font-bold'}>
                      {depositStatus.securityDeposit ? (isBn ? 'সম্পন্ন' : 'Completed') : (isBn ? 'বকেয়া' : 'Pending')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-4 neu-btn text-gray-700 dark:text-gray-300 rounded-full font-bold active:scale-95 transition-all"
                >
                  {isBn ? 'পরে করব' : 'Later'}
                </button>
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    navigate('/deposit');
                  }}
                  className="flex-1 py-4 neu-btn-primary text-white rounded-full font-bold active:scale-95 transition-all"
                >
                  {isBn ? 'ডিপোজিট করুন' : 'Deposit Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
