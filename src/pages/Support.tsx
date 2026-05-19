import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Send, FileText, HelpCircle, PhoneCall } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function Support() {
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: isBn ? "আমি কিভাবে লোনের জন্য আবেদন করব?" : "How do I apply for a loan?",
      a: isBn ? "অ্যাপের 'Apply' বা 'আবেদন' অপশনে গিয়ে প্রয়োজনীয় তথ্য ও ডকুমেন্টস দিয়ে সহজেই আবেদন করতে পারবেন।" : "You can easily apply by going to the 'Apply' section and providing the necessary information and documents."
    },
    {
      q: isBn ? "লোন এপ্রুভ হতে কত সময় লাগে?" : "How long does it take for a loan to be approved?",
      a: isBn ? "সাধারণত ২৪ থেকে ৪৮ ঘন্টা সময় লাগে। তবে ডকুমেন্টস সঠিক থাকলে ১২ ঘন্টার মধ্যেও এপ্রুভ হতে পারে।" : "It usually takes 24 to 48 hours. However, if the documents are correct, it can be approved within 12 hours."
    },
    {
      q: isBn ? "আপনাদের সার্ভিস চার্জ কত?" : "What is your service charge?",
      a: isBn ? "আমাদের কোন হিডেন ফি নেই। লোন আবেদনের সময় ট্রান্সপারেন্টভাবে সব চার্জ দেখানো হয়।" : "We have no hidden fees. All charges are shown transparently during the loan application."
    },
    {
      q: isBn ? "আমি কি আংশিক লোন পরিশোধ করতে পারি?" : "Can I make partial loan payments?",
      a: isBn ? "হ্যাঁ, আপনি যেকোনো সময় আংশিক বা সম্পূর্ণ লোন পরিশোধ করতে পারবেন কোন অতিরিক্ত জরিমানা ছাড়া।" : "Yes, you can make partial or full payments at any time without any extra penalty."
    }
  ];

  const openTelegram = () => {
    const telegram = useAppStore.getState().systemSettings?.telegramSupport || 'https://t.me/Provati_Loan';
    window.open(telegram, '_blank');
  };

  const openWhatsApp = () => {
    const whatsapp = useAppStore.getState().systemSettings?.whatsappSupport || 'https://wa.me/8801700000000';
    window.open(whatsapp, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors pb-24">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <HelpCircle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? 'সাপোর্ট ও সাহায্য' : 'Support & Help'}
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
              {isBn ? 'যেকোনো প্রয়োজনে আমরা আছি' : "We're here to help"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">
        
        {/* Contact Channels */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openWhatsApp} 
            className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#25D366]/5 rounded-bl-full -mr-10 -mt-10 z-0"></div>
            <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} className="text-[#25D366]" />
            </div>
            <div className="relative z-10 text-center">
              <span className="text-base font-bold text-gray-900 dark:text-white block mb-0.5">{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{isBn ? 'মেসেজ করুন' : 'Send message'}</span>
            </div>
          </motion.button>
          
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openTelegram} 
            className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0088cc]/5 rounded-bl-full -mr-10 -mt-10 z-0"></div>
            <div className="w-14 h-14 rounded-full bg-[#0088cc]/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
              <Send size={24} className="text-[#0088cc] ml-1" />
            </div>
            <div className="relative z-10 text-center">
              <span className="text-base font-bold text-gray-900 dark:text-white block mb-0.5">{isBn ? 'টেলিগ্রাম' : 'Telegram'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{isBn ? 'সাপোর্ট চ্যাট' : 'Support chat'}</span>
            </div>
          </motion.button>
        </div>

        {/* Support Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 z-0"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 blur-2xl rounded-full -ml-10 -mb-10 z-0"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shrink-0">
              <PhoneCall size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">
                {isBn ? '২৪/৭ লাইভ সাপোর্ট' : '24/7 Live Support'}
              </h3>
              <p className="text-primary-100 text-xs leading-relaxed">
                {isBn ? 'আমাদের এক্সপার্ট টিম সবসময় প্রস্তুত আপনার যেকোনো সমস্যা সমাধানে।' : 'Our expert team is always ready to solve any of your problems.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <FileText size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isBn ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`bg-white dark:bg-gray-800 border transition-all duration-300 rounded-[20px] overflow-hidden shadow-sm ${openFaq === index ? 'border-primary-300 dark:border-primary-700 ring-4 ring-primary-50 dark:ring-primary-900/20' : 'border-gray-100 dark:border-gray-700'}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className={`font-bold text-sm pr-4 transition-colors ${openFaq === index ? 'text-primary-600 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === index ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-400'}`}>
                    <ChevronDown 
                      size={18} 
                      className={`transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </button>
                
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
