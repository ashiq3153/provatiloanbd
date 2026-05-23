import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle, Send, UploadCloud, AlertCircle, Landmark, CheckCircle2, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { getTelegramUser } from '../lib/telegram';
import { getActiveLoans, createTransaction, uploadDocument } from '../lib/api';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency } from '../lib/translation';
import { toast } from 'sonner';
import type { LoanApplication } from '../types/database';

const paymentMethods = [
  { id: 'bkash', name: 'bKash', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Bkash_logo.svg', color: 'bg-[#e2136e]', text: 'text-[#e2136e]', bgLight: 'bg-[#e2136e]/10 dark:bg-[#e2136e]/20', border: 'border-[#e2136e]/30' },
  { id: 'nagad', name: 'Nagad', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Nagad_Logo.svg', color: 'bg-[#f7931e]', text: 'text-[#f7931e]', bgLight: 'bg-[#f7931e]/10 dark:bg-[#f7931e]/20', border: 'border-[#f7931e]/30' },
  { id: 'rocket', name: 'Rocket', logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D104E752-seeklogo.com.png', color: 'bg-[#8c1596]', text: 'text-[#8c1596]', bgLight: 'bg-[#8c1596]/10 dark:bg-[#8c1596]/20', border: 'border-[#8c1596]/30' },
  { id: 'bank', name: 'Bank Account', icon: true, color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'visa', name: 'Visa Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg', color: 'bg-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
];

export default function PayEMI() {
  const navigate = useNavigate();
  const user = getTelegramUser();
  const { language } = useAppStore();
  const isBn = language === 'bn';

  const [loading, setLoading] = useState(true);
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>(paymentMethods[0].id);
  const [senderNo, setSenderNo] = useState('');
  const [trxId, setTrxId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const loans = await getActiveLoans(user.id);
        if (loans.length > 0) {
          const loan = loans[0];
          setActiveLoan(loan);
          setAmount(loan.emi_amount.toString());
        }
      } catch (err) {
        console.error('Error fetching loan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoan();
  }, [user.id]);

  const openTelegram = () => {
    const telegram = useAppStore.getState().systemSettings?.telegramSupport || 'https://t.me/Provati_Loan';
    window.open(telegram, '_blank');
  };
  
  const openWhatsApp = () => {
    const whatsapp = useAppStore.getState().systemSettings?.whatsappSupport || 'https://wa.me/8801700000000';
    window.open(whatsapp, '_blank');
  };

  const getNextEmiDate = () => {
    const today = new Date();
    let dueMonth = today.getMonth();
    let dueYear = today.getFullYear();
    if (today.getDate() > 25) {
      dueMonth += 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
    }
    const dueDate = new Date(dueYear, dueMonth, 25);
    return dueDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !senderNo || !trxId) {
      toast.error(isBn ? 'অনুগ্রহ করে সকল সঠিক তথ্য পূরণ করুন' : 'Please fill in all details correctly');
      return;
    }
    setShowConfirmModal(true);
  };

  const processPayment = async () => {
    if (!activeLoan) return;
    setShowConfirmModal(false);
    setSubmitted(true);
    const loadingId = toast.loading(isBn ? 'রিকুয়েস্ট জমা দেওয়া হচ্ছে...' : 'Submitting request...');
    
    try {
      const result = await createTransaction({
        chat_id: user.id,
        loan_id: activeLoan.id,
        type: 'emi_payment',
        deposit_type: null,
        amount: Number(amount),
        payment_method: selectedMethod,
        sender_number: senderNo,
        trx_id: trxId,
        screenshot_url: screenshotUrl || null,
        status: 'pending',
      });

      if (result) {
        toast.success(isBn ? 'আপনার ইএমআই পেমেন্ট রিকুয়েস্ট সফলভাবে জমা হয়েছে!' : 'EMI payment request successfully submitted!', { id: loadingId });
        setIsSuccess(true);
      } else {
        toast.error(isBn ? 'কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন' : 'Something went wrong, please try again', { id: loadingId });
        setSubmitted(false);
      }
    } catch (err) {
      console.error('Payment submit error:', err);
      toast.error(isBn ? 'সার্ভার সমস্যা' : 'Server error', { id: loadingId });
      setSubmitted(false);
    }
  };

  const selectedMethodObj = paymentMethods.find(m => m.id === selectedMethod) || paymentMethods[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!activeLoan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 px-5 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors">
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
        
        <div className="p-5 flex flex-col items-center justify-center text-center mt-24">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4 shrink-0 shadow-inner">
            <AlertCircle size={32} />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
            {isBn ? 'সক্রিয় লোন পাওয়া যায়নি' : 'No Active Loan Found'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[280px] leading-relaxed">
            {isBn 
              ? 'ইএমআই পরিশোধ করার জন্য আপনার কোনো সক্রিয় লোন নেই।' 
              : 'You do not have any active loans to make EMI payments.'}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-600/20 active:scale-95 transition-all"
          >
            {isBn ? 'হোম পেজে ফিরে যান' : 'Go to Home'}
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <motion.div
           initial={{ scale: 0.8, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-700 max-w-sm w-full transition-colors relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 ring-8 ring-green-50 dark:ring-green-900/10 relative z-10">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight transition-colors relative z-10">
            {isBn ? 'ধন্যবাদ!' : 'Thank You!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed mb-6 transition-colors relative z-10">
            {isBn 
              ? 'আপনার ইএমআই পেমেন্ট রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে। আমাদের এডমিন প্যানেল এটি ভেরিফাই করছে।' 
              : 'Your EMI payment request has been submitted successfully. Our admin panel is verifying it.'}
          </p>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/40 mb-6 transition-colors relative z-10">
            <p className="text-xs uppercase tracking-wider font-bold text-orange-800 dark:text-orange-300 mb-1 transition-colors">
              {isBn ? 'আপডেট সময়' : 'Estimated Time'}
            </p>
            <p className="font-bold text-orange-600 dark:text-orange-400 transition-colors flex items-center justify-center gap-2">
               <ShieldCheck size={18} />
              {isBn ? '২০-৩০ মিনিট' : '20-30 Minutes'}
            </p>
          </div>

          <button 
            onClick={() => navigate('/transactions')}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-[20px] font-bold shadow-lg shadow-gray-900/20 hover:shadow-xl active:scale-95 transition-all text-lg relative z-10"
          >
            {isBn ? 'ট্রানজেকশন দেখুন' : 'View Transactions'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors pb-10">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'ইএমআই প্রদান' : 'Pay EMI'}
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
            {isBn ? 'আপনার সক্রিয় লোনের কিস্তি পরিশোধ করুন' : 'Pay installmets of your active loan'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">
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
                {`LN-${activeLoan.id.substring(0, 8).toUpperCase()}`}
              </h3>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 font-bold text-xs">
              {isBn ? 'সক্রিয়' : 'Active'}
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">
              {isBn ? 'পরবর্তী ইএমআই এর পরিমাণ' : 'Next EMI Amount'}
            </p>
            <h2 className="text-4xl font-black mb-2 tracking-tight">{formatCurrency(activeLoan.emi_amount, isBn)}</h2>
            <div className="flex items-center gap-2 text-sm text-blue-100 bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/10">
              <ShieldCheck size={16} />
              <span>{isBn ? `নির্ধারিত তারিখ: ${convertDigits('২৫', true)} তারিখ` : `Due Date: 25th of the month`}</span>
            </div>
          </div>
        </motion.div>

        {/* Step 1: Select Method */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <div className="mb-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-base transition-colors">
              {isBn ? 'পেমেন্ট মেথড' : 'Payment Method'}
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5">
              {isBn ? '১. যেকোনো একটি মাধ্যম নির্বাচন করুন' : '1. Choose any one of the methods'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                className={`py-4 px-3 rounded-[20px] text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                  selectedMethod === m.id 
                    ? `border-primary-500 shadow-md shadow-primary-500/10` 
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                {selectedMethod === m.id && (
                  <div className={`absolute inset-0 ${m.bgLight} pointer-events-none`}></div>
                )}
                
                {m.logo ? (
                  <img src={m.logo} alt={m.name} className="h-8 object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${selectedMethod === m.id ? m.bgLight : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {m.id === 'bank' ? <Landmark size={20} /> : <CreditCard size={20} />}
                  </div>
                )}
                <span className={`relative z-10 ${selectedMethod === m.id ? m.text : 'text-gray-600 dark:text-gray-300'}`}>{m.name}</span>
                
                {selectedMethod === m.id && (
                  <div className="absolute top-2 right-2 text-primary-500">
                    <CheckCircle2 size={16} className="fill-primary-100 dark:fill-primary-900/50" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Step 2: Contact Support */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] p-6 shadow-xl border border-white/10 relative overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="relative z-10 mb-5">
            <h3 className="font-bold text-lg mb-1">
              {isBn ? 'পেমেন্ট নাম্বার সংগ্রহ করুন' : 'Get Payment Number'}
            </h3>
            <p className="text-xs font-medium text-blue-100">
              {isBn ? `২. সাপোর্ট টিমের সাথে যোগাযোগ করে আপনার ${selectedMethodObj.name} পেমেন্ট নাম্বার নিন` : `2. Contact support team to get your ${selectedMethodObj.name} payment number`}
            </p>
          </div>
          
          <div className="flex gap-3 relative z-10">
            <button onClick={openWhatsApp} type="button" className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all">
              <MessageCircle size={18} className="text-green-400" /> WhatsApp
            </button>
            <button onClick={openTelegram} type="button" className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all">
              <Send size={18} className="text-sky-400" /> Telegram
            </button>
          </div>
          
          <div className="mt-5 bg-black/20 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-start gap-3 relative z-10">
              <AlertCircle size={16} className="text-blue-200 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-100 leading-tight font-medium">
                {isBn 
                  ? `সাপোর্ট টিম থেকে ${selectedMethodObj.name} নাম্বার নিয়ে কিস্তির টাকা প্রদান করুন এবং নিচের ফর্মে তথ্য দিন।` 
                  : `Pay the EMI amount to the provided ${selectedMethodObj.name} number, then fill the details below.`}
              </p>
          </div>
        </motion.section>

        {/* Step 3: Payment Details Form */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <div className="mb-6">
             <h3 className="font-bold text-gray-900 dark:text-white text-base transition-colors">
               {isBn ? 'পেমেন্ট তথ্য দিন' : 'Provide Payment Info'}
             </h3>
             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5">
               {isBn ? '৩. পেমেন্ট করার পর তথ্যগুলো দিন' : '3. Enter details after successful payment'}
             </p>
          </div>

          <form id="pay-emi-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 transition-colors uppercase tracking-wider">
                  {isBn ? 'পরিশোধের পরিমাণ' : 'Payment Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">৳</span>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 pl-10 pr-4 text-xl font-black text-gray-900 dark:text-white focus:border-primary-500 focus:ring-0 transition-all outline-none" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 transition-colors uppercase tracking-wider">
                  {isBn ? 'যে নাম্বার থেকে টাকা পাঠিয়েছেন' : 'Sender Number'}
                </label>
                <input 
                  type="text" 
                  required
                  value={senderNo}
                  onChange={(e) => setSenderNo(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 text-base font-bold text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all" 
                  placeholder="01XXXXXXXXX" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 transition-colors uppercase tracking-wider">
                  {isBn ? 'ট্রানজেকশন আইডি' : 'Transaction ID (TrxID)'}
                </label>
                <input 
                  type="text" 
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 text-base font-bold text-gray-900 dark:text-white focus:border-primary-500 outline-none uppercase font-mono tracking-wider transition-all" 
                  placeholder="A8B9C7D6E5" 
                />
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 transition-colors uppercase tracking-wider">
                   {isBn ? 'স্ক্রিনশট (ঐচ্ছিক)' : 'Screenshot (Optional)'}
                 </label>
                 
                 <div className="relative">
                   <input 
                     type="file" 
                     id="screenshot-upload"
                     className="hidden" 
                     accept="image/*"
                     onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       setUploading(true);
                       const url = await uploadDocument(file, user.id, 'emi_screenshot');
                       if (url) {
                         setScreenshotUrl(url);
                       } else {
                         toast.error(isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে' : 'File upload failed');
                       }
                       setUploading(false);
                     }}
                   />
                   <label 
                     htmlFor="screenshot-upload" 
                     className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-6 flex flex-col items-center justify-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-800 transition-all cursor-pointer"
                   >
                     {uploading ? (
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-1"></div>
                     ) : screenshotUrl ? (
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                           <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />
                         </div>
                         <span className="text-sm font-bold text-green-600 dark:text-green-400">
                           {isBn ? 'স্ক্রিনশট আপলোড হয়েছে' : 'Screenshot Uploaded'}
                         </span>
                       </div>
                     ) : (
                       <>
                         <div className="w-12 h-12 bg-white dark:bg-gray-800 shadow-sm rounded-full flex items-center justify-center">
                           <UploadCloud size={24} className="text-gray-400 dark:text-gray-500" />
                         </div>
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                           {isBn ? 'স্ক্রিনশট আপলোড করতে ক্লিক করুন' : 'Click to upload screenshot'}
                         </span>
                       </>
                     )}
                   </label>
                 </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!amount || Number(amount) <= 0 || !senderNo || !trxId || submitted}
              className="w-full mt-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:active:scale-100 text-white py-4 rounded-[20px] font-bold text-lg shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {submitted ? (
                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                isBn ? 'পেমেন্ট সাবমিট করুন' : 'Submit Payment'
              )}
            </button>
          </form>
        </motion.section>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700"
          >
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {isBn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
              {isBn 
                ? 'ইএমআই পেমেন্ট সাবমিট করার আগে নিশ্চিত করুন আপনি সঠিক ট্রানজেকশন আইডি এবং সেন্ডার নাম্বার দিয়েছেন। ভুল তথ্য দিলে রিকুয়েস্ট বাতিল হবে।' 
                : 'Please ensure TrxID and Sender Number are correct before submitting. Incorrect details will lead to rejection.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                onClick={processPayment}
                className="flex-1 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                {isBn ? 'হ্যাঁ, সাবমিট' : 'Yes, Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
