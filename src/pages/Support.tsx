import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, Send, FileText, Loader2, ArrowLeft, Paperclip, X } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { getTelegramUser } from '../lib/telegram';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { uploadDocument } from '../lib/api';
import { toast } from 'sonner';

interface SupportMessage {
  id: string;
  chat_id: number;
  sender: 'user' | 'admin';
  message: string;
  created_at: string;
  reply_to?: string | null;
  is_edited?: boolean;
  is_seen?: boolean;
  attachment_url?: string | null;
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
  const [replyingTo, setReplyingTo] = useState<SupportMessage | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isBn ? '৫ এমবির বড় ফাইল আপলোড করা যাবে না!' : 'File size cannot exceed 5MB!');
        return;
      }
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

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
        // Mark any unseen admin messages as seen
        const unseenAdminMsgs = data.filter(m => m.sender === 'admin' && !m.is_seen);
        if (unseenAdminMsgs.length > 0) {
          await supabase
            .from('support_messages')
            .update({ is_seen: true })
            .in('id', unseenAdminMsgs.map(m => m.id));
        }
      }
    } catch (err) {
      console.error('Error fetching support messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Verify and ensure user profile exists before message operations
  const ensureProfileExists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('chat_id')
        .eq('chat_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking profile:", error);
        return;
      }

      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            chat_id: user.id,
            first_name: user.first_name || 'Guest',
            last_name: user.last_name || null,
            username: user.username || null,
            photo_url: user.photo_url || null,
            is_banned: false
          });
        if (insertError) {
          console.error("Error creating profile:", insertError);
        }
      }
    } catch (e) {
      console.error("Unexpected profile check error:", e);
    }
  };

  // Auto-scroll to bottom using scrollTop to avoid shifting parent layout
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load, profile check, prefilled message check, and Realtime Subscription
  useEffect(() => {
    let active = true;

    const initializeChat = async () => {
      await ensureProfileExists();
      if (!active) return;

      // Check and send prefilled message if any
      const prefilledMsg = location.state?.prefilledMsg || localStorage.getItem('pending_support_msg');
      if (prefilledMsg) {
        if (location.state?.prefilledMsg) {
          navigate(location.pathname, { replace: true, state: {} });
        }
        localStorage.removeItem('pending_support_msg');

        try {
          await supabase.from('support_messages').insert({
            chat_id: user.id,
            sender: 'user',
            message: prefilledMsg
          });
        } catch (err) {
          console.error('Error sending prefilled message:', err);
        }
      }

      await fetchMessages(true);
    };

    initializeChat();

    // Set up Supabase Realtime channel subscription for support messages
    const channel = supabase
      .channel(`support_messages_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as SupportMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // If it's from admin, mark it as seen immediately
            if (newMsg.sender === 'admin') {
              supabase.from('support_messages').update({ is_seen: true }).eq('id', newMsg.id).then();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as SupportMessage;
            setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMessages((prev) => prev.filter(m => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Set up Realtime Presence/Broadcast for Typing Indicator
    const typingChannel = supabase.channel(`typing_chat_${user.id}`);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.sender === 'admin') {
          setAdminTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setAdminTyping(false);
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user.id, location.state]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    const textToSend = newMessage;
    const fileToUpload = selectedFile;

    setNewMessage('');
    clearSelectedFile();
    setSending(true);

    try {
      let attachmentUrl = null;
      if (fileToUpload) {
        attachmentUrl = await uploadDocument(fileToUpload, user.id, 'support_chat');
        if (!attachmentUrl) {
          toast.error(isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে!' : 'File upload failed!');
          setSending(false);
          return;
        }
      }

      const { error } = await supabase.from('support_messages').insert({
        chat_id: user.id,
        sender: 'user',
        message: textToSend,
        reply_to: replyingTo?.id || null,
        attachment_url: attachmentUrl
      });

      if (error) {
        console.error('Error sending message:', error);
        toast.error(isBn ? 'মেসেজ পাঠানো যায়নি!' : 'Failed to send message!');
      } else {
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    // Broadcast typing event
    supabase.channel(`typing_chat_${user.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: 'user' }
    });
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
    <div className="h-full w-full overflow-hidden neu-bg flex flex-col relative transition-colors">
      {/* Premium Neumorphic Header */}
      <div className="px-5 py-4 sticky top-0 z-30 flex items-center gap-4 shrink-0 bg-transparent">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full neu-btn flex items-center justify-center text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'সহায়তা ও চ্যাট' : 'Support & Chat'}
          </h1>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 transition-colors">
            {isBn ? 'যেকোনো প্রয়োজনে আমরা আছি' : "We're here to help"}
          </p>
        </div>
      </div>

      {/* Neumorphic Segmented Tab Switch */}
      <div className="px-5 py-1.5 shrink-0 bg-transparent">
        <div className="neu-sunken p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
              activeTab === 'chat'
                ? 'neu-btn-primary'
                : 'text-gray-500 dark:text-gray-400 bg-transparent hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <MessageCircle size={14} />
            {isBn ? 'লাইভ চ্যাট' : 'Live Chat'}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
              activeTab === 'faq'
                ? 'neu-btn-primary'
                : 'text-gray-500 dark:text-gray-400 bg-transparent hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <FileText size={14} />
            {isBn ? 'সাধারণ জিজ্ঞাসা' : 'FAQs'}
          </button>
        </div>
      </div>

      {/* Direct Contact Bar - Neumorphic style */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 bg-transparent">
        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isBn ? 'সরাসরি যোগাযোগ:' : 'Direct Contact:'}
        </span>
        <div className="flex gap-2.5">
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer neu-raised-sm"
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
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/15 text-[#0088cc] dark:text-[#33a3fc] border border-blue-500/25 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer neu-raised-sm"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.327-2.95-.924c-.642-.2-1.042-.642-.042-1.032l11.536-4.444c.536-.2 1.002.12.871.745z" />
            </svg>
            <span>Telegram</span>
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-transparent">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
            {/* Help Topics Row - Neumorphic visual badges */}
            <div className="px-5 py-2 overflow-x-auto shrink-0 flex gap-3.5 hide-scrollbar">
              {[
                { id: 1, type: 'orange', labelBn: 'ডিপোজিট সমস্যা', labelEn: 'Deposit Issue', text: 'আমি ডিপোজিট করতে চাই, পেমেন্ট নম্বর দিন।' },
                { id: 2, type: 'purple', labelBn: 'ঋণ অনুমোদন', labelEn: 'Loan Approval', text: 'আমার লোন আবেদনটি কতক্ষণে অনুমোদিত হবে?' },
                { id: 3, type: 'green', labelBn: 'উত্তোলন সাহায্য', labelEn: 'Withdraw Help', text: 'অনুমোদিত লোন কিভাবে উত্তোলন করব?' },
                { id: 7, type: 'red', labelBn: 'ইএমআই কিস্তি', labelEn: 'EMI Payment', text: 'কিস্তি পরিশোধের নিয়ম ও মাধ্যম কি?' }
              ].map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setNewMessage(topic.text)}
                  className="neu-raised-sm rounded-[20px] p-2.5 flex items-center gap-2.5 shrink-0 transition-all hover:scale-[1.02] active:scale-95 text-left border-0 cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center select-none ${
                    topic.type === 'orange' ? 'neu-badge-orange' :
                    topic.type === 'purple' ? 'neu-badge-purple' :
                    topic.type === 'green' ? 'neu-badge-green' :
                    'neu-badge-red'
                  }`}>
                    {topic.id}
                  </div>
                  <div>
                    <span className="text-[10px] block font-black text-gray-800 dark:text-gray-200">
                      {isBn ? topic.labelBn : topic.labelEn}
                    </span>
                    <span className="text-[8px] block text-gray-400 dark:text-gray-500 font-bold truncate max-w-[90px] mt-0.5">
                      {topic.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="animate-spin text-primary-500" size={24} />
                  <span className="text-xs font-bold">{isBn ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 neu-sunken rounded-2xl flex items-center justify-center text-primary-500 mb-4 shadow-inner">
                    <MessageCircle size={28} />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base mb-1">
                    {isBn ? 'আমাদের চ্যাট সাপোর্ট' : 'Live Support Chat'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed font-semibold">
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
                      className={`flex gap-2 items-end ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full neu-raised-sm flex items-center justify-center overflow-hidden shrink-0 border border-white/40 bg-white">
                          <img 
                            src={logoImg} 
                            alt="Support Agent"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className={`max-w-[75%] rounded-[20px] px-4 py-2.5 shadow-sm relative group ${
                        isUser 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none user-bubble-tail font-semibold' 
                          : 'neu-raised rounded-bl-none text-gray-900 dark:text-white admin-bubble-tail font-semibold'
                      }`}>
                        {msg.reply_to && (
                          <div className={`mb-2 pl-2 border-l-2 text-xs opacity-75 rounded bg-black/5 dark:bg-white/5 p-1 ${isUser ? 'border-blue-300' : 'border-gray-400'}`}>
                            {messages.find(m => m.id === msg.reply_to)?.message || 'Original message deleted'}
                          </div>
                        )}
                        {msg.attachment_url && (
                          <div className="mb-2 max-w-full rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedImage(msg.attachment_url || null)}>
                            <img src={msg.attachment_url} alt="Attachment" className="max-h-48 w-full object-cover rounded-lg hover:scale-[1.02] transition-transform" />
                          </div>
                        )}
                        {msg.message && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>}
                        
                        <div className={`flex items-center justify-end gap-1 mt-1.5 ${isUser ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                          {msg.is_edited && <span className="text-[8px] italic opacity-75 mr-1">edited</span>}
                          <span className="text-[8px] font-black opacity-65">
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isUser && (
                            <span className="text-[10px]">
                              {msg.is_seen ? <span className="text-blue-300">✓✓</span> : <span className="opacity-70">✓</span>}
                            </span>
                          )}
                        </div>

                        {/* Reply Button on Hover */}
                        <button 
                          onClick={() => setReplyingTo(msg)}
                          className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/20 ${isUser ? '-left-8 text-gray-500 dark:text-gray-400' : '-right-8 text-gray-500 dark:text-gray-400'}`}
                          title="Reply"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                        </button>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-full neu-raised-sm flex items-center justify-center overflow-hidden shrink-0 border border-white/40">
                          {user?.photo_url ? (
                            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase select-none">
                              {(user?.first_name || 'U').charAt(0)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Typing Indicator */}
            {adminTyping && (
              <div className="px-5 py-1 text-xs text-gray-500 dark:text-gray-400 font-semibold animate-pulse">
                {isBn ? 'অ্যাডমিন টাইপ করছেন...' : 'Admin is typing...'}
              </div>
            )}

            {/* Replying To Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center z-20 relative">
                <div className="text-xs truncate text-gray-600 dark:text-gray-300">
                  <span className="font-bold text-primary-500">{replyingTo.sender === 'user' ? 'You' : 'Admin'}: </span>
                  {replyingTo.message}
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="px-4 py-3 bg-gray-55 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 relative z-20">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={filePreviewUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-750 dark:text-gray-200 truncate max-w-[150px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={clearSelectedFile}
                  className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-colors cursor-pointer border-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 flex gap-2.5 items-center transition-colors relative z-10 bg-transparent shrink-0"
            >
              {/* Attachment Button */}
              <label className="w-11 h-11 rounded-full neu-btn flex items-center justify-center cursor-pointer active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 shrink-0 border-0">
                <Paperclip size={18} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>

              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder={isBn ? 'মেসেজ লিখুন...' : 'Type a message...'}
                className="flex-1 neu-input rounded-2xl px-4 py-3 text-sm outline-none text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 font-bold"
              />
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedFile) || sending}
                className="w-11 h-11 neu-btn-primary disabled:opacity-50 text-white rounded-full flex items-center justify-center active:scale-95 transition-all shrink-0 border-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4.5 custom-scrollbar">
            {/* FAQ List */}
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`neu-raised transition-all duration-300 rounded-[20px] overflow-hidden ${openFaq === index ? 'border-primary-400 dark:border-primary-600' : ''}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none bg-transparent border-0 cursor-pointer"
                >
                  <span className={`font-black text-xs pr-4 transition-colors ${openFaq === index ? 'text-primary-600 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full neu-btn flex items-center justify-center shrink-0`}>
                    <ChevronDown 
                      size={14} 
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
                      <div className="p-4.5 pt-0 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-bold">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* View Full Terms & Guidelines Card - Neumorphic Style */}
            <div className="neu-raised p-5 rounded-[24px] text-center mt-6 transition-all">
              <h4 className="font-extrabold text-gray-900 dark:text-white text-xs mb-1.5">
                {isBn ? 'বিস্তারিত নীতিমালা ও নির্দেশিকা' : 'Complete Policies & Guidelines'}
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4 max-w-xs mx-auto leading-relaxed font-bold">
                {isBn 
                  ? 'সমিতির ঋণ নিয়মনীতি, প্রসেসিং ফি, লোন উত্তোলন সীমা, গোপনীয়তা এবং ব্যবহারকারীর আইনি দায়বদ্ধতা সম্পর্কে বিস্তারিত পড়ুন।' 
                  : 'Read the complete terms regarding cooperative loan rules, processing fees, withdrawal limits, privacy, and legal declarations.'}
              </p>
              <button
                onClick={() => navigate('/terms')}
                className="inline-flex items-center justify-center neu-btn-primary font-black py-2.5 px-5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer border-0"
              >
                {isBn ? 'নীতিমালা ও শর্তাবলী দেখুন' : 'View Terms & Conditions'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border-0 cursor-pointer"
            >
              <X size={20} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              src={selectedImage} 
              alt="Attachment Full View" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
