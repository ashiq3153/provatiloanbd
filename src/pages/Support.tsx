import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Send, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { getTelegramUser } from '../lib/telegram';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

interface SupportMessage {
  id: string;
  chat_id: number;
  sender: 'user' | 'admin';
  message: string;
  created_at: string;
}

export default function Support() {
  const { language, systemSettings } = useAppStore();
  const isBn = language === 'bn';
  const telegramUrl = systemSettings?.telegramSupport || 'https://t.me/Provati_Loan';
  const whatsappUrl = systemSettings?.whatsappSupport || 'https://wa.me/8801700000000';
  const user = getTelegramUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<any>(null);

  const faqs = [
    {
      q: isBn ? "লোন প্রসেসিং ফি এবং সঞ্চয় আমানত কত এবং কেন দিতে হয়?" : "What are the processing fees and savings deposits?",
      a: isBn 
        ? "আমাদের সমবায় নীতিমালা অনুযায়ী, আবেদন যাচাইয়ের জন্য ১% প্রসেসিং ফি (১০ লাখ টাকার উপরে ০.৫%) জমা দিতে হয়। এটি সম্পূর্ণ অফেরতযোগ্য। এছাড়া সদস্যদের আমানত সুরক্ষার্থে লোনের ১০% (৫ লাখ টাকার উপরে ৫%) সঞ্চয় আমানত হিসেবে জমা রাখা বাধ্যতামূলক। এই সঞ্চয় আপনার একাউন্টেই জমা থাকে এবং সুরক্ষিত থাকে।" 
        : "According to cooperative bylaws, a 1% processing fee (0.5% for loans above 1M BDT) is required to review files and is non-refundable. In addition, a 10% savings deposit (5% for loans above 500k BDT) must be funded to secure credit limits. These savings remain safely locked in your account."
    },
    {
      q: isBn ? "লোন চূড়ান্ত অনুমোদন হতে কত সময় লাগে?" : "How long does loan approval take?",
      a: isBn 
        ? "ডিপোজিট প্রমাণপত্র ও প্রয়োজনীয় ডকুমেন্টস সাবমিট করার পর, তথ্য সঠিক থাকলে ১২ থেকে ২৪ ঘণ্টার মধ্যে ফাইলটি অনুমোদিত হয়। কোনো ভুল বা অস্পষ্টতা থাকলে সংশোধন নোট পাঠানো হয় যা আপনার টেলিগ্রামে তাৎক্ষণিক নোটিফাই করা হয়।" 
        : "Once deposit proof and required files are submitted, verification takes 12 to 24 hours. If clarifications are needed, revision comments are issued and immediately sent to your Telegram."
    },
    {
      q: isBn ? "আমি লোন পাওয়ার পর কিভাবে টাকা উত্তোলন করব?" : "How can I withdraw my approved loan?",
      a: isBn 
        ? "লোন অনুমোদনের পর অনুমোদিত অর্থ আপনার 'মোট ব্যালেন্স' এ চলে যাবে। আপনি সেখান থেকে উইথড্র রিকোয়েস্ট দিতে পারবেন যা এডমিন প্যানেল ভেরিফাই করে আপনার একাউন্টে পাঠিয়ে দেবে। উত্তোলনের পর মোট ব্যালেন্স হ্রাস পাবে কিন্তু সঞ্চয় ব্যালেন্স সম্পূর্ণ অপরিবর্তিত থাকবে।" 
        : "After approval, the funds credit to your 'Total Balance'. You can request withdrawals, which admins disburse manually. Withdrawing reduces your Total Balance, but your Savings Balance remains untouched."
    },
    {
      q: isBn ? "আমার একাউন্ট স্থগিত বা সাসপেন্ড হওয়ার কারণ কি?" : "Why would my account be suspended or banned?",
      a: isBn 
        ? "ভুয়া স্ক্রিনশট বা অন্য কারো ট্রানজেকশন আইডি ব্যবহার করা, ডুপ্লিকেট একাউন্ট তৈরি করা, অথবা সময়মত ইএমআই পরিশোধ না করা হলে অ্যাকাউন্ট স্থায়ীভাবে বাতিল হতে পারে। সাসপেন্ডেড একাউন্ট থেকে কোনো আবেদন বা লেনদেন পরিচালনা করা যাবে না।" 
        : "Attempting fraud (fake screenshot uploads, duplicate transaction keys, impersonation) or default on EMI payments triggers profile suspension. Banned users are restricted from loan submissions or balance checks."
    }
  ];

  // Fetch messages from Supabase
  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching support messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load and polling
  useEffect(() => {
    fetchMessages(true);

    // Set up polling every 3 seconds
    pollingInterval.current = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [user.id]);

  // Check for prefilled message
  useEffect(() => {
    const checkPrefilled = async () => {
      // Get message from route state or localStorage
      const prefilledMsg = location.state?.prefilledMsg || localStorage.getItem('pending_support_msg');
      if (prefilledMsg) {
        // Clear immediately to prevent double sending
        if (location.state?.prefilledMsg) {
          navigate(location.pathname, { replace: true, state: {} });
        }
        localStorage.removeItem('pending_support_msg');

        // Send message
        try {
          await supabase.from('support_messages').insert({
            chat_id: user.id,
            sender: 'user',
            message: prefilledMsg
          });
          fetchMessages(false);
        } catch (err) {
          console.error('Error sending prefilled message:', err);
        }
      }
    };
    checkPrefilled();
  }, [location.state]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const textToSend = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase.from('support_messages').insert({
        chat_id: user.id,
        sender: 'user',
        message: textToSend
      });

      if (!error) {
        // Optimistic update
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            chat_id: user.id,
            sender: 'user',
            message: textToSend,
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        console.error('Error sending message:', error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors pb-24 h-screen">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'সহায়তা ও চ্যাট' : 'Support & Chat'}
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
            {isBn ? 'যেকোনো প্রয়োজনে আমরা আছি' : "We're here to help"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700 transition-colors flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
          }`}
        >
          <MessageCircle size={16} />
          {isBn ? 'লাইভ চ্যাট' : 'Live Chat'}
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'faq'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
          }`}
        >
          <FileText size={16} />
          {isBn ? 'সাধারণ জিজ্ঞাসা' : 'FAQs'}
        </button>
      </div>

      {/* Direct Contact Bar */}
      <div className="bg-white dark:bg-gray-800 px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center justify-between gap-3 shrink-0">
        <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isBn ? 'সরাসরি যোগাযোগ:' : 'Direct Contact:'}
        </span>
        <div className="flex gap-2">
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.486 1.86 14.024 1.81 11.998 1.81 6.558 1.81 2.138 6.23 2.134 11.671c-.001 1.693.447 3.346 1.298 4.843l-.999 3.648 3.622-.968z" />
            </svg>
            <span>WhatsApp</span>
          </a>
          <a 
            href={telegramUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.327-2.95-.924c-.642-.2-1.042-.642-.042-1.032l11.536-4.444c.536-.2 1.002.12.871.745z" />
            </svg>
            <span>Telegram</span>
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="animate-spin text-primary-500" size={24} />
                  <span className="text-xs font-semibold">{isBn ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-500 mb-4 shadow-inner">
                    <MessageCircle size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    {isBn ? 'আমাদের চ্যাট সাপোর্ট' : 'Live Support Chat'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed">
                    {isBn 
                      ? 'ডিপোজিটের পেমেন্ট নির্দেশনা বা যেকোনো সাহায্যের জন্য নিচে মেসেজ লিখুন।' 
                      : 'Write a message below for payment details or general support.'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-[20px] px-4 py-3 shadow-sm ${
                        isUser 
                          ? 'bg-primary-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-800'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                        <span className={`text-[9px] block text-right mt-1.5 opacity-65 font-semibold ${
                          isUser ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form 
              onSubmit={handleSendMessage}
              className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 flex gap-2 items-center transition-colors relative z-10"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isBn ? 'মেসেজ লিখুন...' : 'Type a message...'}
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 text-gray-900 dark:text-white transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md shadow-primary-500/20 shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {/* FAQ List */}
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

            {/* View Full Terms & Guidelines Card */}
            <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800/40 dark:to-gray-900/30 p-5 rounded-[24px] border border-primary-100/50 dark:border-gray-800 text-center mt-6 transition-all">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">
                {isBn ? 'বিস্তারিত নীতিমালা ও নির্দেশিকা' : 'Complete Policies & Guidelines'}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
                {isBn 
                  ? 'সমিতির ঋণ নিয়মনীতি, প্রসেসিং ফি, লোন উত্তোলন সীমা, গোপনীয়তা এবং ব্যবহারকারীর আইনি দায়বদ্ধতা সম্পর্কে বিস্তারিত পড়ুন।' 
                  : 'Read the complete terms regarding cooperative loan rules, processing fees, withdrawal limits, privacy, and legal declarations.'}
              </p>
              <button
                onClick={() => navigate('/terms')}
                className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-primary-500/10 active:scale-95 transition-all cursor-pointer"
              >
                {isBn ? 'নীতিমালা ও শর্তাবলী দেখুন' : 'View Terms & Conditions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
