import { ArrowLeft, MessageCircle, UploadCloud, AlertCircle, Landmark, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';
import { getTelegramUser } from '../lib/telegram';
import { createTransaction, uploadDocument, getLoanApplications } from '../lib/api';

const paymentMethods = [
  { id: 'bkash', name: 'bKash', logo: '/bkash.png', color: 'bg-[#e2136e]', text: 'text-[#e2136e]', bgLight: 'bg-[#e2136e]/10 dark:bg-[#e2136e]/20', border: 'border-[#e2136e]/30' },
  { id: 'nagad', name: 'Nagad', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Nagad_Logo.svg', color: 'bg-[#f7931e]', text: 'text-[#f7931e]', bgLight: 'bg-[#f7931e]/10 dark:bg-[#f7931e]/20', border: 'border-[#f7931e]/30' },
  { id: 'rocket', name: 'Rocket', logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D104E752-seeklogo.com.png', color: 'bg-[#8c1596]', text: 'text-[#8c1596]', bgLight: 'bg-[#8c1596]/10 dark:bg-[#8c1596]/20', border: 'border-[#8c1596]/30' },
  { id: 'bank', name: 'Bank Account', icon: true, color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'visa', name: 'Visa Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg', color: 'bg-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
];

const presetAmounts = [50000, 100000, 200000, 500000];

export default function Deposit() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  
  const [method, setMethod] = useState(paymentMethods[0].id);
  const [depositType, setDepositType] = useState<'processing' | 'security'>('processing');
  const [loanAmount, setLoanAmount] = useState('');
  const [senderNo, setSenderNo] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [associatedLoanId, setAssociatedLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.id) {
      getLoanApplications(user.id).then(loans => {
        const activeLoan = loans.find(l => l.status === 'pending' || l.status === 'under_review' || l.status === 'action_required');
        if (activeLoan) {
          setAssociatedLoanId(activeLoan.id);
          setLoanAmount(activeLoan.amount.toString());
        }
      });
    }
  }, [user]);

  // Charges calculations
  const loanAmtNum = Number(loanAmount) || 0;
  
  // Processing Fee:
  // 50,000 BDT to 10 Lakh BDT (1,000,000) = 1%
  // 10 Lakh BDT up to 50 Lakh BDT (5,000,000) = 0.5%
  let calculatedProcessingFee = 0;
  if (loanAmtNum >= 50000) {
    if (loanAmtNum <= 1000000) {
      calculatedProcessingFee = loanAmtNum * 0.01;
    } else if (loanAmtNum <= 5000000) {
      calculatedProcessingFee = loanAmtNum * 0.005;
    }
  }

  // Savings Deposit (formerly security deposit):
  // 50,000 BDT to 5 Lakh BDT (500,000) = 10%
  // 5 Lakh BDT up to 50 Lakh BDT (5,000,000) = 5%
  let calculatedSavingsDeposit = 0;
  if (loanAmtNum >= 50000) {
    if (loanAmtNum <= 500000) {
      calculatedSavingsDeposit = loanAmtNum * 0.10;
    } else if (loanAmtNum <= 5000000) {
      calculatedSavingsDeposit = loanAmtNum * 0.05;
    }
  }

  const calculatedTotalDeposit = calculatedProcessingFee + calculatedSavingsDeposit;

  // Selected payment amount depending on selected row/type
  const selectedPaymentAmount = depositType === 'processing' ? calculatedProcessingFee : calculatedSavingsDeposit;

  const formatPresetLabel = (val: number) => {
    if (val === 50000) return isBn ? '৫০ হাজার' : '50k';
    if (val === 100000) return isBn ? '১ লাখ' : '100k';
    if (val === 200000) return isBn ? '২ লাখ' : '200k';
    if (val === 500000) return isBn ? '৫ লাখ' : '500k';
    return val.toLocaleString('en-IN');
  };

  const handleLiveSupportChat = () => {
    const gatewayName = paymentMethods.find(m => m.id === method)?.name || method;
    const formattedLoan = loanAmtNum;

    const prefilledMsg = `নতুন ডিপোজিট অনুরোধ

নাম: ${user.first_name} ${user.last_name || ''}
সদস্য আইডি: ${user.id}

লোন: ৳${formattedLoan.toLocaleString('en-IN')}
প্রসেসিং ফি: ৳${calculatedProcessingFee.toLocaleString('en-IN')}
সঞ্চয়: ৳${calculatedSavingsDeposit.toLocaleString('en-IN')}
মোট জমা: ৳${calculatedTotalDeposit.toLocaleString('en-IN')}

মাধ্যম: ${gatewayName}`;

    // Store in localStorage as backup and route with state
    localStorage.setItem('pending_support_msg', prefilledMsg);
    navigate('/support', { state: { prefilledMsg } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPaymentAmount <= 0 || !senderNo) {
      toast.error(isBn ? 'অনুগ্রহ করে প্রথমে লোনের পরিমাণ নির্বাচন করুন' : 'Please select a valid loan amount first');
      return;
    }
    setShowConfirmModal(true);
  };

  const processDeposit = async () => {
    setShowConfirmModal(false);
    setSubmitted(true);
    const loadingId = toast.loading(isBn ? 'রিকুয়েস্ট জমা দেওয়া হচ্ছে...' : 'Submitting request...');
    
    // Auto-generate transaction code for the trx_id field
    const generatedTrxId = `DEP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    try {
      const result = await createTransaction({
        chat_id: user.id,
        loan_id: associatedLoanId,
        type: 'deposit',
        deposit_type: depositType === 'processing' ? 'processing_fee' : 'security_deposit',
        amount: selectedPaymentAmount,
        payment_method: method,
        sender_number: senderNo,
        trx_id: generatedTrxId,
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
          
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 ring-8 ring-green-50 dark:ring-green-900/10 relative z-10">
            <CheckCircle2 size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight transition-colors relative z-10">
            {isBn ? 'ধন্যবাদ!' : 'Thank You!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-xs leading-relaxed mb-6 transition-colors relative z-10">
            {isBn 
              ? 'আপনার ডিপোজিট রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে। আমাদের এডমিন প্যানেল এটি ভেরিফাই করছে।' 
              : 'Your deposit request has been submitted successfully. Our admin panel is verifying it.'}
          </p>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/40 mb-6 transition-colors relative z-10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-orange-800 dark:text-orange-300 mb-1 transition-colors">
              {isBn ? 'আপডেট সময়' : 'Estimated Time'}
            </p>
            <p className="font-bold text-sm text-orange-600 dark:text-orange-400 transition-colors flex items-center justify-center gap-2">
               <ShieldCheck size={16} />
              {isBn ? '২০-৩০ মিনিট' : '20-30 Minutes'}
            </p>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-[20px] font-bold shadow-lg shadow-gray-900/20 active:scale-95 transition-all text-base relative z-10"
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-5 py-3 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'ডিপোজিট করুন' : 'Deposit Funds'}
          </h1>
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors">
            {isBn ? 'লোন প্রসেসিং ও সঞ্চয় জমা' : 'Pay processing fee or savings deposit'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        
        {/* Step 1: Loan Amount Selection */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
            {isBn ? 'লোনের পরিমাণ নির্বাচন করুন' : 'Select Loan Amount'}
          </label>
          
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setLoanAmount(amt.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  loanAmtNum === amt
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                }`}
              >
                {formatPresetLabel(amt)}
              </button>
            ))}
          </div>

          {/* Custom entry */}
          <div className="relative font-bold">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 font-bold">৳</span>
            <input 
              type="number" 
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl py-3 pl-8 pr-4 text-lg font-black text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all" 
              placeholder={isBn ? "অন্যান্য পরিমাণ লিখুন (উদাঃ ১০০০০০)" : "Enter custom amount (e.g. 100000)"} 
            />
          </div>
        </motion.section>

        {/* Step 2: Auto Calculation & Selector Summary Card */}
        {loanAmtNum >= 50000 && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
          >
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold mb-2">
              {isBn ? 'ডিপোজিটের বিবরণ ও ধরণ' : 'Deposit Details & Type'}
            </p>
            <div className="space-y-2">
              {/* Processing Fee Row (Selectable) */}
              <div 
                onClick={() => setDepositType('processing')}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  depositType === 'processing'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-50 dark:border-gray-800 hover:border-gray-100 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${depositType === 'processing' ? 'border-primary-600 bg-primary-600' : 'border-gray-400'}`}>
                    {depositType === 'processing' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-xs font-bold">{isBn ? 'প্রসেসিং ফি (১%)' : 'Processing Fee (1%)'}</span>
                </div>
                <span className="text-sm font-black">৳{calculatedProcessingFee.toLocaleString('en-IN')}</span>
              </div>

              {/* Savings Deposit Row (Selectable) */}
              <div 
                onClick={() => setDepositType('security')}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  depositType === 'security'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-50 dark:border-gray-800 hover:border-gray-100 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${depositType === 'security' ? 'border-primary-600 bg-primary-600' : 'border-gray-400'}`}>
                    {depositType === 'security' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-xs font-bold">{isBn ? 'সঞ্চয় জমা (১০%)' : 'Savings Deposit (10%)'}</span>
                </div>
                <span className="text-sm font-black">৳{calculatedSavingsDeposit.toLocaleString('en-IN')}</span>
              </div>

              {/* Total Row */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">
                <span className="text-xs font-bold opacity-80">{isBn ? 'মোট সম্ভাব্য জমা' : 'Total Charges'}</span>
                <span className="text-base font-black">৳{calculatedTotalDeposit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* Step 3: Payment Method Selection */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-3.5 transition-colors">
            {isBn ? 'পেমেন্ট গেটওয়ে' : 'Payment Method'}
          </label>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            {paymentMethods.slice(0, 3).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${
                  method === m.id 
                    ? `border-primary-500 shadow-sm` 
                    : 'border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 hover:border-gray-100'
                }`}
              >
                {method === m.id && (
                  <div className={`absolute inset-0 ${m.bgLight} pointer-events-none`}></div>
                )}
                <img src={m.logo} alt={m.name} className="h-6 object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm relative z-10" />
                <span className={`text-[10px] relative z-10 ${method === m.id ? m.text : 'text-gray-600 dark:text-gray-300'}`}>{m.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.slice(3).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                  method === m.id 
                    ? `border-primary-500 shadow-sm` 
                    : 'border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 hover:border-gray-100'
                }`}
              >
                {method === m.id && (
                  <div className={`absolute inset-0 ${m.bgLight} pointer-events-none`}></div>
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${method === m.id ? m.bgLight : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                  {m.id === 'bank' ? <Landmark size={15} /> : <CreditCard size={15} />}
                </div>
                <span className={`text-[10px] relative z-10 ${method === m.id ? m.text : 'text-gray-600 dark:text-gray-300'}`}>{m.name}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Step 4: Live Chat Support Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-[20px] p-4 text-white shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm mb-0.5">{isBn ? 'পেমেন্ট নাম্বার সংগ্রহ করুন' : 'Get Support Agent Number'}</h4>
              <p className="text-[10px] text-blue-100">{isBn ? '💬 আমাদের টিম থেকে নম্বর নিয়ে পেমেন্ট করুন।' : 'Contact live chat to get payment details.'}</p>
            </div>
            <button
              type="button"
              onClick={handleLiveSupportChat}
              className="bg-white text-primary-700 hover:bg-gray-50 font-extrabold text-xs py-2 px-3 rounded-lg active:scale-95 transition-all shadow flex items-center gap-1.5 shrink-0"
            >
              <MessageCircle size={14} />
              {isBn ? 'পেমেন্ট নির্দেশনা নিন' : '💬 Live Chat'}
            </button>
          </div>
        </motion.div>

        {/* Steps 5 & 6: Payment Proof Submission Form */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold mb-3">
            {isBn ? 'পেমেন্ট ভেরিফিকেশন প্রুফ' : 'Submit Payment Proof'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors">
                {isBn ? 'যে নাম্বার থেকে টাকা পাঠিয়েছেন' : 'Sender Number'}
              </label>
              <input 
                type="text" 
                required
                value={senderNo}
                onChange={(e) => setSenderNo(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-3 text-sm font-bold text-gray-900 dark:text-white focus:border-primary-500 outline-none transition-all" 
                placeholder="01XXXXXXXXX" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors">
                {isBn ? 'পেমেন্ট স্ক্রিনশট' : 'Payment Screenshot'}
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
                      toast.success(isBn ? 'স্ক্রিনশট আপলোড সফল' : 'Screenshot uploaded successfully');
                    } else {
                      toast.error(isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে' : 'File upload failed');
                    }
                    setUploading(false);
                  }}
                />
                <label 
                  htmlFor="screenshot-upload" 
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl py-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50/50 hover:border-primary-400 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  ) : screenshotUrl ? (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-bold">
                      <CheckCircle2 size={16} />
                      {isBn ? 'স্ক্রিনশট সংযুক্ত হয়েছে' : 'Screenshot Attached'}
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {isBn ? 'ক্লিক করে স্ক্রিনশট দিন' : 'Click to upload screenshot'}
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={selectedPaymentAmount <= 0 || !senderNo || submitted}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3.5 rounded-[16px] font-bold text-sm shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {submitted ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                isBn ? 'ডিপোজিট রিকোয়েস্ট পাঠান' : 'Submit Deposit Request'
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
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              {isBn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}
            </h3>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {isBn 
                ? 'ডিপোজিট সাবমিট করার আগে নিশ্চিত করুন আপনি সঠিক সেন্ডার নাম্বার দিয়েছেন এবং যথাযথ পেমেন্ট করেছেন। ভুল তথ্যে রিকোয়েস্ট বাতিল হবে।' 
                : 'Ensure the sender number is correct before submitting. Incorrect details will result in automated rejection.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                onClick={processDeposit}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary-600 text-white hover:bg-primary-700 transition-colors"
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
