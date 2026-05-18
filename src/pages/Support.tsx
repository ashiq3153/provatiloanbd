import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Send, Phone, Mail, FileText } from 'lucide-react';
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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors pt-6 pb-24 px-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageCircle className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">
            {isBn ? 'সাপোর্ট ও সাহায্য' : 'Support & Help'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {isBn ? 'যেকোনো প্রয়োজনে আমরা আছি' : "We're here to help"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <button className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Phone size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{isBn ? 'কল করুন' : 'Call Us'}</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <MessageCircle size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{isBn ? 'লাইভ চ্যাট' : 'Live Chat'}</span>
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={18} />
          {isBn ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-colors"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm pr-4">
                  {faq.q}
                </span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-5 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full" />
        
        <h3 className="text-white font-bold mb-2 relative z-10">
          {isBn ? 'আরও তথ্য জানতে' : 'Need more info?'}
        </h3>
        <p className="text-gray-400 text-xs mb-4 relative z-10">
          {isBn ? 'আমাদের সাপোর্ট টিমের সাথে কথা বলুন, আমরা ২৪/৭ আছি আপনার সেবায়।' : 'Talk to our support team, we are available 24/7 at your service.'}
        </p>
        <button className="w-full bg-white text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 relative z-10 hover:bg-gray-100 transition-colors">
          <Send size={16} />
          {isBn ? 'ম্যাসেজ পাঠান' : 'Send Message'}
        </button>
      </div>

    </div>
  );
}
