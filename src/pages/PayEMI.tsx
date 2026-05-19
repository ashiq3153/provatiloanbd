import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { getActiveLoans } from '../lib/api';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency } from '../lib/translation';
import { toast } from 'sonner';
import type { LoanApplication } from '../types/database';

export default function PayEMI() {
  const navigate = useNavigate();
  const user = getTelegramUser();
  const { language } = useAppStore();
  const isBn = language === 'bn';

  const [loading, setLoading] = useState(true);
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const loans = await getActiveLoans(user.id);
        if (loans.length > 0) {
          setActiveLoan(loans[0]);
          // Default EMI amount (mocked for visual purposes if not in DB)
          setAmount('12500'); 
        }
      } catch (err) {
        console.error('Error fetching loan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoan();
  }, [user.id]);

  const paymentMethods = [
    { id: 'bkash', name: 'bKash', icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800' },
    { id: 'nagad', name: 'Nagad', icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
    { id: 'card', name: isBn ? 'কার্ড / ব্যাংক' : 'Card / Bank', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  ];

  const handlePayment = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(isBn ? 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }
    if (!selectedMethod) {
      toast.error(isBn ? 'পেমেন্ট মেথড নির্বাচন করুন' : 'Please select a payment method');
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(isBn ? 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!' : 'Payment processed successfully!');
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-5 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm transition-colors">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
          {isBn ? 'ইএমআই প্রদান' : 'Pay EMI'}
        </h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Loan Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">
                {isBn ? 'লোন আইডি' : 'Loan ID'}
              </p>
              <h3 className="font-bold text-lg tracking-wide">
                {activeLoan ? `LN-${activeLoan.id.substring(0, 6).toUpperCase()}` : 'LN-000000'}
              </h3>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <span className="text-xs font-bold">{isBn ? 'সক্রিয়' : 'Active'}</span>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">
              {isBn ? 'পরবর্তী ইএমআই এর পরিমাণ' : 'Next EMI Amount'}
            </p>
            <h2 className="text-4xl font-black mb-2 tracking-tight">{formatCurrency(12500, isBn)}</h2>
            <div className="flex items-center gap-2 text-sm text-blue-100 bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/10">
              <ShieldCheck size={16} />
              <span>{isBn ? 'নির্ধারিত তারিখ: ২৫ মে ২০২৪' : 'Due Date: 25 May 2024'}</span>
            </div>
          </div>
        </motion.div>

        {/* Amount Input */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 transition-colors">
            {isBn ? 'পরিশোধের পরিমাণ' : 'Payment Amount'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">৳</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 pl-10 pr-4 text-2xl font-black text-gray-900 dark:text-white focus:border-primary-500 focus:ring-0 transition-all outline-none"
              placeholder="0"
            />
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 px-1 transition-colors">
            {isBn ? 'পেমেন্ট মেথড' : 'Payment Method'}
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full bg-white dark:bg-gray-800 rounded-[20px] p-4 flex items-center justify-between border-2 transition-all cursor-pointer ${
                  selectedMethod === method.id 
                    ? 'border-primary-500 shadow-md shadow-primary-500/10' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method.bg} ${method.color} border ${method.border}`}>
                    <method.icon size={24} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-base">{method.name}</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMethod === method.id 
                    ? 'border-primary-500 bg-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selectedMethod === method.id && <CheckCircle2 size={14} className="text-white" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-[20px] py-4 font-bold text-lg shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {isProcessing ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {isBn ? 'নিশ্চিত করুন' : 'Confirm Payment'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
