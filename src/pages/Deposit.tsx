import { ArrowLeft, MessageCircle, Send, UploadCloud, AlertCircle, Landmark, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';
import { getTelegramUser } from '../lib/telegram';
import { createTransaction, uploadDocument } from '../lib/api';

const paymentMethods = [
  { id: 'bkash', name: 'bKash', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Bkash_logo.svg', color: 'bg-[#e2136e]', text: 'text-[#e2136e]', bgLight: 'bg-[#e2136e]/10 dark:bg-[#e2136e]/20', border: 'border-[#e2136e]/30' },
  { id: 'nagad', name: 'Nagad', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Nagad_Logo.svg', color: 'bg-[#f7931e]', text: 'text-[#f7931e]', bgLight: 'bg-[#f7931e]/10 dark:bg-[#f7931e]/20', border: 'border-[#f7931e]/30' },
  { id: 'rocket', name: 'Rocket', logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D104E752-seeklogo.com.png', color: 'bg-[#8c1596]', text: 'text-[#8c1596]', bgLight: 'bg-[#8c1596]/10 dark:bg-[#8c1596]/20', border: 'border-[#8c1596]/30' },
  { id: 'bank', name: 'Bank Account', icon: true, color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'visa', name: 'Visa Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg', color: 'bg-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
];

export default function Deposit() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  const [method, setMethod] = useState(paymentMethods[0].id);
  const [depositType, setDepositType] = useState('processing');
  const [loanAmount, setLoanAmount] = useState('');
  const [amount, setAmount] = useState('');
  const [senderNo, setSenderNo] = useState('');
  const [trxId, setTrxId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Auto-calculate deposit amount when loanAmount or depositType changes
  useEffect(() => {
    if (!loanAmount) {
      setAmount('');
      return;
    }
    const lAmt = Number(loanAmount);
    if (isNaN(lAmt) || lAmt <= 0) {
      setAmount('');
      return;
    }

    let calculated = 0;
    if (depositType === 'processing') {
      // Fees: 50,000 BDT to 10 Lakh BDT (1,000,000) = 1%
      // 10 Lakh BDT up to 50 Lakh BDT (5,000,000) = 0.5%
      if (lAmt >= 50000 && lAmt <= 1000000) {
        calculated = lAmt * 0.01;
      } else if (lAmt > 1000000 && lAmt <= 5000000) {
        calculated = lAmt * 0.005;
      }
    } else {
      // Security deposit: 50,000 BDT to 5 Lakh BDT (500,000) = 10%
      // 5 Lakh BDT up to 50 Lakh BDT (5,000,000) = 5%
      if (lAmt >= 50000 && lAmt <= 500000) {
        calculated = lAmt * 0.10;
      } else if (lAmt > 500000 && lAmt <= 5000000) {
        calculated = lAmt * 0.05;
      }
    }

    if (calculated > 0) {
      setAmount(calculated.toFixed(2).replace(/\.00$/, '')); // Format nicely without decimal if it is integer
    } else {
      setAmount('');
    }
  }, [loanAmount, depositType]);

  // Handlers for social
  const openTelegram = () => {
    const telegram = useAppStore.getState().systemSettings?.telegramSupport || 'https://t.me/Provati_Loan';
    window.open(telegram, '_blank');
  };
  const openWhatsApp = () => {
    const whatsapp = useAppStore.getState().systemSettings?.whatsappSupport || 'https://wa.me/8801700000000';
    window.open(whatsapp, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !senderNo || !trxId) return;
    setShowConfirmModal(true);
  };

  const processDeposit = async () => {
    setShowConfirmModal(false);
    setSubmitted(true);
    const loadingId = toast.loading(isBn ? 'রিকুয়েস্ট জমা দেওয়া হচ্ছে...' : 'Submitting request...');
    
    try {
      const result = await createTransaction({
        chat_id: user.id,
        loan_id: null,
        type: 'deposit',
        deposit_type: depositType === 'processing' ? 'processing_fee' : 'security_deposit',
        amount: Number(amount),
        payment_method: method,
        sender_number: senderNo,
        trx_id: trxId,
        screenshot_url: screenshotUrl || null,
        status: 'pending',
      });

      if (result) {
        toast.success(isBn ? 'আপনার ডিপোজিট রিকুয়েস্ট সফলভাবে জমা হয়েছে!' : 'Deposit request successfully submitted!', { id: loadingId });
        setIsSuccess(true);
      } else {
        toast.error(isBn ? 'কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন' : 'Something went wrong, please try again', { id: loadingId });
        setSubmitted(false);
      }
    } catch (err) {
      console.error('Deposit error:', err);
      toast.error(isBn ? 'সার্ভার সমস্যা' : 'Server error', { id: loadingId });
      setSubmitted(false);
    }
  };

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
              ? 'আপনার ডিপোজিট রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে। আমাদের এডমিন প্যানেল এটি ভেরিফাই করছে।' 
              : 'Your deposit request has been submitted successfully. Our admin panel is verifying it.'}
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
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-[20px] font-bold shadow-lg shadow-gray-900/20 hover:shadow-xl active:scale-95 transition-all text-lg relative z-10"
          >
            {isBn ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
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
            {isBn ? 'ডিপোজিট করুন' : 'Deposit'}
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
            {isBn ? 'সিকিউরিটি মানি বা ফি প্রদান' : 'Pay Security Money or Fee'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">
        
        {/* Step 1: Select Method */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base transition-colors">
                {isBn ? 'পেমেন্ট মেথড' : 'Payment Method'}
              </h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors mt-0.5">
                {isBn ? '১. যেকোনো একটি মাধ্যম নির্বাচন করুন' : '1. Choose any one of the methods'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`py-4 px-3 rounded-[20px] text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                  method === m.id 
                    ? `border-primary-500 shadow-md shadow-primary-500/10` 
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                {method === m.id && (
                  <div className={`absolute inset-0 ${m.bgLight} pointer-events-none`}></div>
                )}
                
                {m.logo ? (
                  <img src={m.logo} alt={m.name} className="h-8 object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${method === m.id ? m.bgLight : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {m.id === 'bank' ? <Landmark size={20} /> : <CreditCard size={20} />}
                  </div>
                )}
                <span className={`relative z-10 ${method === m.id ? m.text : 'text-gray-600 dark:text-gray-300'}`}>{m.name}</span>
                
                {method === m.id && (
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
              {isBn ? '২. সাপোর্ট টিমের সাথে যোগাযোগ করে নাম্বার নিন' : '2. Contact support team to get the number'}
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
                {isBn ? 'সাপোর্ট টিম থেকে নাম্বার নিয়ে পেমেন্ট সম্পূর্ণ করুন এবং নিচের ফর্মটি পূরণ করুন।' : 'Complete payment to the provided number, then fill out the form below.'}
              </p>
          </div>
        </motion.section>

        {/* Step 3: Payment Details Form */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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

          <form id="deposit-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 transition-colors">
                {isBn ? 'ডিপোজিটের ধরন' : 'Deposit Type'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositType('processing')}
                  className={`py-3.5 rounded-[16px] text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${depositType === 'processing' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400'}`}
                >
                  {depositType === 'processing' && <CheckCircle2 size={16} />}
                  {isBn ? 'প্রসেসিং ফি' : 'Processing Fee'}
                </button>
                <button
                  type="button"
                  onClick={() => setDepositType('security')}
                  className={`py-3.5 rounded-[16px] text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${depositType === 'security' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400'}`}
                >
                  {depositType === 'security' && <CheckCircle2 size={16} />}
                  {isBn ? 'সিকিউরিটি মানি' : 'Security Money'}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 transition-colors uppercase tracking-wider">
                  {isBn ? 'লোনের পরিমাণ (টাকা)' : 'Loan Amount (BDT)'}
                </label>
                <div className="relative font-bold">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">৳</span>
                  <input 
                    type="number" 
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 pl-10 pr-4 text-xl font-black text-gray-900 dark:text-white focus:border-primary-500 focus:ring-0 transition-all outline-none" 
                    placeholder={isBn ? "লোনের পরিমাণ লিখুন (উদাঃ ১০০০০০)" : "Enter loan amount (e.g. 100000)"} 
                  />
                </div>
                {/* Visual Rate Info badge */}
                <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20 px-3 py-1.5 rounded-xl border border-primary-100/50 dark:border-primary-900/30 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {depositType === 'processing' 
                    ? (isBn ? 'ফি হার: ৫০ হাজার - ১০ লাখ = ১% | ১০ লাখ - ৫০ লাখ = ০.৫%' : 'Fee rate: 50k - 10L = 1% | 10L - 50L = 0.5%')
                    : (isBn ? 'ডিপোজিট হার: ৫০ হাজার - ৫ লাখ = ১০% | ৫ লাখ - ৫০ লাখ = ৫%' : 'Deposit rate: 50k - 5L = 10% | 5L - 50L = 5%')
                  }
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 transition-colors uppercase tracking-wider">
                  {isBn ? 'ডিপোজিটের পরিমাণ' : 'Deposit Amount'}
                </label>
                <div className="relative font-bold">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">৳</span>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    readOnly={!!loanAmount}
                    className={`w-full border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 pl-10 pr-4 text-xl font-black text-gray-900 dark:text-white focus:border-primary-500 focus:ring-0 transition-all outline-none ${
                      loanAmount 
                        ? 'bg-gray-100/50 dark:bg-gray-800/50 cursor-not-allowed opacity-75' 
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`} 
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
                       const url = await uploadDocument(file, user.id, 'deposit_screenshot');
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
                isBn ? 'সাবমিট করুন' : 'Submit Deposit'
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
                ? 'ডিপোজিট সাবমিট করার আগে নিশ্চিত করুন আপনি সঠিক ট্রানজেকশন আইডি এবং সেন্ডার নাম্বার দিয়েছেন। ভুল তথ্য দিলে রিকুয়েস্ট বাতিল হবে।' 
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
                onClick={processDeposit}
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
