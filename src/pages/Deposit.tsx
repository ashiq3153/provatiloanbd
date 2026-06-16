import { ArrowLeft, MessageCircle, UploadCloud, AlertCircle, Landmark, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';
import { getTelegramUser } from '../lib/telegram';
import { createTransaction, uploadDocument, getLoanApplications } from '../lib/api';

import bkashLogo from '../assets/bkash.png';
import nagadLogo from '../assets/nagad.png';
import rocketLogo from '../assets/rocket.png';
import bankLogo from '../assets/bank.png';
import visaLogo from '../assets/visa.png';

const paymentMethods = [
  { id: 'bkash', name: 'bKash', logo: bkashLogo, color: 'bg-[#e2136e]', text: 'text-[#e2136e]', bgLight: 'bg-[#e2136e]/10 dark:bg-[#e2136e]/20', border: 'border-[#e2136e]/30' },
  { id: 'nagad', name: 'Nagad', logo: nagadLogo, color: 'bg-[#f7931e]', text: 'text-[#f7931e]', bgLight: 'bg-[#f7931e]/10 dark:bg-[#f7931e]/20', border: 'border-[#f7931e]/30' },
  { id: 'rocket', name: 'Rocket', logo: rocketLogo, color: 'bg-[#8c1596]', text: 'text-[#8c1596]', bgLight: 'bg-[#8c1596]/10 dark:bg-[#8c1596]/20', border: 'border-[#8c1596]/30' },
  { id: 'bank', name: 'Bank Account', logo: bankLogo, color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'visa', name: 'Visa Card', logo: visaLogo, color: 'bg-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
];

const presetAmounts = [50000, 100000, 200000, 500000];

export default function Deposit() {
  const navigate = useNavigate();
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  
  const [method, setMethod] = useState(paymentMethods[0].id);
  const [selectProcessing, setSelectProcessing] = useState(true);
  const [selectSecurity, setSelectSecurity] = useState(false);
  const [selectInsurance, setSelectInsurance] = useState(false);
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
  // FIXED at 10% for all amounts from 50k to 50 Lakh BDT (5,000,000)
  let calculatedSavingsDeposit = 0;
  if (loanAmtNum >= 50000 && loanAmtNum <= 5000000) {
    calculatedSavingsDeposit = loanAmtNum * 0.10;
  }

  // Insurance Fee:
  // Configured in admin panel settings, default 1% if enabled
  const isInsuranceEnabled = !!systemSettings?.insuranceEnabled;
  const insuranceRate = systemSettings?.insuranceRate || 0.01;
  const calculatedInsurance = isInsuranceEnabled && loanAmtNum >= 50000 ? loanAmtNum * insuranceRate : 0;

  // Selected payment amount depending on selected checked options
  const selectedPaymentAmount = 
    (selectProcessing ? calculatedProcessingFee : 0) + 
    (selectSecurity ? calculatedSavingsDeposit : 0) + 
    ((selectInsurance && isInsuranceEnabled) ? calculatedInsurance : 0);

  const getSelectedDepositTypes = () => {
    const selected: string[] = [];
    if (selectProcessing) selected.push('processing_fee');
    if (selectSecurity) selected.push('security_deposit');
    if (selectInsurance && isInsuranceEnabled) selected.push('insurance');
    return selected.join(',');
  };

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
${selectProcessing ? `প্রসেসিং ফি: ৳${calculatedProcessingFee.toLocaleString('en-IN')}\n` : ''}${selectSecurity ? `সঞ্চয়: ৳${calculatedSavingsDeposit.toLocaleString('en-IN')}\n` : ''}${selectInsurance && isInsuranceEnabled ? `বীমা: ৳${calculatedInsurance.toLocaleString('en-IN')}\n` : ''}মোট জমা: ৳${selectedPaymentAmount.toLocaleString('en-IN')}

মাধ্যম: ${gatewayName}`;

    // Store in localStorage as backup and route with state
    localStorage.setItem('pending_support_msg', prefilledMsg);
    navigate('/support', { state: { prefilledMsg } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPaymentAmount <= 0 || !senderNo) {
      toast.error(isBn ? 'অনুগ্রহ করে প্রথমে লোনের পরিমাণ ও ডিপোজিট টাইপ নির্বাচন করুন' : 'Please select a valid loan amount and deposit options first');
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
        deposit_type: getSelectedDepositTypes(),
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
      <div className="min-h-screen neu-bg flex flex-col items-center justify-center p-6 text-center transition-colors">
        <motion.div
           initial={{ scale: 0.8, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           className="neu-raised p-8 rounded-[32px] max-w-sm w-full transition-colors relative overflow-hidden border-0 shadow-none"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-inner ring-8 ring-green-500/5 relative z-10">
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight transition-colors relative z-10">
            {isBn ? 'ধন্যবাদ!' : 'Thank You!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xs leading-relaxed mb-6 transition-colors relative z-10">
            {isBn 
              ? 'আপনার ডিপোজিট রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে। আমাদের এডমিন প্যানেল এটি ভেরিফাই করছে।' 
              : 'Your deposit request has been submitted successfully. Our admin panel is verifying it.'}
          </p>
          
          <div className="neu-sunken p-4 rounded-2xl mb-6 transition-colors relative z-10 border-0">
            <p className="text-[10px] uppercase tracking-wider font-black text-orange-600 dark:text-orange-400 mb-1 transition-colors">
              {isBn ? 'আপডেট সময়' : 'Estimated Time'}
            </p>
            <p className="font-extrabold text-sm text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              {isBn ? '২০-৩০ মিনিট' : '20-30 Minutes'}
            </p>
          </div>

          <button 
            type="button"
            onClick={() => navigate('/')}
            className="w-full neu-btn-primary py-3.5 rounded-[20px] font-black active:scale-95 transition-all text-sm relative z-10 border-0"
          >
            {isBn ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neu-bg flex flex-col relative transition-colors pb-24">
      {/* Premium Header */}
      <div className="px-5 py-4 sticky top-0 z-30 flex items-center gap-4 shrink-0 bg-transparent">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all border-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'ডিপোজিট করুন' : 'Deposit Funds'}
          </h1>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 transition-colors mt-0.5">
            {isBn ? 'লোন প্রসেসিং ও সঞ্চয় জমা' : 'Pay processing fee or savings deposit'}
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 bg-transparent">
        
        {/* Step 1: Loan Amount Selection */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-raised rounded-[24px] p-5 border-0"
        >
          <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-3 transition-colors">
            {isBn ? 'লোনের পরিমাণ নির্বাচন করুন' : 'Select Loan Amount'}
          </label>
          
          {/* Preset chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setLoanAmount(amt.toString())}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border-0 cursor-pointer ${
                  loanAmtNum === amt
                    ? 'neu-btn-primary shadow-sm'
                    : 'neu-btn'
                }`}
              >
                {formatPresetLabel(amt)}
              </button>
            ))}
          </div>

          {/* Custom entry */}
          <div className="relative font-black">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 font-black">৳</span>
            <input 
              type="number" 
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full neu-input rounded-xl py-3 pl-8 pr-4 text-base font-black outline-none border-0 transition-all text-gray-900 dark:text-white" 
              placeholder={isBn ? "অন্যান্য পরিমাণ লিখুন (উদাঃ ১০০০০০)" : "Enter custom amount (e.g. 100000)"} 
            />
          </div>
        </motion.section>

        {/* Step 2: Auto Calculation & Selector Summary Card */}
        {loanAmtNum >= 50000 && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-raised rounded-[24px] p-5 border-0"
          >
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3">
              {isBn ? 'ডিপোজিটের বিবরণ ও ধরণ' : 'Deposit Details & Type'}
            </p>
            <div className="space-y-2.5">
              {/* Select All Option */}
              <div 
                onClick={() => {
                  const allSelected = selectProcessing && selectSecurity && (!isInsuranceEnabled || selectInsurance);
                  if (allSelected) {
                    setSelectProcessing(false);
                    setSelectSecurity(false);
                    setSelectInsurance(false);
                  } else {
                    setSelectProcessing(true);
                    setSelectSecurity(true);
                    if (isInsuranceEnabled) setSelectInsurance(true);
                  }
                }}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  (selectProcessing && selectSecurity && (!isInsuranceEnabled || selectInsurance))
                    ? 'border-primary-500/40 bg-primary-600/10 text-primary-600 dark:text-indigo-400 neu-raised shadow-inner'
                    : 'neu-btn text-gray-800 dark:text-gray-250 border-0'
                }`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${(selectProcessing && selectSecurity && (!isInsuranceEnabled || selectInsurance)) ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-400'}`}>
                    {(selectProcessing && selectSecurity && (!isInsuranceEnabled || selectInsurance)) && (
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    )}
                  </div>
                  <span className="text-xs font-extrabold">{isBn ? 'সব নির্বাচন করুন' : 'Select All'}</span>
                </div>
              </div>

              {/* Processing Fee Row */}
              <div 
                onClick={() => setSelectProcessing(!selectProcessing)}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  selectProcessing
                    ? 'border-primary-500/40 bg-primary-600/10 text-primary-600 dark:text-indigo-400 neu-raised shadow-inner'
                    : 'neu-btn text-gray-800 dark:text-gray-250 border-0'
                }`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectProcessing ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-400'}`}>
                    {selectProcessing && (
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    )}
                  </div>
                  <span className="text-xs font-extrabold">
                    {isBn 
                      ? `প্রসেসিং ফি (${loanAmtNum <= 1000000 ? '১%' : '০.৫%'})` 
                      : `Processing Fee (${loanAmtNum <= 1000000 ? '1%' : '0.5%'})`
                    }
                  </span>
                </div>
                <span className="text-xs font-black relative z-10">৳{calculatedProcessingFee.toLocaleString('en-IN')}</span>
              </div>

              {/* Savings Deposit Row */}
              <div 
                onClick={() => setSelectSecurity(!selectSecurity)}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  selectSecurity
                    ? 'border-primary-500/40 bg-primary-600/10 text-primary-600 dark:text-indigo-400 neu-raised shadow-inner'
                    : 'neu-btn text-gray-800 dark:text-gray-250 border-0'
                }`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectSecurity ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-400'}`}>
                    {selectSecurity && (
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    )}
                  </div>
                  <span className="text-xs font-extrabold">
                    {isBn ? 'সঞ্চয় জমা (১০%)' : 'Savings Deposit (10%)'}
                  </span>
                </div>
                <span className="text-xs font-black relative z-10">৳{calculatedSavingsDeposit.toLocaleString('en-IN')}</span>
              </div>

              {/* Insurance Row */}
              {isInsuranceEnabled && (
                <div 
                  onClick={() => setSelectInsurance(!selectInsurance)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    selectInsurance
                      ? 'border-primary-500/40 bg-primary-600/10 text-primary-600 dark:text-indigo-400 neu-raised shadow-inner'
                      : 'neu-btn text-gray-800 dark:text-gray-250 border-0'
                  }`}
                >
                  <div className="flex items-center gap-2 relative z-10">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectInsurance ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-400'}`}>
                      {selectInsurance && (
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      )}
                    </div>
                    <span className="text-xs font-extrabold">
                      {isBn ? `বীমা ফি (${(insuranceRate * 100).toFixed(1)}%)` : `Insurance Fee (${(insuranceRate * 100).toFixed(1)}%)`}
                    </span>
                  </div>
                  <span className="text-xs font-black relative z-10">৳{calculatedInsurance.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Total Row */}
              <div className="p-3.5 neu-sunken rounded-2xl flex items-center justify-between border-0 text-gray-900 dark:text-white">
                <span className="text-xs font-black text-gray-500 dark:text-gray-400">{isBn ? 'মোট সম্ভাব্য জমা' : 'Total Charges'}</span>
                <span className="text-base font-black">৳{selectedPaymentAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* Step 3: Payment Method Selection */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-raised rounded-[24px] p-5 border-0"
        >
          <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-3.5 transition-colors">
            {isBn ? 'পেমেন্ট গেটওয়ে' : 'Payment Method'}
          </label>
          
          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            {paymentMethods.slice(0, 3).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden cursor-pointer ${
                  method === m.id 
                    ? `border-primary-500/40 bg-primary-600/10 shadow-inner` 
                    : 'neu-btn border-0'
                }`}
              >
                <img src={m.logo} alt={m.name} className="h-6 object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm relative z-10" />
                <span className={`text-[10px] font-black relative z-10 ${method === m.id ? m.text : 'text-gray-600 dark:text-gray-300'}`}>{m.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {paymentMethods.slice(3).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden cursor-pointer ${
                  method === m.id 
                    ? `border-primary-500/40 bg-primary-600/10 shadow-inner` 
                    : 'neu-btn border-0'
                }`}
              >
                <img src={m.logo} alt={m.name} className="h-6 object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm relative z-10" />
                <span className={`text-[10px] font-black relative z-10 ${method === m.id ? m.text : 'text-gray-600 dark:text-gray-300'}`}>{m.name}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Step 4: Live Chat Support Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-raised rounded-[24px] p-5 border-0"
        >
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              <h4 className="font-extrabold text-xs text-gray-900 dark:text-white mb-0.5">{isBn ? 'পেমেন্ট নাম্বার সংগ্রহ করুন' : 'Get Support Agent Number'}</h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{isBn ? '💬 আমাদের টিম থেকে নম্বর নিয়ে পেমেন্ট করুন।' : 'Contact live chat to get payment details.'}</p>
            </div>
            <button
              type="button"
              onClick={handleLiveSupportChat}
              className="neu-btn-primary font-black text-xs py-2.5 px-3.5 rounded-xl active:scale-95 transition-all border-0 flex items-center gap-1.5 shrink-0"
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
          className="neu-raised rounded-[24px] p-5 border-0"
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3">
            {isBn ? 'পেমেন্ট ভেরিফিকেশন প্রুফ' : 'Submit Payment Proof'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-1.5 transition-colors">
                {isBn ? 'যে নাম্বার থেকে টাকা পাঠিয়েছেন' : 'Sender Number'}
              </label>
              <input 
                type="text" 
                required
                value={senderNo}
                onChange={(e) => setSenderNo(e.target.value)}
                className="w-full neu-input rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none border-0 transition-all" 
                placeholder="01XXXXXXXXX" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-1.5 transition-colors">
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
                  className="w-full neu-sunken border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 hover:border-primary-500/40 cursor-pointer"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  ) : screenshotUrl ? (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-black">
                      <CheckCircle2 size={16} />
                      {isBn ? 'স্ক্রিনশট সংযুক্ত হয়েছে' : 'Screenshot Attached'}
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-gray-400" />
                      <span className="text-xs font-black text-gray-500 dark:text-gray-400">
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
              className="w-full neu-btn-primary disabled:opacity-50 text-white py-3.5 rounded-2xl font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-0"
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
            className="neu-raised rounded-[28px] p-6 max-w-sm w-full border-0 shadow-none"
          >
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-inner">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-black text-center text-gray-900 dark:text-white mb-2">
              {isBn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}
            </h3>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-bold mb-6 leading-relaxed">
              {isBn 
                ? 'ডিপোজিট সাবমিট করার আগে নিশ্চিত করুন আপনি সঠিক সেন্ডার নাম্বার দিয়েছেন এবং যথাযথ পেমেন্ট করেছেন। ভুল তথ্যে রিকোয়েস্ট বাতিল হবে।' 
                : 'Ensure the sender number is correct before submitting. Incorrect details will result in automated rejection.'}
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-black text-xs neu-btn border-0"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                type="button"
                onClick={processDeposit}
                className="flex-1 py-3 rounded-xl font-black text-xs neu-btn-primary border-0"
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
