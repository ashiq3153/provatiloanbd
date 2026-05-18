import { ArrowUpFromLine, AlertCircle, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { getTelegramUser } from '../lib/telegram';
import { getDepositStatus, createTransaction, getDashboardStats } from '../lib/api';
import type { DepositStatus } from '../lib/api';

export default function Withdraw() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Real deposit status from Supabase
  const [depositStatus, setDepositStatus] = useState<DepositStatus>({
    processingFee: false,
    securityDeposit: false,
    processingFeeAmount: 0,
    securityDepositAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [depStatus, stats] = await Promise.all([
        getDepositStatus(user.id),
        getDashboardStats(user.id),
      ]);
      setDepositStatus(depStatus);
      setAvailableBalance(stats.totalBalance);
    };
    fetchData();
  }, [user.id]);

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(isBn ? 'সঠিক পরিমাণ লিখুন' : 'Enter a valid amount');
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
        sender_number: null,
        trx_id: null,
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
    <div className="pt-2 p-5 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-sm active:scale-95 border border-gray-100 dark:border-gray-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
          {isBn ? 'অর্থ উত্তোলন' : 'Withdraw Funds'}
        </h1>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 text-center relative overflow-hidden transition-colors">
         <div className="absolute top-0 right-0 p-4 opacity-5 bg-orange-500 w-32 h-32 rounded-bl-full -mr-8 -mt-8"></div>
         <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 transition-colors">
           <ArrowUpFromLine size={32} />
         </div>
         <h2 className="text-gray-500 dark:text-gray-400 font-medium text-sm relative z-10 transition-colors">
           {isBn ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Available to Withdraw'}
         </h2>
         <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 relative z-10 transition-colors">৳{availableBalance.toLocaleString()}</p>
      </motion.div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
           {isBn ? 'উত্তোলনের পরিমাণ' : 'Withdraw Amount'}
         </label>
         <div className="relative">
           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
           <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary-500 font-medium text-lg text-gray-900 dark:text-white transition-colors" />
         </div>
      </div>

       <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
           {isBn ? 'মাধ্যম নির্বাচন করুন' : 'Select Destination'}
         </label>
         <div className="grid grid-cols-2 gap-3">
             <button className="border border-primary-500 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 p-3 rounded-xl font-semibold text-sm transition-colors">
               {isBn ? 'ব্যাংক একাউন্ট' : 'Bank Account'}
             </button>
             <button className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 p-3 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed transition-colors">
               {isBn ? 'মোবাইল অ্যাপ' : 'Mobile App'}
             </button>
         </div>
         <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 transition-colors">
              {isBn ? 'সেভ করা একাউন্ট' : 'Saved Account'}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">🏛️</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm transition-colors">Islami Bank BD</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">**** **** 1234</p>
              </div>
            </div>
         </div>
      </div>

      <div className="mt-6 bg-orange-50 dark:bg-orange-900/30 p-4 rounded-xl text-sm text-orange-800 dark:text-orange-300 flex gap-3 border border-orange-100 dark:border-orange-900/40 transition-colors">
         <AlertCircle className="shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" size={18} />
         <p>
           {isBn 
             ? 'উত্তোলন প্রক্রিয়া সাধারণত ২৪ ঘণ্টার মধ্যে সম্পন্ন হয়। নিশ্চিত করুন আপনার সক্রিয় লোনের জন্য কোনো ডিপোজিট বকেয়া নেই।'
             : 'Withdrawals are processed within 24 hours. Ensure your deposit requirements for active loans are met before proceeding.'}
         </p>
      </div>

      <button onClick={handleWithdraw} disabled={isSubmitting} className="w-full mt-6 bg-gray-900 disabled:opacity-50 disabled:active:scale-100 dark:bg-primary-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform hover:bg-gray-800 dark:hover:bg-primary-700">
        {isSubmitting ? (isBn ? 'অপেক্ষা করুন...' : 'Please wait...') : (isBn ? 'নিশ্চিত করুন' : 'Confirm Withdrawal')}
      </button>

      {/* Deposit Requirements Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isBn ? 'ডিপোজিট প্রয়োজন' : 'Deposit Required'}
                </h3>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {isBn
                    ? 'উত্তোলন করার আগে নিচের ডিপোজিটগুলো সম্পূর্ণ করুন:'
                    : 'Complete the following deposits before withdrawing:'}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${depositStatus.processingFee ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {depositStatus.processingFee ? <CheckCircle size={16} /> : <X size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {isBn ? 'প্রসেসিং ফি' : 'Processing Fee'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isBn ? '৳১,২৫০' : '৳1,250'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${depositStatus.processingFee ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {depositStatus.processingFee ? (isBn ? 'সম্পন্ন' : 'Completed') : (isBn ? 'অসম্পন্ন' : 'Pending')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${depositStatus.securityDeposit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {depositStatus.securityDeposit ? <CheckCircle size={16} /> : <X size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {isBn ? 'সিকিউরিটি ডিপোজিট' : 'Security Deposit'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isBn ? '৳৪১,৬০০' : '৳41,600'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${depositStatus.securityDeposit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {depositStatus.securityDeposit ? (isBn ? 'সম্পন্ন' : 'Completed') : (isBn ? 'অসম্পন্ন' : 'Pending')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {isBn ? 'পরে করব' : 'Later'}
                </button>
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    navigate('/deposit');
                  }}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
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
