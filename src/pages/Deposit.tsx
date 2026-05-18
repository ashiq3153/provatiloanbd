import { ArrowLeft, MessageCircle, Send, UploadCloud, AlertCircle, Landmark, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { toast } from 'sonner';
import { getTelegramUser } from '../lib/telegram';
import { createTransaction, uploadDocument } from '../lib/api';

const paymentMethods = [
  { id: 'bkash', name: 'bKash', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Bkash_logo.svg', color: 'bg-[#e2136e]', text: 'text-[#e2136e]', bgLight: 'bg-[#e2136e]/10', border: 'border-[#e2136e]/30' },
  { id: 'nagad', name: 'Nagad', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Nagad_Logo.svg', color: 'bg-[#f7931e]', text: 'text-[#f7931e]', bgLight: 'bg-[#f7931e]/10', border: 'border-[#f7931e]/30' },
  { id: 'rocket', name: 'Rocket', logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D104E752-seeklogo.com.png', color: 'bg-[#8c1596]', text: 'text-[#8c1596]', bgLight: 'bg-[#8c1596]/10', border: 'border-[#8c1596]/30' },
  { id: 'bank', name: 'Bank Account', icon: true, color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'visa', name: 'Visa Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg', color: 'bg-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-50', border: 'border-indigo-200' },
];

export default function Deposit() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  const [method, setMethod] = useState(paymentMethods[0].id);
  const [depositType, setDepositType] = useState('processing');
  const [amount, setAmount] = useState('');
  const [senderNo, setSenderNo] = useState('');
  const [trxId, setTrxId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Handlers for social
  const openTelegram = () => {
    const telegram = useAppStore.getState().systemSettings?.telegramSupport || 'https://t.me/Provati_Loan';
    window.open(telegram, '_blank');
  };
  const openWhatsApp = () => {
    const whatsapp = useAppStore.getState().systemSettings?.whatsappSupport || 'https://wa.me/8801700000000';
    window.open(whatsapp, '_blank');
  };

  const selectedMethod = paymentMethods.find((m) => m.id === method);


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
      <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-sm w-full transition-colors"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">
            {isBn ? 'ধন্যবাদ!' : 'Thank You!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed mb-6 transition-colors">
            {isBn 
              ? 'আপনার ডিপোজিট রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে। আমাদের এডমিন প্যানেল এটি ভেরিফাই করছে।' 
              : 'Your deposit request has been submitted successfully. Our admin panel is verifying it.'}
          </p>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/40 mb-6 transition-colors">
            <p className="text-sm font-bold text-orange-800 dark:text-orange-300 transition-colors">
              {isBn ? 'আপডেট সময়' : 'Estimated Update Time'}
            </p>
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1 transition-colors">
              {isBn ? 'সাধারণত ২০-৩০ মিনিটের মধ্যে আপডেট হয়ে যাবে।' : 'Usually updates within 20-30 minutes.'}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/40 mb-6 transition-colors flex gap-3 text-left">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300 transition-colors">
                {isBn ? 'গুরুত্বপূর্ণ সতর্কতা' : 'Important Warning'}
              </p>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1 transition-colors">
                {isBn ? 'আপনার TrxID এবং সেন্ডার নাম্বারটি সংরক্ষণ করে রাখুন। ভুয়া বা এডিট করা স্ক্রিনশট দিলে একাউন্ট সাসপেন্ড করা হবে।' : 'Keep your TrxID and Sender Number safe. Submitting fake or edited screenshots will result in account suspension.'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            {isBn ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors">
      <div className="bg-white dark:bg-gray-800 px-5 pt-5 pb-4 sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full active:scale-95 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? 'ডিপোজিট করুন' : 'Deposit'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
              {isBn ? 'সিকিউরিটি মানি বা ফি প্রদান' : 'Pay Security Money or Fee'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 pb-6 space-y-6">
        
        {/* Step 1: Select Method */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 transition-colors">
              {isBn ? '১. পেমেন্ট মেথড নির্বাচন করুন' : '1. Select Payment Method'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
              {isBn ? 'যেকোনো একটি মাধ্যম নির্বাচন করুন' : 'Choose any one of the methods'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  method === m.id ? `${m.border} ${m.bgLight} ${m.text}` : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {m.logo ? (
                  <img src={m.logo} alt={m.name} className="h-8 object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${method === m.id ? m.bgLight : 'bg-gray-200 dark:bg-gray-600'}`}>
                    <Landmark size={18} />
                  </div>
                )}
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Contact Support */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 transition-colors">
              {isBn ? '২. পেমেন্ট নাম্বার সংগ্রহ করুন' : '2. Get Payment Number'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
              {isBn ? 'পেমেন্ট নাম্বার পেতে সাপোর্ট টিমের সাথে যোগাযোগ করুন' : 'Contact Support team for Payment Number'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={openWhatsApp} type="button" className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all">
              <MessageCircle size={18} /> {isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp Support'}
            </button>
            <button onClick={openTelegram} type="button" className="flex-1 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all">
              <Send size={18} /> {isBn ? 'টেলিগ্রাম' : 'Telegram Support'}
            </button>
          </div>
          <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/40 flex items-start gap-3 transition-colors">
              <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-800 dark:text-orange-300 leading-tight font-medium transition-colors">
                {isBn ? 'সাপোর্ট টিম থেকে নাম্বার সংগ্রহ করে পেমেন্ট সম্পূর্ণ করুন এবং নিচের ফর্মটি পূরণ করুন।' : 'Complete your payment to the number provided by support, then fill out the form below.'}
              </p>
          </div>
        </section>

        {/* Step 3: Payment Details */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="mb-5 border-b border-gray-100 dark:border-gray-700 pb-3 transition-colors">
             <h3 className="font-bold text-gray-900 dark:text-white mb-1 transition-colors">
               {isBn ? '৩. পেমেন্ট তথ্য দিন' : '3. Provide Payment Info'}
             </h3>
             <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
               {isBn ? 'পেমেন্ট করার পর তথ্যগুলো দিন' : 'Enter details after successful payment'}
             </p>
          </div>

          <form id="deposit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                {isBn ? 'ডিপোজিটের ধরন' : 'Deposit Type'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositType('processing')}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${depositType === 'processing' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                >
                  {isBn ? 'প্রসেসিং ফি' : 'Processing Fee'}
                </button>
                <button
                  type="button"
                  onClick={() => setDepositType('security')}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${depositType === 'security' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                >
                  {isBn ? 'সিকিউরিটি মানি' : 'Security Money'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                {isBn ? 'ডিপোজিটের পরিমাণ (৳)' : 'Deposit Amount (৳)'}
              </label>
              <input 
                type="number" 
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors" 
                placeholder="500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                {isBn ? 'যে নাম্বার থেকে টাকা পাঠিয়েছেন' : 'Sender Number'}
              </label>
              <input 
                type="text" 
                required
                value={senderNo}
                onChange={(e) => setSenderNo(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors" 
                placeholder="01XXXXXXXXX" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                {isBn ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
              </label>
              <input 
                type="text" 
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none uppercase font-mono transition-colors" 
                placeholder="A8B9C7D6E5" 
              />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 transition-colors">
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
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-800 transition-colors cursor-pointer"
                 >
                   {uploading ? (
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-1"></div>
                   ) : screenshotUrl ? (
                     <div className="flex flex-col items-center gap-1">
                       <CheckCircle2 size={24} className="text-green-500" />
                       <span className="text-xs font-bold text-green-600 dark:text-green-400">
                         {isBn ? 'স্ক্রিনশট আপলোড হয়েছে' : 'Screenshot Uploaded'}
                       </span>
                     </div>
                   ) : (
                     <>
                       <UploadCloud size={24} className="text-gray-400 dark:text-gray-500 transition-colors" />
                       <span className="text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors">
                         {isBn ? 'পেমেন্টের স্ক্রিনশট আপলোড করুন' : 'Upload payment screenshot'}
                       </span>
                     </>
                   )}
                 </label>
               </div>
            </div>
          </form>
        </section>

      </div>

      <div className="sticky bottom-0 left-0 right-0 p-5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-40 transition-colors">
        <button
          form="deposit-form"
          type="submit"
          disabled={!amount || Number(amount) <= 0 || !senderNo || !trxId || submitted}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-primary-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {submitted ? (isBn ? 'অপেক্ষা করুন...' : 'Please wait...') : (isBn ? 'সাবমিট করুন' : 'Submit')}
        </button>
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

