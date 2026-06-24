import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Users, FileText, Activity, CheckCircle, XCircle, Search, DollarSign, Trash2, Ban, Eye, Menu, X, LayoutDashboard, Settings, Star, Download, Upload, ClipboardCheck, Megaphone, ToggleLeft, ToggleRight, Landmark, CreditCard, ChevronRight, Clock, MessageCircle, Copy, ArrowLeft, Edit2 } from 'lucide-react';
import { getAllProfiles, getAllLoanApplications, getAllTransactions, updateLoanApplicationStatus, updateTransactionStatus, updateSystemSettings, getAllAdminSuccessStories, addSuccessStory, deleteSuccessStory, banUser, deleteUser } from '../../lib/adminApi';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../../types/database';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/store';
import { convertDigits, formatCurrency } from '../../lib/translation';
import { motion, AnimatePresence } from 'motion/react';
import { sendTelegramNotification } from '../../lib/telegram';
import { sendEmailNotification } from '../../lib/email';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'deposits' | 'withdrawals' | 'users' | 'stories' | 'settings' | 'chat' | 'broadcast'>('overview');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'payments' | 'announcements' | 'categories'>('general');

  // Broadcast & Direct Message State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastIncludeButton, setBroadcastIncludeButton] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStats, setBroadcastStats] = useState({ total: 0, delivered: 0, failed: 0 });
  const [broadcastProgress, setBroadcastProgress] = useState(0);

  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [directMessageUsers, setDirectMessageUsers] = useState<Profile[]>([]);
  const [directMessageText, setDirectMessageText] = useState('');
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  useEffect(() => {
    const channel = supabase.channel('online_users');
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds: number[] = [];
      for (const id in state) {
        if (state[id] && state[id].length > 0) {
          onlineIds.push(Number(id));
        }
      }
      setOnlineUsers(onlineIds);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const [flaggedPersonal, setFlaggedPersonal] = useState(false);
  const [flaggedProfessional, setFlaggedProfessional] = useState(false);
  const [flaggedBank, setFlaggedBank] = useState(false);
  const [flaggedNominee, setFlaggedNominee] = useState(false);
  const [flaggedDocuments, setFlaggedDocuments] = useState(false);

  useEffect(() => {
    if (selectedLoan) {
      let flagged = {
        personal: false,
        professional: false,
        bank: false,
        nominee: false,
        documents: false
      };
      if (selectedLoan.admin_feedback && selectedLoan.admin_feedback.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(selectedLoan.admin_feedback);
          if (parsed.flagged) {
            flagged = {
              personal: !!parsed.flagged.personal,
              professional: !!parsed.flagged.professional,
              bank: !!parsed.flagged.bank,
              nominee: !!parsed.flagged.nominee,
              documents: !!parsed.flagged.documents
            };
          }
        } catch (e) {}
      }
      setFlaggedPersonal(flagged.personal);
      setFlaggedProfessional(flagged.professional);
      setFlaggedBank(flagged.bank);
      setFlaggedNominee(flagged.nominee);
      setFlaggedDocuments(flagged.documents);
    } else {
      setFlaggedPersonal(false);
      setFlaggedProfessional(false);
      setFlaggedBank(false);
      setFlaggedNominee(false);
      setFlaggedDocuments(false);
    }
  }, [selectedLoan]);

  // Support Chat admin state
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replyingToMsg, setReplyingToMsg] = useState<any>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // New Story Form State
  const [newStory, setNewStory] = useState({
    name: '',
    loan_type: '',
    amount: '',
    approval_time: '',
    rating: 5,
    avatar_url: '',
    like_count: 0,
    dislike_count: 0,
    love_count: 0,
    loveit_count: 0,
    congratulation_count: 0,
    wow_count: 0,
    sad_count: 0,
    hundred_count: 0
  });
  
  const { systemSettings, setSystemSettings, language, setLanguage } = useAppStore();
  const isBn = language === 'bn';
  
  const copyToClipboard = (text: string | null | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(isBn ? 'ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Copied to clipboard!');
  };

  const formatAddress = (addressStr: string | null | undefined) => {
    if (!addressStr) return 'N/A';
    if (addressStr.trim().startsWith('{')) {
      try {
        const addr = JSON.parse(addressStr);
        const parts = [
          addr.village && `${isBn ? 'গ্রাম: ' : 'Village: '}${addr.village}`,
          addr.union && `${isBn ? 'ইউনিয়ন/পৌরসভা: ' : 'Union/Municipality: '}${addr.union}`,
          addr.postOffice && `${isBn ? 'পোস্ট অফিস: ' : 'Post Office: '}${addr.postOffice}`,
          addr.postCode && `${isBn ? 'পোস্ট কোড: ' : 'Post Code: '}${addr.postCode}`,
          addr.upazila && `${isBn ? 'উপজেলা: ' : 'Upazila: '}${addr.upazila}`,
          addr.district && `${isBn ? 'জেলা: ' : 'District: '}${addr.district}`,
          addr.division && `${isBn ? 'বিভাগ: ' : 'Division: '}${addr.division}`
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : addressStr;
      } catch (e) {
        return addressStr;
      }
    }
    return addressStr;
  };
  
  const [config, setConfig] = useState({
    processingFee: 1,
    securityDeposit: 10,
    insuranceEnabled: false,
    insuranceRate: 1.0,
    emailEnabled: false,
    resendApiKey: '',
    senderEmail: 'Provati Loan <noreply@provatiloanbd.com>',
    minRatePersonal: 0.55,
    minRateBusiness: 0.55,
    minRateExpat: 0.50,
    minRateStudent: 0.50,
    minRateEmergency: 0.60,
    minRateWomen: 0.55,
    telegramSupport: 'https://t.me/Provati_Loan',
    whatsappSupport: 'https://wa.me/8801700000000',
    telegramBotToken: '',

    // Announcement settings
    announcementActive: false,
    announcementBn: '',
    announcementEn: '',

    // Payment numbers settings
    bkashNo: '',
    bkashType: 'Personal',
    nagadNo: '',
    nagadType: 'Personal',
    rocketNo: '',
    rocketType: 'Personal',
    bankName: '',
    bankAccName: '',
    bankAccNo: '',
    bankBranch: '',
    bankRouting: '',
    visaNo: '',
    visaName: '',

    // Category bounds settings
    catPersonalEnabled: true,
    catPersonalMax: 500000,
    catPersonalMinTenure: 12,
    catPersonalMaxTenure: 60,

    catBusinessEnabled: true,
    catBusinessMax: 5000000,
    catBusinessMinTenure: 12,
    catBusinessMaxTenure: 120,

    catExpatEnabled: true,
    catExpatMax: 1000000,
    catExpatMinTenure: 24,
    catExpatMaxTenure: 72,

    catStudentEnabled: true,
    catStudentMax: 500000,
    catStudentMinTenure: 12,
    catStudentMaxTenure: 48,

    catEmergencyEnabled: true,
    catEmergencyMax: 100000,
    catEmergencyMinTenure: 6,
    catEmergencyMaxTenure: 24,

    catWomenEnabled: true,
    catWomenMax: 2000000,
    catWomenMinTenure: 12,
    catWomenMaxTenure: 84
  });

  useEffect(() => {
    if (systemSettings) {
      setConfig({
        processingFee: systemSettings.procFee ? systemSettings.procFee * 100 : 1,
        securityDeposit: systemSettings.secDeposit ? systemSettings.secDeposit * 100 : 10,
        insuranceEnabled: !!systemSettings.insuranceEnabled,
        insuranceRate: systemSettings.insuranceRate ? systemSettings.insuranceRate * 100 : 1.0,
        emailEnabled: !!systemSettings.emailEnabled,
        resendApiKey: systemSettings.resendApiKey || '',
        senderEmail: systemSettings.senderEmail || 'Provati Loan <noreply@provatiloanbd.com>',
        minRatePersonal: systemSettings.minRatePersonal ? systemSettings.minRatePersonal * 100 : 0.55,
        minRateBusiness: systemSettings.minRateBusiness ? systemSettings.minRateBusiness * 100 : 0.55,
        minRateExpat: systemSettings.minRateExpat ? systemSettings.minRateExpat * 100 : 0.50,
        minRateStudent: systemSettings.minRateStudent ? systemSettings.minRateStudent * 100 : 0.50,
        minRateEmergency: systemSettings.minRateEmergency ? systemSettings.minRateEmergency * 100 : 0.60,
        minRateWomen: systemSettings.minRateWomen ? systemSettings.minRateWomen * 100 : 0.55,
        telegramSupport: systemSettings.telegramSupport || 'https://t.me/Provati_Loan',
        whatsappSupport: systemSettings.whatsappSupport || 'https://wa.me/8801700000000',
        telegramBotToken: systemSettings.telegramBotToken || '',

        announcementActive: !!systemSettings.announcementActive,
        announcementBn: systemSettings.announcementBn || '',
        announcementEn: systemSettings.announcementEn || '',

        bkashNo: systemSettings.paymentNumbers?.bkash?.number || '',
        bkashType: systemSettings.paymentNumbers?.bkash?.type || 'Personal',
        nagadNo: systemSettings.paymentNumbers?.nagad?.number || '',
        nagadType: systemSettings.paymentNumbers?.nagad?.type || 'Personal',
        rocketNo: systemSettings.paymentNumbers?.rocket?.number || '',
        rocketType: systemSettings.paymentNumbers?.rocket?.type || 'Personal',
        bankName: systemSettings.paymentNumbers?.bank?.name || '',
        bankAccName: systemSettings.paymentNumbers?.bank?.accName || '',
        bankAccNo: systemSettings.paymentNumbers?.bank?.accNo || '',
        bankBranch: systemSettings.paymentNumbers?.bank?.branch || '',
        bankRouting: systemSettings.paymentNumbers?.bank?.routing || '',
        visaNo: systemSettings.paymentNumbers?.visa?.number || '',
        visaName: systemSettings.paymentNumbers?.visa?.name || '',

        catPersonalEnabled: systemSettings.categories?.personal?.enabled !== false,
        catPersonalMax: systemSettings.categories?.personal?.maxAmount || 500000,
        catPersonalMinTenure: systemSettings.categories?.personal?.minTenure || 12,
        catPersonalMaxTenure: systemSettings.categories?.personal?.maxTenure || 60,

        catBusinessEnabled: systemSettings.categories?.business?.enabled !== false,
        catBusinessMax: systemSettings.categories?.business?.maxAmount || 5000000,
        catBusinessMinTenure: systemSettings.categories?.business?.minTenure || 12,
        catBusinessMaxTenure: systemSettings.categories?.business?.maxTenure || 120,

        catExpatEnabled: systemSettings.categories?.expat?.enabled !== false,
        catExpatMax: systemSettings.categories?.expat?.maxAmount || 1000000,
        catExpatMinTenure: systemSettings.categories?.expat?.minTenure || 24,
        catExpatMaxTenure: systemSettings.categories?.expat?.maxTenure || 72,

        catStudentEnabled: systemSettings.categories?.student?.enabled !== false,
        catStudentMax: systemSettings.categories?.student?.maxAmount || 500000,
        catStudentMinTenure: systemSettings.categories?.student?.minTenure || 12,
        catStudentMaxTenure: systemSettings.categories?.student?.maxTenure || 48,

        catEmergencyEnabled: systemSettings.categories?.emergency?.enabled !== false,
        catEmergencyMax: systemSettings.categories?.emergency?.maxAmount || 100000,
        catEmergencyMinTenure: systemSettings.categories?.emergency?.minTenure || 6,
        catEmergencyMaxTenure: systemSettings.categories?.emergency?.maxTenure || 24,

        catWomenEnabled: systemSettings.categories?.women?.enabled !== false,
        catWomenMax: systemSettings.categories?.women?.maxAmount || 2000000,
        catWomenMinTenure: systemSettings.categories?.women?.minTenure || 12,
        catWomenMaxTenure: systemSettings.categories?.women?.maxTenure || 84
      });
    }
  }, [systemSettings]);

  useEffect(() => {
    fetchData();
  }, []);

  // ── Admin Online Presence ──────────────────────────────────────────────
  useEffect(() => {
    const setOnline = async () => {
      await supabase
        .from('admin_status')
        .update({ is_online: true, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', 1);
    };

    const setOffline = async () => {
      await supabase
        .from('admin_status')
        .update({ is_online: false, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', 1);
    };

    // Mark online immediately
    setOnline();

    // Heartbeat every 30 seconds to keep "online" fresh
    const heartbeat = setInterval(setOnline, 30_000);

    // Mark offline when admin closes tab or navigates away
    const handleBeforeUnload = () => { setOffline(); };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, l, t, s] = await Promise.all([
        getAllProfiles(),
        getAllLoanApplications(),
        getAllTransactions(),
        getAllAdminSuccessStories()
      ]);
      setProfiles(p);
      setLoans(l);
      setTransactions(t);
      setStories(s);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllChatData = async () => {
    try {
      const { data: allMsgs, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && allMsgs) {
        // Group messages by chat_id to get users list
        const userGroups: Record<number, any> = {};
        for (const msg of allMsgs) {
          if (!userGroups[msg.chat_id]) {
            const prof = profiles.find(p => p.chat_id === msg.chat_id);
            userGroups[msg.chat_id] = {
              chat_id: msg.chat_id,
              name: prof ? `${prof.first_name} ${prof.last_name || ''}` : `User #${msg.chat_id}`,
              avatar: prof?.photo_url || '',
              messages: [],
              latestMessageTime: msg.created_at
            };
          }
          userGroups[msg.chat_id].messages.push(msg);
          if (new Date(msg.created_at) > new Date(userGroups[msg.chat_id].latestMessageTime)) {
            userGroups[msg.chat_id].latestMessageTime = msg.created_at;
          }
        }

        // Sort user list by latest message time descending
        const sortedUsers = Object.values(userGroups).sort((a: any, b: any) => 
          new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime()
        );

        setChatUsers(sortedUsers);

        // If there's a selected user, update their messages and mark unseen as seen
        if (selectedChatId) {
          const selectedGroup = userGroups[selectedChatId];
          if (selectedGroup) {
            setChatMessages(selectedGroup.messages);
            
            // Mark user messages as seen
            const unseenUserMsgs = selectedGroup.messages.filter((m: any) => m.sender === 'user' && !m.is_seen);
            if (unseenUserMsgs.length > 0) {
              supabase
                .from('support_messages')
                .update({ is_seen: true })
                .in('id', unseenUserMsgs.map((m: any) => m.id))
                .then();
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching admin support chat:', err);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !adminReplyText.trim()) return;

    const replyMsg = adminReplyText;
    setAdminReplyText('');

    try {
      if (editingMsgId) {
        // Edit mode
        const { error } = await supabase.from('support_messages').update({
          message: replyMsg,
          is_edited: true
        }).eq('id', editingMsgId);

        if (!error) {
          setEditingMsgId(null);
        } else {
          console.error('Error editing admin reply:', error);
        }
      } else {
        // Send new mode
        const { error } = await supabase.from('support_messages').insert({
          chat_id: selectedChatId,
          sender: 'admin',
          message: replyMsg,
          reply_to: replyingToMsg?.id || null
        });

        if (!error) {
          setReplyingToMsg(null);
          
          // Send notification to user
          const miniAppUrl = import.meta.env.VITE_MINI_APP_URL || "https://provatiloanbd.vercel.app";
          const notificationMsg = `📩 <b>নতুন বার্তা এসেছে</b>\n\nPROVATI LOAN Support থেকে একটি নতুন মেসেজ পেয়েছেন।\n\nবিস্তারিত দেখতে "Live Chat" খুলুন।`;
          
          sendTelegramNotification(
            selectedChatId, 
            notificationMsg, 
            config.telegramBotToken,
            { inline_keyboard: [[{ text: "💬 Live Chat", web_app: { url: `${miniAppUrl}/support` } }]] }
          );
          
        } else {
          console.error('Error sending admin reply:', error);
        }
      }
    } catch (err) {
      console.error('Error with admin reply:', err);
    }
  };

  const handleAdminTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminReplyText(e.target.value);
    if (selectedChatId) {
      supabase.channel(`typing_chat_${selectedChatId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender: 'admin' }
      });
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm(isBn ? 'আপনি কি এই বার্তাটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase
        .from('support_messages')
        .delete()
        .eq('id', msgId);

      if (!error) {
        setChatMessages(prev => prev.filter(m => m.id !== msgId));
        toast.success(isBn ? 'বার্তাটি মুছে ফেলা হয়েছে' : 'Message deleted successfully');
      } else {
        toast.error(isBn ? 'বার্তাটি মুছতে ব্যর্থ হয়েছে' : 'Failed to delete message');
      }
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  };

  useEffect(() => {
    let typingChannel: any;

    if (activeTab === 'chat') {
      fetchAllChatData();

      const channel = supabase
        .channel('admin_support_messages')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_messages' },
          () => {
            fetchAllChatData();
          }
        )
        .subscribe();

      // Listen for user typing
      if (selectedChatId) {
        typingChannel = supabase.channel(`typing_chat_${selectedChatId}`);
        typingChannel
          .on('broadcast', { event: 'typing' }, (payload: any) => {
            if (payload.payload.sender === 'user') {
              setUserTyping(true);
              if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
              adminTypingTimeoutRef.current = setTimeout(() => {
                setUserTyping(false);
              }, 3000);
            }
          })
          .subscribe();
      }

      return () => {
        supabase.removeChannel(channel);
        if (typingChannel) supabase.removeChannel(typingChannel);
        if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
      };
    }
  }, [activeTab, selectedChatId, profiles]);

  const handleBulkBroadcast = async () => {
    if (!broadcastMessage.trim()) return toast.error(isBn ? 'মেসেজ লিখুন' : 'Please enter a message');
    if (profiles.length === 0) return toast.error('No users found');
    if (!window.confirm(isBn ? `আপনি কি ${profiles.length} জন ইউজারকে মেসেজ পাঠাতে চান?` : `Send message to ${profiles.length} users?`)) return;

    setIsBroadcasting(true);
    let delivered = 0;
    let failed = 0;
    
    setBroadcastStats({ total: profiles.length, delivered: 0, failed: 0 });
    setBroadcastProgress(0);

    const miniAppUrl = import.meta.env.VITE_MINI_APP_URL || "https://provatiloanbd.vercel.app";
    const replyMarkup = broadcastIncludeButton ? {
      inline_keyboard: [[{ text: "📝 Open App", web_app: { url: miniAppUrl } }]]
    } : undefined;

    for (let i = 0; i < profiles.length; i++) {
      const user = profiles[i];
      try {
        // We use fetch directly here to support inline keyboard
        const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.chat_id,
            text: broadcastMessage,
            parse_mode: "HTML",
            reply_markup: replyMarkup
          }),
        });

        if (response.ok) delivered++;
        else failed++;
      } catch (err) {
        failed++;
      }
      setBroadcastStats({ total: profiles.length, delivered, failed });
      setBroadcastProgress(Math.round(((i + 1) / profiles.length) * 100));
      
      // Delay to respect Telegram limits (30 msgs/sec)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsBroadcasting(false);
    toast.success(isBn ? 'ব্রডকাস্ট সম্পন্ন হয়েছে' : 'Broadcast completed!');
  };

  const handleSendDirectMessage = async () => {
    if (directMessageUsers.length === 0 || !directMessageText.trim()) return;
    setIsSendingDirect(true);
    let delivered = 0;
    for (const user of directMessageUsers) {
      try {
        const success = await sendTelegramNotification(user.chat_id, directMessageText, config.telegramBotToken);
        if (success) delivered++;
      } catch (err) {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    toast.success(isBn ? `${delivered} জনকে মেসেজ পাঠানো হয়েছে` : `Message sent to ${delivered} users`);
    setShowDirectMessageModal(false);
    setDirectMessageText('');
    setSelectedUserIds([]);
    setIsSendingDirect(false);
  };

  const handleSaveSettings = async () => {
    const loadingId = toast.loading('Saving settings...');
    const newSettings = {
      procFee: config.processingFee / 100,
      secDeposit: config.securityDeposit / 100,
      insuranceEnabled: config.insuranceEnabled,
      insuranceRate: config.insuranceRate / 100,
      emailEnabled: config.emailEnabled,
      resendApiKey: config.resendApiKey,
      senderEmail: config.senderEmail,
      minRatePersonal: config.minRatePersonal / 100,
      minRateBusiness: config.minRateBusiness / 100,
      minRateExpat: config.minRateExpat / 100,
      minRateStudent: config.minRateStudent / 100,
      minRateEmergency: config.minRateEmergency / 100,
      minRateWomen: config.minRateWomen / 100,
      telegramSupport: config.telegramSupport,
      whatsappSupport: config.whatsappSupport,
      telegramBotToken: config.telegramBotToken,

      announcementActive: config.announcementActive,
      announcementBn: config.announcementBn,
      announcementEn: config.announcementEn,

      paymentNumbers: {
        bkash: { number: config.bkashNo, type: config.bkashType },
        nagad: { number: config.nagadNo, type: config.nagadType },
        rocket: { number: config.rocketNo, type: config.rocketType },
        bank: { name: config.bankName, accName: config.bankAccName, accNo: config.bankAccNo, branch: config.bankBranch, routing: config.bankRouting },
        visa: { number: config.visaNo, name: config.visaName }
      },

      categories: {
        personal: { enabled: config.catPersonalEnabled, maxAmount: config.catPersonalMax, minTenure: config.catPersonalMinTenure, maxTenure: config.catPersonalMaxTenure },
        business: { enabled: config.catBusinessEnabled, maxAmount: config.catBusinessMax, minTenure: config.catBusinessMinTenure, maxTenure: config.catBusinessMaxTenure },
        expat: { enabled: config.catExpatEnabled, maxAmount: config.catExpatMax, minTenure: config.catExpatMinTenure, maxTenure: config.catExpatMaxTenure },
        student: { enabled: config.catStudentEnabled, maxAmount: config.catStudentMax, minTenure: config.catStudentMinTenure, maxTenure: config.catStudentMaxTenure },
        emergency: { enabled: config.catEmergencyEnabled, maxAmount: config.catEmergencyMax, minTenure: config.catEmergencyMinTenure, maxTenure: config.catEmergencyMaxTenure },
        women: { enabled: config.catWomenEnabled, maxAmount: config.catWomenMax, minTenure: config.catWomenMinTenure, maxTenure: config.catWomenMaxTenure }
      }
    };
    
    const success = await updateSystemSettings('global_loan_config', newSettings);
    if (success) {
      setSystemSettings(newSettings);
      toast.success('Settings saved successfully', { id: loadingId });
    } else {
      toast.error('Failed to save settings', { id: loadingId });
    }
  };

  const handleLoanStatus = async (id: string, status: LoanApplication['status'], feedback?: string) => {
    const success = await updateLoanApplicationStatus(id, status, feedback);
    if (success) {
      toast.success(`Loan marked as ${status.replace('_', ' ')}`);
      setLoans(loans.map(l => l.id === id ? { ...l, status, admin_feedback: feedback || l.admin_feedback } : l));

      // Trigger Notifications
      const loan = loans.find(l => l.id === id);
      if (loan) {
        let msg = "";
        const catName = loan.loan_category === 'personal' ? 'ব্যক্তিগত' :
                        loan.loan_category === 'business' ? 'ব্যবসায়িক' :
                        loan.loan_category === 'expat' ? 'প্রবাসী' :
                        loan.loan_category === 'student' ? 'শিক্ষা' :
                        loan.loan_category === 'emergency' ? 'জরুরি' : 'বাড়ি';
        
        const formattedAmount = formatCurrency(loan.amount, isBn);
        
        if (status === 'under_review') {
          msg = `🔍 <b>প্রিয় ${loan.full_name},</b>\n\nআপনার <b>${catName} লোন</b> আবেদনটি বর্তমানে আমাদের অ্যাডমিন প্যানেলে রিভিউ করা হচ্ছে।\n\n💰 লোনের পরিমাণ: <b>${formattedAmount}</b>\n📅 মেয়াদ: <b>${convertDigits(loan.tenure_months, isBn)} মাস</b>\n\nঅতি শীঘ্রই পরবর্তী আপডেট জানানো হবে। ধন্যবাদ!`;
        } else if (status === 'approved') {
          msg = `🎉 <b>অভিনন্দন ${loan.full_name}!</b>\n\nআপনার <b>${catName} লোন</b> আবেদনটি অনুমোদিত হয়েছে।\n\n💰 লোনের পরিমাণ: <b>${formattedAmount}</b>\n📅 মেয়াদ: <b>${convertDigits(loan.tenure_months, isBn)} মাস</b>\n\nআমাদের পক্ষ থেকে শীঘ্রই আপনার সাথে যোগাযোগ করা হবে। ধন্যবাদ!`;
        } else if (status === 'rejected') {
          msg = `❌ <b>দুঃখিত ${loan.full_name}!</b>\n\nআপনার <b>${catName} লোন</b> আবেদনটি বাতিল করা হয়েছে।\n\n${feedback ? `📝 কারণ: <i>${feedback}</i>\n\n` : ''}ভবিষ্যতে পুনরায় আবেদন করার জন্য অনুরোধ করা হলো। ধন্যবাদ।`;
        } else if (status === 'action_required') {
          msg = `⚠️ <b>মনোযোগ দিন ${loan.full_name}!</b>\n\nআপনার <b>${catName} লোন</b> আবেদনটিতে কিছু সংশোধনী প্রয়োজন।\n\n📝 মন্তব্য: <b>${feedback}</b>\n\nঅনুগ্রহ করে প্রোফাইল থেকে প্রয়োজনীয় তথ্য ও ডকুমেন্ট আপডেট করুন। ধন্যবাদ!`;
        } else if (status === 'completed') {
          msg = `✅ <b>অভিনন্দন ${loan.full_name}!</b>\n\nআপনার <b>${catName} লোনটি</b> সফলভাবে সম্পূর্ণ বা পরিশোধ হয়েছে।\n\nআমাদের সাথে থাকার জন্য ধন্যবাদ!`;
        }

        if (msg) {
          sendTelegramNotification(loan.chat_id, msg, config.telegramBotToken);
        }

        // Email Notification
        if (config.emailEnabled && loan.email) {
          sendEmailNotification(
            { ...loan, status, admin_feedback: feedback || null },
            status,
            feedback || null,
            { apiKey: config.resendApiKey, senderEmail: config.senderEmail, enabled: config.emailEnabled },
            isBn
          );
        }
      }
    } else {
      toast.error('Failed to update loan status');
    }
  };

  const handleTxnStatus = async (id: string, status: Transaction['status']) => {
    const success = await updateTransactionStatus(id, status);
    if (success) {
      toast.success(`Transaction marked as ${status}`);
      const updatedTxns = transactions.map(t => t.id === id ? { ...t, status } : t);
      setTransactions(updatedTxns);

      // Trigger Telegram Notification
      const txn = transactions.find(t => t.id === id);
      if (txn) {
        let msg = "";
        const formattedAmount = formatCurrency(txn.amount, isBn);
        const method = txn.payment_method?.toUpperCase();
        
        if (txn.type === 'deposit') {
          const getDepTypeLabel = (type: string | null) => {
            if (!type) return '';
            return type.split(',').map(p => {
              if (p === 'processing_fee') return 'প্রসেসিং ফি';
              if (p === 'security_deposit') return 'সিকিউরিটি ডিপোজিট';
              if (p === 'insurance') return 'বীমা (ইন্সুরেন্স)';
              return p;
            }).join(' + ');
          };
          const depType = getDepTypeLabel(txn.deposit_type);
          if (status === 'completed') {
            msg = `✅ <b>ডিপোজিট সফল!</b>\n\nআপনার <b>${depType}</b> ডিপোজিট সফলভাবে সম্পন্ন হয়েছে।\n\n💰 পরিমাণ: <b>${formattedAmount}</b>\n💳 মাধ্যম: <b>${method}</b>\n🆔 TrxID: <code>${txn.trx_id}</code>\n\nআপনার অ্যাকাউন্টে ব্যালেন্স যোগ করা হয়েছে। ধন্যবাদ!`;
            
            if (txn.loan_id) {
              const loanTxns = updatedTxns.filter(t => t.loan_id === txn.loan_id && t.type === 'deposit');
              const hasCompletedProcessingFee = loanTxns.some(t => t.deposit_type?.includes('processing_fee') && t.status === 'completed');
              const hasCompletedSecurityDeposit = loanTxns.some(t => t.deposit_type?.includes('security_deposit') && t.status === 'completed');
              
              if (hasCompletedProcessingFee && hasCompletedSecurityDeposit) {
                const loan = loans.find(l => l.id === txn.loan_id);
                if (loan && (loan.status === 'pending' || loan.status === 'action_required')) {
                  toast.info(isBn 
                    ? 'প্রসেসিং ফি এবং সিকিউরিটি ডিপোজিট সফলভাবে ভেরিফাই করা হয়েছে। লোন আবেদনটি স্বয়ংক্রিয়ভাবে "রিভিউ" স্ট্যাটাসে স্থানান্তরিত হচ্ছে।' 
                    : 'Processing fee and security deposit verified. Auto-transitioning loan to Under Review.'
                  );
                  handleLoanStatus(txn.loan_id, 'under_review');
                }
              }
            }
          } else if (status === 'failed') {
            msg = `❌ <b>ডিপোজিট ব্যর্থ!</b>\n\nআপনার <b>${depType}</b> ডিপোজিট অনুরোধটি বাতিল বা ব্যর্থ হয়েছে।\n\n💰 পরিমাণ: <b>${formattedAmount}</b>\n🆔 TrxID: <code>${txn.trx_id || 'N/A'}</code>\n\nসঠিক তথ্য সহ পুনরায় চেষ্টা করার জন্য অনুরোধ করা হলো। কোনো সমস্যা হলে আমাদের সাপোর্টে যোগাযোগ করুন।`;
          }
        } else if (txn.type === 'withdraw') {
          if (status === 'completed') {
            msg = `✅ <b>উত্তোলন সফল!</b>\n\nআপনার উত্তোলনের অনুরোধটি সফলভাবে সম্পন্ন হয়েছে।\n\n💰 পরিমাণ: <b>${formattedAmount}</b>\n💳 মাধ্যম: <b>${method}</b>\n\nটাকা আপনার দেওয়া অ্যাকাউন্টে পাঠানো হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ!`;
          } else if (status === 'failed') {
            msg = `❌ <b>উত্তোলন ব্যর্থ!</b>\n\nআপনার উত্তোলনের অনুরোধটি বাতিল বা ব্যর্থ হয়েছে।\n\n💰 পরিমাণ: <b>${formattedAmount}</b>\n\nদয়া করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।`;
          }
        } else if (txn.type === 'emi_payment') {
          if (status === 'completed') {
            msg = `✅ <b>ইএমআই পেমেন্ট সফল!</b>\n\nআপনার লোনের ইএমআই (কিস্তি) পেমেন্টটি সফলভাবে সম্পন্ন হয়েছে।\n\n💰 পরিমাণ: <b>${formattedAmount}</b>\n💳 মাধ্যম: <b>${method}</b>\n🆔 TrxID: <code>${txn.trx_id}</code>\n\nআমাদের সাথে থাকার জন্য ধন্যবাদ!`;
          } else if (status === 'failed') {
            msg = `❌ <b>ইএমআই পেমেন্ট ব্যর্থ!</b>\n\nআপনার লোনের ইএমআই (কিস্তি) পেমেন্ট অনুরোধটি বাতিল বা ব্যর্থ হয়েছে।\n\n💰 পরিমাণ: <b>${formattedAmount}</b>\n🆔 TrxID: <code>${txn.trx_id || 'N/A'}</code>\n\nসঠিক তথ্য সহ পুনরায় চেষ্টা করার জন্য অনুরোধ করা হলো। কোনো সমস্যা হলে আমাদের সাপোর্টে যোগাযোগ করুন।`;
          }
        }

        if (msg) {
          sendTelegramNotification(txn.chat_id, msg, config.telegramBotToken);
        }
      }
    } else {
      toast.error('Failed to update transaction status');
    }
  };

  const handleBanUser = async (chatId: number, isBanned: boolean) => {
    const success = await banUser(chatId, isBanned);
    if (success) {
      toast.success(isBanned ? 'User banned successfully' : 'User unbanned successfully');
      setProfiles(profiles.map(p => p.chat_id === chatId ? { ...p, is_banned: isBanned } : p));
    } else {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (chatId: number) => {
    if (!window.confirm('Are you sure you want to completely delete this user and all their data? This action cannot be undone.')) return;
    const success = await deleteUser(chatId);
    if (success) {
      toast.success('User and all associated data deleted');
      setProfiles(profiles.filter(p => p.chat_id !== chatId));
      setLoans(loans.filter(l => l.chat_id !== chatId));
      setTransactions(transactions.filter(t => t.chat_id !== chatId));
    } else {
      toast.error('Failed to delete user');
    }
  };

  const filteredLoans = loans.filter(l => (l.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || l.id.includes(searchTerm));
  const filteredTxns = transactions.filter(t => (t.trx_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || t.chat_id.toString().includes(searchTerm));

  const getTrendData = () => {
    const completedTxns = transactions.filter(t => t.status === 'completed');
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTxns = completedTxns.filter(t => t.created_at.startsWith(date));
      const deposits = dayTxns.filter(t => t.type === 'deposit' || t.type === 'emi_payment').reduce((sum, t) => sum + (t.amount || 0), 0);
      const withdrawals = dayTxns.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' });
      
      return {
        date: formattedDate,
        [isBn ? 'ডিপোজিট' : 'Deposits']: deposits,
        [isBn ? 'উত্তোলন' : 'Withdrawals']: withdrawals
      };
    });
  };

  const getGatewayData = () => {
    const completedTxns = transactions.filter(t => t.status === 'completed');
    const gateways = [
      { id: 'bkash', name: 'bKash', color: '#e2136e' },
      { id: 'nagad', name: 'Nagad', color: '#f7931e' },
      { id: 'rocket', name: 'Rocket', color: '#8c1596' },
      { id: 'bank', name: isBn ? 'ব্যাংক' : 'Bank', color: '#2563eb' },
      { id: 'visa', name: 'Visa', color: '#4f46e5' }
    ];

    return gateways.map(g => {
      const volume = completedTxns
        .filter(t => (t.payment_method || '').toLowerCase() === g.id)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        name: g.name,
        [isBn ? 'ভলিউম' : 'Volume']: volume,
        color: g.color
      };
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500 flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900"><Activity className="animate-spin text-primary-500 mr-2" /> {isBn ? 'অ্যাডমিন প্যানেল লোড হচ্ছে...' : 'Loading admin panel...'}</div>;

  const sidebarLinks = [
    { id: 'overview', label: isBn ? 'ওভারভিউ' : 'Overview', icon: LayoutDashboard },
    { id: 'loans', label: isBn ? 'ঋণ আবেদনসমূহ' : 'Loan Applications', icon: FileText },
    { id: 'deposits', label: isBn ? 'ডিপোজিট সমূহ' : 'Deposits', icon: Download },
    { id: 'withdrawals', label: isBn ? 'উত্তোলন সমূহ' : 'Withdrawals', icon: Upload },
    { id: 'users', label: isBn ? 'ইউজার নিয়ন্ত্রণ' : 'Manage Users', icon: Users },
    { id: 'chat', label: isBn ? 'লাইভ চ্যাট' : 'Support Chat', icon: MessageCircle },
    { id: 'broadcast', label: isBn ? 'ব্রডকাস্ট' : 'Broadcast', icon: Megaphone },
    { id: 'stories', label: isBn ? 'সফলতার গল্প' : 'Success Stories', icon: Star },
    { id: 'settings', label: isBn ? 'সিস্টেম সেটিংস' : 'System Settings', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-100 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none`}>
        <div className="p-6 flex items-center gap-4 border-b border-gray-100/50 dark:border-gray-700/50">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-[16px] flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="font-black text-gray-900 dark:text-white text-xl leading-tight">Provati</h1>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-bold tracking-widest uppercase">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 hide-scrollbar">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => { setActiveTab(link.id as any); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-800/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
                {link.label}
              </button>
            );
          })}
        </div>
        
        <div className="p-6 border-t border-gray-100/50 dark:border-gray-700/50">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-[16px] border border-gray-200 dark:border-gray-700 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 flex items-center justify-center font-bold">A</div>
             <div>
               <p className="text-sm font-bold text-gray-900 dark:text-white">{isBn ? 'অ্যাডমিন ইউজার' : 'Admin User'}</p>
               <p className="text-[10px] text-gray-500 font-medium">{isBn ? 'সিস্টেম অ্যাডমিনিস্ট্রেটর' : 'System Administrator'}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 dark:bg-primary-500/10 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48 z-0"></div>

        {/* Top Header */}
        <header className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 h-20 flex items-center justify-between px-6 sm:px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 dark:text-gray-300 p-2.5 -ml-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-black text-gray-900 dark:text-white capitalize tracking-tight hidden sm:block">
              {(() => {
                if (!isBn) return activeTab.replace('_', ' ');
                const titles: Record<string, string> = {
                  overview: 'ওভারভিউ',
                  loans: 'ঋণ আবেদনসমূহ',
                  deposits: 'ডিপোজিট সমূহ',
                  withdrawals: 'উত্তোলন সমূহ',
                  users: 'ইউজার নিয়ন্ত্রণ',
                  broadcast: 'টেলিগ্রাম ব্রডকাস্ট',
                  stories: 'সফলতার গল্প',
                  settings: 'সিস্টেম সেটিংস'
                };
                return titles[activeTab] || activeTab;
              })()}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
               className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-full px-4.5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
             >
               🌐 {isBn ? 'English' : 'বাংলা'}
             </button>
             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               {isBn ? 'সিস্টেম চালু' : 'System Live'}
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-7xl mx-auto space-y-6"
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Grid stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1 */}
                    <div className="relative group overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100/50 dark:border-blue-500/20 shadow-inner"><Users size={28} /></div>
                        <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider font-sans">
                            {isBn ? 'লাইভ: ' : 'Live: '} {convertDigits(onlineUsers.length, isBn)}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mt-5 relative z-10">{isBn ? 'মোট ইউজার' : 'Total Users'}</h3>
                      <p className="text-3xl font-black text-slate-800 dark:text-white mt-1.5 relative z-10 tracking-tight">{convertDigits(profiles.length, isBn)}</p>
                    </div>

                    {/* Card 2 */}
                    <div className="relative group overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100/50 dark:border-emerald-500/20 shadow-inner"><FileText size={28} /></div>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">{isBn ? 'আবেদন' : 'Applied'}</span>
                      </div>
                      <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mt-5 relative z-10">{isBn ? 'ঋণ আবেদনসমূহ' : 'Loan Applications'}</h3>
                      <p className="text-3xl font-black text-slate-800 dark:text-white mt-1.5 relative z-10 tracking-tight">{convertDigits(loans.length, isBn)}</p>
                    </div>

                    {/* Card 3 */}
                    <div className="relative group overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-28 h-28 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center border border-amber-100/50 dark:border-amber-500/20 shadow-inner"><Activity size={28} /></div>
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">{isBn ? 'অপেক্ষমাণ' : 'Pending'}</span>
                      </div>
                      <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mt-5 relative z-10">{isBn ? 'অপেক্ষমাণ ঋণ' : 'Pending Loans'}</h3>
                      <p className="text-3xl font-black text-slate-800 dark:text-white mt-1.5 relative z-10 tracking-tight">{convertDigits(loans.filter(l => l.status === 'pending').length, isBn)}</p>
                    </div>

                    {/* Card 4 */}
                    <div className="relative group overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-300">
                      <div className="absolute -right-6 -top-6 w-28 h-28 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center border border-purple-100/50 dark:border-purple-500/20 shadow-inner"><DollarSign size={28} /></div>
                        <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">{isBn ? 'ফি ও ডিপোজিট' : 'Pending Deposits'}</span>
                      </div>
                      <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mt-5 relative z-10">{isBn ? 'অপেক্ষমাণ ডিপোজিট' : 'Pending Deposits'}</h3>
                      <p className="text-3xl font-black text-slate-800 dark:text-white mt-1.5 relative z-10 tracking-tight">{convertDigits(transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length, isBn)}</p>
                    </div>
                  </div>

                  {/* Visual charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transaction Trends chart */}
                    <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-[32px] shadow-sm flex flex-col justify-between">
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">{isBn ? 'লেনদেন ভলিউম ট্রেন্ড (বিগত ৭ দিন)' : 'Transaction Volume Trends (Last 7 Days)'}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{isBn ? 'সম্পন্নকৃত ডিপোজিট ও উত্তোলনের দৈনিক অনুপাত।' : 'Daily ratio of completed deposits vs withdrawals.'}</p>
                      </div>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={getTrendData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e120" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val: any) => `৳${val}`} />
                            <Tooltip
                              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(15, 23, 42, 0.95)', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
                              labelStyle={{ fontWeight: 'black', color: '#94a3b8', marginBottom: '6px' }}
                              itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                              formatter={(value) => [formatCurrency(value as number, isBn), '']}
                            />
                            <Area type="monotone" dataKey={isBn ? 'ডিপোজিট' : 'Deposits'} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDeposits)" />
                            <Area type="monotone" dataKey={isBn ? 'উত্তোলন' : 'Withdrawals'} stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorWithdrawals)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Payment gateway volume chart */}
                    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-[32px] shadow-sm flex flex-col justify-between">
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">{isBn ? 'গেটওয়ে ভিত্তিক লেনদেন ভলিউম' : 'Gateway Transaction Volume'}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{isBn ? 'পেমেন্ট মেথড সমূহের মোট লেনদেনের হিসেব।' : 'Cumulative volumes processed per payment channel.'}</p>
                      </div>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getGatewayData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e120" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val: any) => `৳${val}`} />
                            <Tooltip
                              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(15, 23, 42, 0.95)', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
                              labelStyle={{ fontWeight: 'black', color: '#94a3b8', marginBottom: '6px' }}
                              itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                              formatter={(value) => [formatCurrency(value as number, isBn), '']}
                            />
                            <Bar dataKey={isBn ? 'ভলিউম' : 'Volume'} radius={[10, 10, 0, 0]}>
                              {getGatewayData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'loans' && (
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white text-xl">Loan Applications</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage and review all loan requests.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Search loans..." 
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-shadow"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4">ID / Applicant</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredLoans.map(loan => (
                          <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <div className="font-bold text-gray-900 dark:text-white text-base">{loan.full_name}</div>
                                {(() => {
                                  const userProfile = profiles.find(p => p.chat_id === loan.chat_id);
                                  const username = userProfile?.username;
                                  return (
                                    <a 
                                      href={username ? `https://t.me/${username}` : `tg://user?id=${loan.chat_id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                      title={isBn ? "টেলিগ্রামে যোগাযোগ করুন" : "Chat on Telegram"}
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.327-2.95-.924c-.642-.2-1.042-.642-.042-1.032l11.536-4.444c.536-.2 1.002.12.871.745z"/>
                                      </svg>
                                    </a>
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">#{loan.id.split('-')[0]}</div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold capitalize">
                                 {loan.loan_category}
                               </span>
                            </td>
                            <td className="px-6 py-4 font-black text-gray-900 dark:text-white text-base">{formatCurrency(loan.amount || 0, isBn)}</td>
                            <td className="px-6 py-4">
                                   <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                loan.status === 'approved' || loan.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30' :
                                loan.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30' :
                                loan.status === 'under_review' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30' :
                                loan.status === 'action_required' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                              }`}>
                                {loan.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {/* View Details Button */}
                              <button 
                                onClick={() => setSelectedLoan(loan)}
                                className="w-max px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-primary-500/10 active:scale-95 cursor-pointer"
                              >
                                <Eye size={14} /> View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(activeTab === 'deposits' || activeTab === 'withdrawals') && (
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white text-xl capitalize">{activeTab} Requests</h2>
                      <p className="text-sm text-gray-500 mt-1">Process user financial transactions.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Search TXN ID..." 
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4">User (Chat ID)</th>
                          <th className="px-6 py-4">Type / Method</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Details</th>
                          <th className="px-6 py-4">Proof</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredTxns.filter(t => activeTab === 'deposits' ? (t.type === 'deposit' || t.type === 'emi_payment') : t.type === 'withdraw').map(txn => (
                          <tr key={txn.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-900 dark:text-white text-xs">{txn.chat_id}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900 dark:text-white capitalize">
                                {txn.type === 'deposit' && txn.deposit_type 
                                  ? txn.deposit_type.split(',').map(p => {
                                      if (p === 'processing_fee') return isBn ? 'প্রসেসিং ফি' : 'Processing Fee';
                                      if (p === 'security_deposit') return isBn ? 'সিকিউরিটি ডিপোজিট' : 'Security Deposit';
                                      if (p === 'insurance') return isBn ? 'বীমা (ইন্সুরেন্স)' : 'Insurance';
                                      return p;
                                    }).join(' + ')
                                  : txn.type === 'emi_payment' 
                                    ? (isBn ? 'ইএমআই পেমেন্ট' : 'EMI Payment') 
                                    : (isBn ? 'অর্থ উত্তোলন' : 'Withdrawal')
                                }
                              </div>
                              <div className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded uppercase font-bold text-gray-600 dark:text-gray-300 w-max mt-1">{txn.payment_method}</div>
                            </td>
                            <td className="px-6 py-4 font-black text-gray-900 dark:text-white text-base">{formatCurrency(txn.amount || 0, isBn)}</td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-mono text-gray-900 dark:text-white">Tx: {txn.trx_id || 'N/A'}</div>
                              <div className="text-xs text-gray-500 mt-0.5">From: {txn.sender_number || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                              {txn.screenshot_url ? (
                                <a href={txn.screenshot_url} target="_blank" rel="noreferrer" className="text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors text-xs flex items-center gap-1.5 font-bold w-max">
                                  <Eye size={14} /> View
                                </a>
                              ) : (
                                <span className="text-gray-400 text-xs italic">No image</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                txn.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30' :
                                txn.status === 'failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                              }`}>
                                {txn.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                              {txn.status === 'pending' && (
                                <>
                                  <button onClick={() => handleTxnStatus(txn.id, 'completed')} className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"><CheckCircle size={14} /> Done</button>
                                  <button onClick={() => handleTxnStatus(txn.id, 'failed')} className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"><XCircle size={14} /> Fail</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white text-xl">Registered Users</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage platform users and access controls.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder={isBn ? "নাম, ইউজারনেম বা আইডি খুঁজুন..." : "Search name, username, ID..."}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-shadow"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <input 
                              type="checkbox" 
                              checked={profiles.length > 0 && selectedUserIds.length === profiles.length}
                              onChange={(e) => {
                                if(e.target.checked) setSelectedUserIds(profiles.map(p => p.chat_id));
                                else setSelectedUserIds([]);
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                            />
                          </th>
                          <th className="px-6 py-4">Profile</th>
                          <th className="px-6 py-4">Chat ID</th>
                          <th className="px-6 py-4">Username</th>
                          <th className="px-6 py-4">Joined At</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {profiles.filter(p => 
                          (p.first_name + ' ' + (p.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.chat_id.toString().includes(searchTerm)
                        ).map(user => (
                          <motion.tr layout key={user.chat_id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${user.is_banned ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                checked={selectedUserIds.includes(user.chat_id)}
                                onChange={(e) => {
                                  if(e.target.checked) setSelectedUserIds([...selectedUserIds, user.chat_id]);
                                  else setSelectedUserIds(selectedUserIds.filter(id => id !== user.chat_id));
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                              />
                            </td>
                            <td className="px-6 py-4 flex items-center gap-4">
                              <div className="relative">
                                <img src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`} alt="" className="w-10 h-10 rounded-full shadow-sm" />
                                {(() => {
                                  if (user.is_banned) return null;
                                  
                                  let dotColor = 'bg-gray-400';
                                  let dotTitle = 'Offline';
                                  const isOnline = onlineUsers.includes(user.chat_id);
                                  
                                  if (user.bot_status === 'blocked') {
                                    dotColor = 'bg-red-500';
                                    dotTitle = 'Blocked Bot';
                                  } else if (user.bot_status === 'unreachable') {
                                    dotColor = 'bg-yellow-500';
                                    dotTitle = 'Unreachable';
                                  } else if (isOnline) {
                                    dotColor = 'bg-green-500';
                                    dotTitle = 'Online in App';
                                  } else {
                                    dotColor = 'bg-blue-500';
                                    dotTitle = 'Active (Offline)';
                                  }

                                  return (
                                    <div 
                                      className={`absolute bottom-0 right-0 w-3 h-3 ${dotColor} border-2 border-white dark:border-gray-800 rounded-full`}
                                      title={dotTitle}
                                    ></div>
                                  );
                                })()}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900 dark:text-white text-base">{user.first_name} {user.last_name}</span>
                                  <a 
                                  href={user.username ? `https://t.me/${user.username}` : `tg://user?id=${user.chat_id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                  title={isBn ? "টেলিগ্রামে যোগাযোগ করুন" : "Chat on Telegram"}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.327-2.95-.924c-.642-.2-1.042-.642-.042-1.032l11.536-4.444c.536-.2 1.002.12.871.745z"/>
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 text-xs">{user.chat_id}</td>
                            <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400">
                              <div className="flex items-center gap-1">
                                <span>@{user.username || '-'}</span>
                                {user.username && (
                                  <button 
                                    onClick={() => copyToClipboard(user.username)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    title={isBn ? "কপি করুন" : "Copy Username"}
                                  >
                                    <Copy size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                              <div>{new Date(user.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                {new Date(user.created_at).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {user.is_banned ? (
                                <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-800/30">Suspended</span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 dark:border-green-800/30">Active</span>
                              )}
                            </td>
                            <td className="px-6 py-4 flex justify-end gap-2">
                              <button 
                                onClick={() => handleBanUser(user.chat_id, !user.is_banned)} 
                                className={`px-3 py-2 rounded-xl transition-colors font-bold text-xs flex items-center gap-1.5 ${user.is_banned ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                title={user.is_banned ? 'Unban User' : 'Suspend User'}
                              >
                                {user.is_banned ? <><CheckCircle size={14} /> Unban</> : <><Ban size={14} /> Suspend</>}
                              </button>
                              <button 
                                onClick={() => {
                                  const cUser = chatUsers.find(u => u.chat_id === user.chat_id);
                                  setSelectedChatId(user.chat_id);
                                  setChatMessages(cUser ? cUser.messages : []);
                                  setActiveTab('chat');
                                }}
                                className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors"
                                title={isBn ? "লাইভ চ্যাট শুরু করুন" : "Start Live Chat"}
                              >
                                <MessageCircle size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setDirectMessageUsers([user]);
                                  setShowDirectMessageModal(true);
                                }}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                                title="Send Broadcast/Alert"
                              >
                                <Megaphone size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.chat_id)}
                                className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-colors"
                                title="Delete User & Data"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedUserIds.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800/30 flex items-center justify-between">
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        {selectedUserIds.length} {isBn ? 'জন ইউজার নির্বাচিত' : 'Users Selected'}
                      </span>
                      <button 
                        onClick={() => {
                          const selectedProfiles = profiles.filter(p => selectedUserIds.includes(p.chat_id));
                          setDirectMessageUsers(selectedProfiles);
                          setShowDirectMessageModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-sm text-sm"
                      >
                        {isBn ? 'মেসেজ পাঠান' : 'Send Broadcast to Selected'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'broadcast' && (
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-8">
                  <div className="mb-6">
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2"><Megaphone size={24} className="text-primary-500" /> Telegram Broadcast</h2>
                    <p className="text-sm text-gray-500 mt-1">Send promotional messages or announcements to all registered Telegram users.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[20px] border border-gray-200 dark:border-gray-700">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Message Text (Supports HTML)</label>
                        <textarea 
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder={`<b>Hello!</b>\n\nWe have a new offer for you...`}
                          className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none font-mono"
                          disabled={isBroadcasting}
                        />
                        
                        <div className="mt-4 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={broadcastIncludeButton}
                              onChange={(e) => setBroadcastIncludeButton(e.target.checked)}
                              disabled={isBroadcasting}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Include "Open App" Button</span>
                          </label>
                        </div>
                      </div>

                      <button 
                        onClick={handleBulkBroadcast}
                        disabled={isBroadcasting || !broadcastMessage.trim()}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 text-lg"
                      >
                        {isBroadcasting ? (
                          <><Activity className="animate-spin" /> Broadcasting... {broadcastProgress}%</>
                        ) : (
                          <><Megaphone size={20} /> Send to {profiles.length} Users</>
                        )}
                      </button>

                      {isBroadcasting && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4 overflow-hidden">
                          <div className="bg-primary-500 h-2 transition-all duration-300" style={{ width: `${broadcastProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-[20px] border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-primary-500"><Users size={48} /></div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Total Audience</h3>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{convertDigits(profiles.length, isBn)}</p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-6 rounded-[20px] border border-emerald-200 dark:border-emerald-800/30 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><CheckCircle size={48} /></div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Delivered Successfully</h3>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{convertDigits(broadcastStats.delivered, isBn)}</p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-6 rounded-[20px] border border-rose-200 dark:border-rose-800/30 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500"><XCircle size={48} /></div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Failed to Deliver</h3>
                        <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{convertDigits(broadcastStats.failed, isBn)}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Users might have blocked the bot.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stories' && (
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-8">
                  <div className="mb-6">
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl">Manage Success Stories</h2>
                    <p className="text-sm text-gray-500 mt-1">Add or remove user testimonials shown on the home dashboard.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[20px] border border-gray-200 dark:border-gray-700 h-max">
                      <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Add New Story</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">User Name</label>
                          <input type="text" placeholder="e.g. Rahim M." value={newStory.name} onChange={e => setNewStory({...newStory, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Loan Type</label>
                          <input type="text" placeholder="e.g. Business Loan" value={newStory.loan_type} onChange={e => setNewStory({...newStory, loan_type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Amount</label>
                          <input type="number" placeholder="e.g. 500000" value={newStory.amount} onChange={e => setNewStory({...newStory, amount: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Approval Time</label>
                          <input type="text" placeholder="e.g. In 24 Hours" value={newStory.approval_time} onChange={e => setNewStory({...newStory, approval_time: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Avatar URL (Optional)</label>
                          <input type="text" placeholder="https://..." value={newStory.avatar_url} onChange={e => setNewStory({...newStory, avatar_url: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Rating</span>
                          <input type="number" min="1" max="5" value={newStory.rating} onChange={e => setNewStory({...newStory, rating: Number(e.target.value)})} className="w-16 px-2 py-1 text-center font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none" />
                        </div>

                        <button 
                          onClick={async () => {
                            if (stories.length >= 10) return toast.error('Maximum 10 stories allowed');
                            if (!newStory.name || !newStory.loan_type || !newStory.amount) return toast.error('Please fill name, loan type and amount');
                            const added = await addSuccessStory({
                              name: newStory.name,
                              loan_type: newStory.loan_type,
                              amount: Number(newStory.amount),
                              approval_time: newStory.approval_time,
                              rating: newStory.rating,
                              avatar_url: newStory.avatar_url || null,
                              is_verified: true
                            });
                            if (added) {
                              toast.success('Story added');
                              fetchData();
                              setNewStory({
                                name: '',
                                loan_type: '',
                                amount: '',
                                approval_time: '',
                                rating: 5,
                                avatar_url: '',
                                like_count: 0,
                                dislike_count: 0,
                                love_count: 0,
                                loveit_count: 0,
                                congratulation_count: 0,
                                wow_count: 0,
                                sad_count: 0,
                                hundred_count: 0
                              });
                            } else {
                              toast.error('Failed to add story. Please check Supabase permissions (RLS).');
                            }
                          }}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md mt-2"
                        >
                          Add Story
                        </button>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stories.map(story => (
                          <div key={story.id} className="bg-white dark:bg-gray-800 p-5 rounded-[20px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start w-full">
                              <div className="flex gap-4">
                                <img 
                                  src={story.avatar_url || `https://ui-avatars.com/api/?name=${story.name}&background=random`} 
                                  alt="" 
                                  onError={(e) => { 
                                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=random`;
                                    if (e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                  className="w-12 h-12 rounded-full border-2 border-gray-100 dark:border-gray-700 object-cover shrink-0" 
                                />
                                <div>
                                  <h4 className="font-bold text-gray-900 dark:text-white text-base">{story.name}</h4>
                                  <p className="text-sm text-primary-600 dark:text-primary-400 font-black">{formatCurrency(story.amount || 0, isBn)} <span className="text-gray-400 text-xs font-normal ml-1">{story.loan_type}</span></p>
                                  <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 font-medium">
                                    <Star size={10} className="text-amber-400 fill-amber-400" /> {convertDigits(story.rating || 5, isBn)}/৫ • {convertDigits(story.approval_time || '', isBn)}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (await deleteSuccessStory(story.id)) {
                                    toast.success('Story removed');
                                    setStories(stories.filter(s => s.id !== story.id));
                                  } else {
                                    toast.error('Failed to delete story. RLS is blocking it.');
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-600 p-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>


                          </div>
                        ))}
                        {stories.length === 0 && (
                          <div className="col-span-2 text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[20px] text-gray-500 font-bold">
                            No success stories created yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden transition-all">
                  
                  {/* Settings Page Header & Sub-tab Navigation */}
                  <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col gap-6">
                    <div>
                      <h2 className="font-black text-gray-900 dark:text-white text-2xl tracking-tight">{isBn ? 'সিস্টেম কন্ট্রোল প্যানেল' : 'System Control Panel'}</h2>
                      <p className="text-sm text-gray-500 mt-1">{isBn ? 'ইউজার অ্যাপের সকল ফিচার, পেমেন্ট নাম্বার ও লিমিট ডাইনামিকলি নিয়ন্ত্রণ করুন।' : 'Dynamically control all user app features, payment numbers, and limits.'}</p>
                    </div>
                    
                    {/* Settings Sub-Tabs */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-2xl w-max border border-gray-200/30 dark:border-gray-700/30">
                      {[
                        { id: 'general', label: isBn ? 'ফি ও সাধারণ সেটিংস' : 'General & Fees', icon: DollarSign },
                        { id: 'payments', label: isBn ? 'পেমেন্ট গেটওয়ে' : 'Payment Gateways', icon: CreditCard },
                        { id: 'announcements', label: isBn ? 'নোটিশ বোর্ড' : 'Notice Board', icon: Megaphone },
                        { id: 'categories', label: isBn ? 'লোন প্রডাক্টস' : 'Loan Products', icon: Activity },
                      ].map(subTab => {
                        const Icon = subTab.icon;
                        const isSubActive = settingsSubTab === subTab.id;
                        return (
                          <button
                            key={subTab.id}
                            onClick={() => setSettingsSubTab(subTab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isSubActive 
                                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                            }`}
                          >
                            <Icon size={14} />
                            {subTab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={settingsSubTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-8"
                      >
                        {/* Sub-tab 1: General & Fees */}
                        {settingsSubTab === 'general' && (
                          <div className="space-y-6">
                            {/* Global Fees */}
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                <DollarSign size={16} /> {isBn ? 'গ্লোবাল ফি এবং পার্সেন্টেজ' : 'Global Fees & Percentages'}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'প্রসেসিং ফি (%)' : 'Processing Fee (%)'}</label>
                                  <input type="number" step="0.1" value={config.processingFee} onChange={e => setConfig({...config, processingFee: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'সিকিউরিটি ডিপোজিট (%)' : 'Security Deposit (%)'}</label>
                                  <input type="number" step="0.1" value={config.securityDeposit} onChange={e => setConfig({...config, securityDeposit: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all" />
                                </div>
                                
                                <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">{isBn ? 'বীমা (ইন্সুরেন্স) সক্রিয়' : 'Enable Insurance (বীমা)'}</h4>
                                    <p className="text-[10px] text-gray-500">{isBn ? 'ডিপোজিটের সময় ইন্সুরেন্স বা বীমা ফি নেওয়ার অপশনটি সক্রিয় করুন।' : 'Enable the insurance fee option on deposit requests.'}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setConfig({...config, insuranceEnabled: !config.insuranceEnabled})}
                                    className="text-primary-600 dark:text-primary-400 focus:outline-none hover:scale-105 transition-transform"
                                  >
                                    {config.insuranceEnabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                                  </button>
                                </div>
                                {config.insuranceEnabled && (
                                  <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'বীমা ফি (%)' : 'Insurance Fee (%)'}</label>
                                    <input type="number" step="0.1" value={config.insuranceRate} onChange={e => setConfig({...config, [ 'insuranceRate' ]: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Interest Rates */}
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                <Activity size={16} /> {isBn ? 'সর্বনিম্ন সুদের হার (%)' : 'Minimum Interest Rates (%)'}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                {[
                                  { label: isBn ? 'ব্যক্তিগত লোন' : 'Personal Loan', key: 'minRatePersonal' },
                                  { label: isBn ? 'ব্যবসায়ী লোন' : 'Business Loan', key: 'minRateBusiness' },
                                  { label: isBn ? 'প্রবাসী লোন' : 'Probashi Loan', key: 'minRateExpat' },
                                  { label: isBn ? 'শিক্ষার্থী লোন' : 'Student Loan', key: 'minRateStudent' },
                                  { label: isBn ? 'জরুরি ঋণ' : 'Emergency Loan', key: 'minRateEmergency' },
                                  { label: isBn ? 'নারী উদ্যোক্তা লোন' : 'Women Entrepreneur', key: 'minRateWomen' },
                                ].map((item) => (
                                  <div key={item.key}>
                                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{item.label}</label>
                                    <input 
                                      type="number" step="0.1" 
                                      value={(config as any)[item.key]} 
                                      onChange={e => setConfig({...config, [item.key]: parseFloat(e.target.value) || 0})} 
                                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all" 
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Support Links */}
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                <Users size={16} /> {isBn ? 'কাস্টমার সাপোর্ট লিংক' : 'Customer Support Links'}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Telegram Link</label>
                                  <input type="text" value={config.telegramSupport || ''} onChange={e => setConfig({...config, telegramSupport: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-mono text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">WhatsApp Link</label>
                                  <input type="text" value={config.whatsappSupport || ''} onChange={e => setConfig({...config, whatsappSupport: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-mono text-sm" />
                                </div>
                              </div>
                            </div>

                            {/* Telegram Bot Settings */}
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                <ShieldAlert size={16} /> {isBn ? 'টেলিগ্রাম নোটিফিকেশন বট' : 'Telegram Notification Bot'}
                              </h3>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Telegram Bot Token</label>
                                <input 
                                  type="password" 
                                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" 
                                  value={config.telegramBotToken || ''} 
                                  onChange={e => setConfig({...config, telegramBotToken: e.target.value})} 
                                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-mono text-sm" 
                                />
                                <p className="text-[11px] text-gray-500 mt-2">
                                  {isBn ? 'টেলিগ্রাম বটের মাধ্যমে ইউজারদের লোনের আবেদন ও ট্রানজেকশন স্ট্যাটাস আপডেট নোটিফিকেশন পাঠাতে এটি ব্যবহার করা হয়।' : 'Used to send status updates and alerts directly to users via Telegram WebApp integration.'}
                                </p>
                              </div>
                            </div>

                            {/* Email Settings Panel */}
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                ✉️ {isBn ? 'ইমেইল নোটিফিকেশন সেটিংস (Resend)' : 'Email Notifications Settings (Resend)'}
                              </h3>
                              
                              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">{isBn ? 'ইমেইল নোটিফিকেশন সক্রিয়' : 'Enable Email Notifications'}</h4>
                                  <p className="text-[10px] text-gray-500">{isBn ? 'লোনের স্ট্যাটাস পরিবর্তনের সাথে সাথে ইউজারদের ইমেইল নোটিফিকেশন পাঠাতে এটি চালু করুন।' : 'Enable transactional status updates sent to applicants via email.'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setConfig({...config, emailEnabled: !config.emailEnabled})}
                                  className="text-primary-600 dark:text-primary-400 focus:outline-none hover:scale-105 transition-transform"
                                >
                                  {config.emailEnabled ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                                </button>
                              </div>

                              {config.emailEnabled && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'রিসেন্ড এপিআই কি (Resend API Key)' : 'Resend API Key'}</label>
                                    <input 
                                      type="password" 
                                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx" 
                                      value={config.resendApiKey || ''} 
                                      onChange={e => setConfig({...config, resendApiKey: e.target.value})} 
                                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-mono text-sm" 
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                      {isBn ? 'Resend.com ড্যাশবোর্ড থেকে প্রাপ্ত API Key দিন।' : 'Go to Resend.com to generate your API key.'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'প্রেরক ইমেইল (Sender Email)' : 'Sender Email'}</label>
                                    <input 
                                      type="text" 
                                      placeholder="Provati Loan <support@yourdomain.com>" 
                                      value={config.senderEmail || ''} 
                                      onChange={e => setConfig({...config, senderEmail: e.target.value})} 
                                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm text-sm" 
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                      {isBn ? 'আপনার ভেরিফাইড ডোমেনের প্রেরক ইমেইল এড্রেস।' : 'Enter a sender identity verified in your Resend account.'}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sub-tab 2: Payment Gateways */}
                        {settingsSubTab === 'payments' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Mobile Banking Gateways */}
                            <div className="space-y-6 lg:col-span-1">
                              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-[#e2136e]">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#e2136e]"></span> bKash Configuration
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'বিকাশ নাম্বার' : 'bKash Number'}</label>
                                    <input type="text" placeholder="e.g. 017XXXXXXXX" value={config.bkashNo} onChange={e => setConfig({...config, bkashNo: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e2136e]/30 shadow-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'হিসাবের ধরন' : 'Account Type'}</label>
                                    <select value={config.bkashType} onChange={e => setConfig({...config, bkashType: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e2136e]/30 font-bold">
                                      <option value="Personal">Personal</option>
                                      <option value="Agent">Agent</option>
                                      <option value="Merchant">Merchant</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-[#f7931e]">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#f7931e]"></span> Nagad Configuration
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'নগদ নাম্বার' : 'Nagad Number'}</label>
                                    <input type="text" placeholder="e.g. 018XXXXXXXX" value={config.nagadNo} onChange={e => setConfig({...config, nagadNo: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f7931e]/30 shadow-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'হিসাবের ধরন' : 'Account Type'}</label>
                                    <select value={config.nagadType} onChange={e => setConfig({...config, nagadType: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f7931e]/30 font-bold">
                                      <option value="Personal">Personal</option>
                                      <option value="Agent">Agent</option>
                                      <option value="Merchant">Merchant</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-[#8c1596]">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#8c1596]"></span> Rocket Configuration
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'রকেট নাম্বার' : 'Rocket Number'}</label>
                                    <input type="text" placeholder="e.g. 019XXXXXXXXX" value={config.rocketNo} onChange={e => setConfig({...config, rocketNo: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8c1596]/30 shadow-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'হিসাবের ধরন' : 'Account Type'}</label>
                                    <select value={config.rocketType} onChange={e => setConfig({...config, rocketType: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8c1596]/30 font-bold">
                                      <option value="Personal">Personal</option>
                                      <option value="Agent">Agent</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Direct Bank & Visa Gateways */}
                            <div className="space-y-6 lg:col-span-1">
                              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                  <Landmark size={18} /> {isBn ? 'সরাসরি ব্যাংক অ্যাকাউন্ট' : 'Bank Account Details'}
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'ব্যাংকের নাম' : 'Bank Name'}</label>
                                    <input type="text" placeholder="e.g. Brac Bank PLC" value={config.bankName} onChange={e => setConfig({...config, bankName: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'হিসাবধারীর নাম' : 'Account Name'}</label>
                                    <input type="text" placeholder="e.g. Provati Micro Finance" value={config.bankAccName} onChange={e => setConfig({...config, bankAccName: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'অ্যাকাউন্ট নাম্বার' : 'Account Number'}</label>
                                    <input type="text" placeholder="e.g. 150120XXXXXXXX" value={config.bankAccNo} onChange={e => setConfig({...config, bankAccNo: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'শাখা' : 'Branch'}</label>
                                      <input type="text" placeholder="e.g. Mirpur Branch" value={config.bankBranch} onChange={e => setConfig({...config, bankBranch: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'রাউটিং নাম্বার' : 'Routing Number'}</label>
                                      <input type="text" placeholder="e.g. 125271465" value={config.bankRouting} onChange={e => setConfig({...config, bankRouting: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                  <CreditCard size={18} /> {isBn ? 'ভিসা বা ক্রেডিট কার্ড' : 'Visa Card Details'}
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'কার্ড নম্বর' : 'Card Number'}</label>
                                    <input type="text" placeholder="e.g. 4111 2222 3333 4444" value={config.visaNo} onChange={e => setConfig({...config, visaNo: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">{isBn ? 'কার্ডের নাম' : 'Name on Card'}</label>
                                    <input type="text" placeholder="e.g. Provati Finance" value={config.visaName} onChange={e => setConfig({...config, visaName: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-tab 3: Notices & Announcements */}
                        {settingsSubTab === 'announcements' && (
                          <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Megaphone className="text-primary-500" size={20} />
                                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{isBn ? 'হোম পেজ স্ক্রলিং নোটিশ' : 'Home Page Scrolling Notice'}</h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setConfig({...config, announcementActive: !config.announcementActive})}
                                  className="focus:outline-none text-primary-600 transition-colors"
                                >
                                  {config.announcementActive ? <ToggleRight size={44} strokeWidth={1.5} /> : <ToggleLeft size={44} className="text-gray-400" strokeWidth={1.5} />}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'নোটিশ টেক্সট (বাংলা)' : 'Notice Text (Bengali)'}</label>
                                  <textarea rows={3} placeholder="যেমন: আমাদের নতুন লোন কিস্তি সেবা চালু হয়েছে। বিস্তারিত জানতে প্রোফাইল চেক করুন।" value={config.announcementBn} onChange={e => setConfig({...config, announcementBn: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{isBn ? 'নোটিশ টেক্সট (ইংরেজি)' : 'Notice Text (English)'}</label>
                                  <textarea rows={3} placeholder="e.g. Our new low-interest loan packages are now active. Check your profile to review details." value={config.announcementEn} onChange={e => setConfig({...config, announcementEn: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" />
                                </div>
                              </div>

                              {/* Live Preview Block */}
                              <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{isBn ? 'লাইভ প্রিভিউ (ইউজার হোম পেজ)' : 'Live Preview (User Home Page)'}</p>
                                {config.announcementActive ? (
                                  <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 rounded-xl py-3 px-4 overflow-hidden relative flex items-center gap-3">
                                    <span className="bg-primary-500 text-white text-[10px] uppercase font-bold py-1 px-2 rounded shrink-0 relative z-10">{isBn ? 'বিজ্ঞপ্তি' : 'Notice'}</span>
                                    <div className="overflow-hidden flex-1 relative w-full h-5">
                                      <div className="whitespace-nowrap absolute animate-marquee font-bold text-xs text-primary-700 dark:text-primary-400 leading-normal">
                                        {isBn ? config.announcementBn || 'কোনো নোটিশ সেট করা নেই!' : config.announcementEn || 'No notice configured yet!'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 dark:bg-gray-900 py-4 px-4 text-center rounded-xl text-xs text-gray-400 font-bold border border-dashed border-gray-200 dark:border-gray-800">
                                    {isBn ? 'নোটিশ ব্যানার বর্তমানে বন্ধ রয়েছে।' : 'Notice banner is currently disabled.'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-tab 4: Loan Products (Categories) */}
                        {settingsSubTab === 'categories' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {[
                                { id: 'Personal', stateKey: 'catPersonal', label: isBn ? 'ব্যক্তিগত লোন' : 'Personal Loan', defaultMax: 500000 },
                                { id: 'Business', stateKey: 'catBusiness', label: isBn ? 'ব্যবসায়ী ঋণ' : 'Business Loan', defaultMax: 5000000 },
                                { id: 'Expat', stateKey: 'catExpat', label: isBn ? 'প্রবাসী লোন' : 'Probashi Loan', defaultMax: 1000000 },
                                { id: 'Student', stateKey: 'catStudent', label: isBn ? 'শিক্ষার্থী ঋণ' : 'Student Loan', defaultMax: 500000 },
                                { id: 'Emergency', stateKey: 'catEmergency', label: isBn ? 'জরুরি ঋণ' : 'Emergency Loan', defaultMax: 100000 },
                                { id: 'Women', stateKey: 'catWomen', label: isBn ? 'নারী উদ্যোক্তা ঋণ' : 'Women Entrepreneur', defaultMax: 2000000 },
                              ].map(item => {
                                const isEnabled = (config as any)[`${item.stateKey}Enabled`];
                                return (
                                  <div key={item.id} className={`p-6 rounded-[24px] border transition-all ${
                                    isEnabled 
                                      ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm' 
                                      : 'bg-gray-50/50 dark:bg-gray-900/10 border-dashed border-gray-200 dark:border-gray-800'
                                  }`}>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700/50">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">{item.label}</span>
                                      <button
                                        type="button"
                                        onClick={() => setConfig({...config, [`${item.stateKey}Enabled`]: !isEnabled})}
                                        className="focus:outline-none text-primary-600"
                                      >
                                        {isEnabled ? <ToggleRight size={36} strokeWidth={1.5} /> : <ToggleLeft size={36} className="text-gray-400" strokeWidth={1.5} />}
                                      </button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'সর্বোচ্চ লোন সীমা (৳)' : 'Max Loan Limit (৳)'}</label>
                                        <input 
                                          type="number" 
                                          disabled={!isEnabled}
                                          value={(config as any)[`${item.stateKey}Max`]} 
                                          onChange={e => setConfig({...config, [`${item.stateKey}Max`]: parseInt(e.target.value) || 0})}
                                          className="w-full px-4.5 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40" 
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'নূন্যতম মেয়াদ' : 'Min Tenure'}</label>
                                          <input 
                                            type="number" 
                                            disabled={!isEnabled}
                                            value={(config as any)[`${item.stateKey}MinTenure`]} 
                                            onChange={e => setConfig({...config, [`${item.stateKey}MinTenure`]: parseInt(e.target.value) || 0})}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 text-center font-bold" 
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{isBn ? 'সর্বোচ্চ মেয়াদ' : 'Max Tenure'}</label>
                                          <input 
                                            type="number" 
                                            disabled={!isEnabled}
                                            value={(config as any)[`${item.stateKey}MaxTenure`]} 
                                            onChange={e => setConfig({...config, [`${item.stateKey}MaxTenure`]: parseInt(e.target.value) || 0})}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 text-center font-bold" 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Submit Settings Button Row */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700/60 mt-8 flex justify-end">
                      <button onClick={handleSaveSettings} className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-[20px] font-bold transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2 active:scale-95 text-sm uppercase tracking-wide cursor-pointer">
                        <Settings size={16} /> {isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save System Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden h-[calc(100vh-220px)] flex flex-col md:flex-row">
                  {/* Left Column: Users List */}
                  <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden shrink-0 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">{isBn ? 'গ্রাহক তালিকা' : 'Active Support Chats'}</h3>
                      <p className="text-xs text-gray-500 mt-1">{isBn ? 'সাপোর্ট চ্যাট এবং সাহায্য বার্তা সমূহ' : 'Select a user to review support logs.'}</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50 custom-scrollbar">
                      {chatUsers.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-xs font-bold">
                          {isBn ? 'কোনো একটিভ চ্যাট পাওয়া যায়নি' : 'No active chats found'}
                        </div>
                      ) : (
                        chatUsers.map((chatUser) => {
                          const isSelected = selectedChatId === chatUser.chat_id;
                          const latestMsg = chatUser.messages[chatUser.messages.length - 1];
                          
                          return (
                            <button
                              key={chatUser.chat_id}
                              onClick={() => {
                                setSelectedChatId(chatUser.chat_id);
                                setChatMessages(chatUser.messages);
                              }}
                              className={`w-full text-left p-4 transition-all flex items-center gap-3 ${
                                isSelected
                                  ? 'bg-primary-50/50 dark:bg-primary-950/20 border-l-4 border-primary-600'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-black relative shrink-0">
                                {chatUser.avatar ? (
                                  <img src={chatUser.avatar} alt={chatUser.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  chatUser.name.charAt(0)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{chatUser.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                                  {latestMsg ? latestMsg.message : ''}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Active Chat Thread */}
                  <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 h-full overflow-hidden ${selectedChatId ? 'flex' : 'hidden md:flex'}`}>
                    {selectedChatId ? (
                      (() => {
                        const chatUserMatch = chatUsers.find(u => u.chat_id === selectedChatId);
                        const profileMatch = profiles.find(p => p.chat_id === selectedChatId);
                        const chatName = chatUserMatch?.name || (profileMatch ? `${profileMatch.first_name} ${profileMatch.last_name || ''}`.trim() : 'User');
                        const chatAvatar = chatUserMatch?.avatar || profileMatch?.photo_url;

                        return (
                          <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 shrink-0">
                              <button 
                                type="button"
                                onClick={() => setSelectedChatId(null)}
                                className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                              >
                                <ArrowLeft size={18} />
                              </button>
                              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold">
                                {chatAvatar ? (
                                  <img src={chatAvatar} alt={chatName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  chatName.charAt(0) || 'U'
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{chatName}</h4>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Telegram ID: {selectedChatId}</p>
                              </div>
                            </div>

                             {/* Messages Scrollbox */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col">
                              {chatMessages.map((msg) => {
                                const isUser = msg.sender === 'user';
                                return (
                                  <div 
                                    key={msg.id}
                                    className={`flex ${isUser ? 'justify-start' : 'justify-end'} items-center gap-2 group`}
                                  >
                                    {!isUser && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all border-0 bg-transparent cursor-pointer shrink-0 flex items-center justify-center"
                                        title={isBn ? "মুছে ফেলুন" : "Delete Message"}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                    <div className={`max-w-[70%] rounded-[18px] px-4 py-2.5 shadow-sm text-xs font-semibold leading-relaxed relative ${
                                      isUser 
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-850'
                                        : 'bg-primary-600 text-white rounded-tr-none'
                                    }`}>
                                      {msg.reply_to && (
                                        <div className={`mb-2 pl-2 border-l-2 text-[10px] opacity-75 rounded bg-black/5 dark:bg-white/5 p-1 ${isUser ? 'border-gray-400' : 'border-blue-300'}`}>
                                          {chatMessages.find(m => m.id === msg.reply_to)?.message || 'Original message deleted'}
                                        </div>
                                      )}
                                      <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                                      
                                      <div className={`flex items-center justify-end gap-1 mt-1.5 opacity-80 ${isUser ? 'text-gray-400' : 'text-primary-100'}`}>
                                        {msg.is_edited && <span className="text-[8px] italic mr-1">edited</span>}
                                        <span className="text-[8px] block font-mono">
                                          {new Date(msg.created_at).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {!isUser && (
                                          <span className="text-[10px]">
                                            {msg.is_seen ? <span className="text-blue-300 dark:text-blue-200">✓✓</span> : <span className="opacity-70">✓</span>}
                                          </span>
                                        )}
                                      </div>

                                      {/* Reply & Edit Buttons */}
                                      <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isUser ? '-right-14' : '-left-14'}`}>
                                        <button 
                                          onClick={() => setReplyingToMsg(msg)}
                                          className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm text-gray-500 hover:text-primary-500"
                                          title="Reply"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                                        </button>
                                        {!isUser && (
                                          <button 
                                            onClick={() => { setEditingMsgId(msg.id); setAdminReplyText(msg.message); setReplyingToMsg(null); }}
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm text-gray-500 hover:text-primary-500"
                                            title="Edit"
                                          >
                                            <Edit2 size={10} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {isUser && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all border-0 bg-transparent cursor-pointer shrink-0 flex items-center justify-center"
                                        title={isBn ? "মুছে ফেলুন" : "Delete Message"}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Typing Indicator */}
                            {userTyping && (
                              <div className="px-5 py-1 text-xs text-gray-500 dark:text-gray-400 font-semibold animate-pulse">
                                {isBn ? 'গ্রাহক টাইপ করছেন...' : 'User is typing...'}
                              </div>
                            )}

                            {/* Replying/Editing Preview */}
                            {(replyingToMsg || editingMsgId) && (
                              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                                <div className="truncate text-gray-600 dark:text-gray-300">
                                  {editingMsgId ? (
                                    <span className="font-bold text-amber-500 flex items-center gap-1"><Edit2 size={10} /> Editing Message:</span>
                                  ) : (
                                    <>
                                      <span className="font-bold text-primary-500">Replying to {replyingToMsg.sender === 'admin' ? 'yourself' : 'user'}:</span> {replyingToMsg.message}
                                    </>
                                  )}
                                </div>
                                <button onClick={() => { setReplyingToMsg(null); setEditingMsgId(null); setAdminReplyText(''); }} className="text-gray-400 hover:text-gray-600">
                                  <XCircle size={14} />
                                </button>
                              </div>
                            )}

                            {/* Reply Input Form */}
                            <form 
                              onSubmit={handleSendAdminReply}
                              className="bg-white dark:bg-gray-800 p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-center shrink-0"
                            >
                              <input
                                type="text"
                                value={adminReplyText}
                                onChange={handleAdminTyping}
                                placeholder={isBn ? 'গ্রাহককে উত্তর লিখুন...' : 'Type a reply...'}
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-primary-500 text-gray-900 dark:text-white"
                              />
                              <button
                                type="submit"
                                disabled={!adminReplyText.trim()}
                                className="bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow active:scale-95 transition-all"
                              >
                                {editingMsgId ? (isBn ? 'সেভ করুন' : 'Save') : (isBn ? 'পাঠান' : 'Reply')}
                              </button>
                            </form>
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                        <MessageCircle size={36} className="text-gray-300 dark:text-gray-700 mb-2" />
                        <h4 className="font-bold text-sm text-gray-500 dark:text-gray-400">
                          {isBn ? 'চ্যাট থ্রেড নির্বাচন করুন' : 'No Chat Selected'}
                        </h4>
                        <p className="text-xs text-gray-400 max-w-[200px] mt-1">
                          {isBn ? 'গ্রাহকের চ্যাট ইতিহাস দেখতে বাম দিকের তালিকা থেকে নির্বাচন করুন।' : 'Select a customer chat history on the left to begin.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
      {/* Stunning Loan Details Modal */}
      <AnimatePresence>
        {selectedLoan && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center animate-fade-in"
              onClick={() => setSelectedLoan(null)}
            >
              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full max-h-[85vh] relative"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-600 to-indigo-700 text-white flex justify-between items-center relative shrink-0">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                      {selectedLoan.loan_category} Loan Review
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <h3 className="text-xl sm:text-2xl font-black leading-none">{selectedLoan.full_name}</h3>
                      {(() => {
                        const userProfile = profiles.find(p => p.chat_id === selectedLoan.chat_id);
                        const username = userProfile?.username;
                        return (
                          <a 
                            href={username ? `https://t.me/${username}` : `tg://user?id=${selectedLoan.chat_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white hover:text-blue-200 transition-colors inline-flex items-center p-1 bg-white/10 hover:bg-white/20 rounded"
                            title={isBn ? "টেলিগ্রামে যোগাযোগ করুন" : "Chat on Telegram"}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.327-2.95-.924c-.642-.2-1.042-.642-.042-1.032l11.536-4.444c.536-.2 1.002.12.871.745z"/>
                            </svg>
                          </a>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-blue-100/70 font-mono mt-1.5">Application ID: #{selectedLoan.id}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedLoan(null)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors focus:outline-none cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                  
                  {/* Status Indicator Bar */}
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{isBn ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}</span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedLoan.status === 'approved' || selectedLoan.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200' :
                        selectedLoan.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200' :
                        selectedLoan.status === 'under_review' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 animate-pulse' :
                        selectedLoan.status === 'action_required' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200'
                      }`}>
                        {selectedLoan.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Inline Status Actions */}
                    <div className="flex flex-wrap gap-2">
                      {selectedLoan.status === 'pending' && (
                        <button onClick={() => { handleLoanStatus(selectedLoan.id, 'under_review'); setSelectedLoan({...selectedLoan, status: 'under_review'}); }} className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"><Clock size={14} /> Start Review</button>
                      )}
                      {(selectedLoan.status === 'pending' || selectedLoan.status === 'under_review') && (
                        <>
                          <button onClick={() => { handleLoanStatus(selectedLoan.id, 'approved'); setSelectedLoan({...selectedLoan, status: 'approved'}); }} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"><CheckCircle size={14} /> Approve Application</button>
                          <button onClick={() => { handleLoanStatus(selectedLoan.id, 'rejected'); setSelectedLoan({...selectedLoan, status: 'rejected'}); }} className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"><XCircle size={14} /> Reject Application</button>
                        </>
                      )}
                      {(selectedLoan.status === 'approved' || selectedLoan.status === 'active') && (
                        <>
                          <button onClick={() => { handleLoanStatus(selectedLoan.id, 'completed'); setSelectedLoan({...selectedLoan, status: 'completed'}); }} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">Mark Completed</button>
                          <button 
                            onClick={() => { 
                              const confirmCancel = window.confirm(isBn ? 'আপনি কি নিশ্চিত যে আপনি এই লোন আবেদনটি বাতিল করতে চান?' : 'Are you sure you want to cancel this loan application?');
                              if (confirmCancel) {
                                handleLoanStatus(selectedLoan.id, 'rejected'); 
                                setSelectedLoan({...selectedLoan, status: 'rejected'}); 
                              }
                            }} 
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <Trash2 size={14} /> {isBn ? 'আবেদন বাতিল করুন' : 'Cancel Application'}
                          </button>
                        </>
                      )}
                      {selectedLoan.status === 'action_required' && (
                        <button 
                          onClick={() => { 
                            const confirmCancel = window.confirm(isBn ? 'আপনি কি নিশ্চিত যে আপনি এই লোন আবেদনটি বাতিল করতে চান?' : 'Are you sure you want to cancel this loan application?');
                            if (confirmCancel) {
                              handleLoanStatus(selectedLoan.id, 'rejected'); 
                              setSelectedLoan({...selectedLoan, status: 'rejected'}); 
                            }
                          }} 
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <Trash2 size={14} /> {isBn ? 'আবেদন বাতিল করুন' : 'Cancel Application'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2 Column Details Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Column 1: Personal & Nominee Info */}
                    <div className="space-y-6">
                      
                      {/* Personal Info Card */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-700 pb-2 flex items-center gap-2">
                          👤 {isBn ? 'ব্যক্তিগত তথ্য বিবরণী' : 'Personal Information'}
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'পিতার নাম' : "Father's Name"}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.father_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'মাতার নাম' : "Mother's Name"}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.mother_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.dob}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'লিঙ্গ' : 'Gender'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.gender}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'মোবাইল' : 'Mobile'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.mobile}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.whatsapp || 'N/A'}</span>
                              {selectedLoan.whatsapp && (
                                <button 
                                  onClick={() => copyToClipboard(selectedLoan.whatsapp)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                  title={isBn ? "কপি করুন" : "Copy WhatsApp"}
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'ইমেইল' : 'Email Address'}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{selectedLoan.email || 'N/A'}</span>
                              {selectedLoan.email && (
                                <button 
                                  onClick={() => copyToClipboard(selectedLoan.email)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                  title={isBn ? "কপি করুন" : "Copy Email"}
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'বর্তমান ঠিকানা' : 'Current Address'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 leading-normal">{formatAddress(selectedLoan.current_address)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 leading-normal">{formatAddress(selectedLoan.permanent_address)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'এনআইডি কার্ড নম্বর' : 'NID Card Number'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{selectedLoan.nid_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Nominee Details Card */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-700 pb-2 flex items-center gap-2">
                          👥 {isBn ? 'নমিনি বিবরণী' : 'Nominee Information'}
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'নমিনির নাম' : "Nominee's Name"}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.nominee_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'সম্পর্ক' : 'Relationship'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.nominee_relation}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'নমিনির মোবাইল' : "Nominee's Mobile"}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.nominee_mobile}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'নমিনির এনআইডি' : "Nominee's NID"}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{selectedLoan.nominee_nid}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Column 2: Financial, Professional & Bank Account */}
                    <div className="space-y-6">

                      {/* Loan Specifications Card */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-700 pb-2 flex items-center gap-2">
                          💰 {isBn ? 'লোনের বিবরণী' : 'Loan Specifications'}
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'লোন বিভাগ' : 'Loan Category'}</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm capitalize">{selectedLoan.loan_category}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'পরিমাণ' : 'Amount'}</span>
                            <span className="font-black text-primary-600 dark:text-primary-400 text-base">{formatCurrency(selectedLoan.amount, isBn)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'মেয়াদকাল' : 'Tenure'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{convertDigits(selectedLoan.tenure_months, isBn)} {isBn ? 'মাস' : 'Months'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'সুদ হার' : 'Interest Rate'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{(selectedLoan.interest_rate * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'মাসিক কিস্তি (EMI)' : 'Monthly EMI'}</span>
                            <span className="font-bold text-emerald-600 text-sm">{formatCurrency(selectedLoan.emi_amount, isBn)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'প্রসেসিং ফি' : 'Processing Fee'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(selectedLoan.processing_fee, isBn)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'সিকিউরিটি ডিপোজিট' : 'Security Deposit'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(selectedLoan.security_deposit, isBn)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details Card */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-700 pb-2 flex items-center gap-2">
                          🏦 {isBn ? 'ব্যাংক একাউন্ট বিবরণী' : 'Bank Account Information'}
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'ব্যাংকের নাম' : 'Bank Name'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.bank_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'একাউন্ট নাম' : 'Account Name'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedLoan.account_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'একাউন্ট নাম্বার' : 'Account Number'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{selectedLoan.account_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'রাউটিং নাম্বার' : 'Routing Number'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{selectedLoan.routing_number || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 font-semibold block mb-0.5">{isBn ? 'মোবাইল ব্যাংকিং নাম্বার' : 'Mobile Banking Number'}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{selectedLoan.mobile_banking || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Professional Info Card */}
                      {selectedLoan.professional_info && Object.keys(selectedLoan.professional_info).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-700 pb-2 flex items-center gap-2">
                            💼 {isBn ? 'পেশাগত তথ্য বিবরণী' : 'Professional Details'}
                          </h4>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                            {Object.entries(selectedLoan.professional_info).map(([key, val]) => {
                              const friendlyKey = key === 'companyName' ? (isBn ? 'কোম্পানির নাম' : 'Company Name') :
                                                  key === 'designation' ? (isBn ? 'পদবী' : 'Designation') :
                                                  key === 'workDuration' ? (isBn ? 'কাজের মেয়াদ' : 'Work Duration') :
                                                  key === 'monthlyIncome' ? (isBn ? 'মাসিক আয়' : 'Monthly Income') :
                                                  key === 'businessName' ? (isBn ? 'ব্যবসার নাম' : 'Business Name') :
                                                  key === 'shopAddress' ? (isBn ? 'দোকানের ঠিকানা' : 'Shop Address') :
                                                  key === 'tradeLicense' ? (isBn ? 'ট্রেড লাইসেন্স' : 'Trade License') :
                                                  key === 'workingCountry' ? (isBn ? 'কর্মরত দেশ' : 'Working Country') :
                                                  key === 'visaType' ? (isBn ? 'ভিসার ধরন' : 'Visa Type') :
                                                  key === 'passportNumber' ? (isBn ? 'পাসপোর্ট নম্বর' : 'Passport Number') :
                                                  key === 'institutionName' ? (isBn ? 'শিক্ষা প্রতিষ্ঠান' : 'Institution Name') :
                                                  key === 'studentId' ? (isBn ? 'স্টুডেন্ট আইডি' : 'Student ID') :
                                                  key === 'guardianIncome' ? (isBn ? 'অভিভাবকের আয়' : "Guardian's Income") :
                                                  key === 'professionName' ? (isBn ? 'পেশা' : 'Profession') :
                                                  key === 'emergencyReason' ? (isBn ? 'জরুরি কারণ' : 'Emergency Reason') : key;

                              return (
                                <div key={key} className={key === 'shopAddress' || key === 'emergencyReason' ? 'col-span-2' : ''}>
                                  <span className="text-gray-400 font-semibold block mb-0.5">{friendlyKey}</span>
                                  <span className="font-bold text-gray-800 dark:text-gray-200">{val as string}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Documents Section */}
                  {selectedLoan.documents && Object.keys(selectedLoan.documents).length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 dark:border-gray-700 pb-2 flex items-center gap-2">
                        📎 {isBn ? 'আপলোডকৃত কাগজপত্র (ডকুমেন্টস)' : 'Attached Application Documents'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(selectedLoan.documents).map(([key, url]) => (
                          <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between gap-3 group relative overflow-hidden">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                                {key.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                                {url.split('/').pop() || 'document_file'}
                              </span>
                            </div>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye size={14} /> {isBn ? 'ডকুমেন্ট দেখুন' : 'View Document'}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revision History Timeline */}
                  {(() => {
                    const parsedFeedback = (() => {
                      if (selectedLoan.admin_feedback && selectedLoan.admin_feedback.trim().startsWith('{')) {
                        try {
                          return JSON.parse(selectedLoan.admin_feedback);
                        } catch (e) {}
                      }
                      return null;
                    })();
                    const historyList = parsedFeedback?.history || [];
                    if (historyList.length === 0) return null;

                    return (
                      <div className="bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                          ⏳ {isBn ? 'সংশোধন ও পরিবর্তন ইতিহাস' : 'Revision & Changes History Log'}
                        </h4>
                        <div className="relative border-l-2 border-primary-200 dark:border-primary-900 ml-3 pl-6 space-y-6 text-xs">
                          {historyList.map((entry: any, index: number) => (
                            <div key={index} className="relative">
                              <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-primary-100 dark:bg-primary-950 border-2 border-primary-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800 dark:text-gray-200">
                                    {isBn ? 'সংশোধন সেশন' : 'Revision Session'} #{index + 1}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {new Date(entry.date).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                                  </span>
                                </div>
                                {entry.note && (
                                  <p className="text-gray-500 dark:text-gray-400 italic">
                                    "{entry.note}"
                                  </p>
                                )}
                                {entry.changes && entry.changes.length > 0 ? (
                                  <div className="mt-2 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 space-y-1">
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                      {isBn ? 'গ্রাহক দ্বারা পরিবর্তিত তথ্যাদি:' : 'Customer Field Modifications:'}
                                    </p>
                                    <ul className="list-disc pl-4.5 text-gray-700 dark:text-gray-300 font-medium space-y-1">
                                      {entry.changes.map((change: string, cIdx: number) => (
                                        <li key={cIdx}>{change}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                                    {isBn ? 'কোনো নির্দিষ্ট তথ্য পরিবর্তন সনাক্ত করা যায়নি।' : 'No field changes logged in this step.'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Revision Section (within Modal) */}
                  {(selectedLoan.status === 'pending' || selectedLoan.status === 'under_review' || selectedLoan.status === 'action_required') && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 rounded-2xl p-5 space-y-4">
                      <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        📝 {isBn ? 'সংশোধন অনুরোধ (Revision Feedback Notes)' : 'Request Revision Notes'}
                      </h4>

                      {/* Section Flag Checklist */}
                      <div className="bg-white dark:bg-gray-900/60 p-4 rounded-xl border border-amber-250/20 space-y-3">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          {isBn ? 'সংশোধনযোগ্য সেকশনসমূহ সিলেক্ট করুন:' : 'Select sections requiring revision:'}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold text-gray-750 dark:text-gray-300">
                          <label htmlFor="flaggedPersonal" className="flex items-center gap-2 cursor-pointer">
                            <input 
                              id="flaggedPersonal"
                              type="checkbox" 
                              checked={flaggedPersonal} 
                              onChange={(e) => setFlaggedPersonal(e.target.checked)}
                              className="w-4.5 h-4.5 accent-amber-500 rounded cursor-pointer"
                            />
                            <span>{isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Info'}</span>
                          </label>
                          <label htmlFor="flaggedProfessional" className="flex items-center gap-2 cursor-pointer">
                            <input 
                              id="flaggedProfessional"
                              type="checkbox" 
                              checked={flaggedProfessional} 
                              onChange={(e) => setFlaggedProfessional(e.target.checked)}
                              className="w-4.5 h-4.5 accent-amber-500 rounded cursor-pointer"
                            />
                            <span>{isBn ? 'পেশাগত তথ্য' : 'Professional Info'}</span>
                          </label>
                          <label htmlFor="flaggedBank" className="flex items-center gap-2 cursor-pointer">
                            <input 
                              id="flaggedBank"
                              type="checkbox" 
                              checked={flaggedBank} 
                              onChange={(e) => setFlaggedBank(e.target.checked)}
                              className="w-4.5 h-4.5 accent-amber-500 rounded cursor-pointer"
                            />
                            <span>{isBn ? 'ব্যাংক তথ্য' : 'Bank Info'}</span>
                          </label>
                          <label htmlFor="flaggedNominee" className="flex items-center gap-2 cursor-pointer">
                            <input 
                              id="flaggedNominee"
                              type="checkbox" 
                              checked={flaggedNominee} 
                              onChange={(e) => setFlaggedNominee(e.target.checked)}
                              className="w-4.5 h-4.5 accent-amber-500 rounded cursor-pointer"
                            />
                            <span>{isBn ? 'নমিনি তথ্য' : 'Nominee Info'}</span>
                          </label>
                          <label htmlFor="flaggedDocuments" className="flex items-center gap-2 cursor-pointer">
                            <input 
                              id="flaggedDocuments"
                              type="checkbox" 
                              checked={flaggedDocuments} 
                              onChange={(e) => setFlaggedDocuments(e.target.checked)}
                              className="w-4.5 h-4.5 accent-amber-500 rounded cursor-pointer"
                            />
                            <span>{isBn ? 'ডকুমেন্টস' : 'Documents'}</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <textarea 
                          rows={4}
                          placeholder="Provide descriptive feedback for the applicant..." 
                          className="w-full px-4 py-3 text-sm border rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-gray-800 dark:text-gray-100 resize-y"
                          id={`modal-feedback-${selectedLoan.id}`}
                          defaultValue={(() => {
                            const feedbackStr = selectedLoan.admin_feedback;
                            if (!feedbackStr) return '';
                            if (feedbackStr.trim().startsWith('{')) {
                              try {
                                const parsed = JSON.parse(feedbackStr);
                                return parsed.note || '';
                              } catch (e) {}
                            }
                            return feedbackStr;
                          })()}
                        />
                        <div className="flex justify-end">
                          <button 
                            onClick={() => {
                              const fbText = (document.getElementById(`modal-feedback-${selectedLoan.id}`) as HTMLTextAreaElement).value;
                              if(!fbText) return toast.error('Please enter feedback');

                              let existingHistory: any[] = [];
                              if (selectedLoan.admin_feedback && selectedLoan.admin_feedback.trim().startsWith('{')) {
                                try {
                                  const parsed = JSON.parse(selectedLoan.admin_feedback);
                                  if (Array.isArray(parsed.history)) {
                                    existingHistory = parsed.history;
                                  }
                                } catch (e) {}
                              }

                              const feedbackObj = {
                                note: fbText,
                                flagged: {
                                  personal: flaggedPersonal,
                                  professional: flaggedProfessional,
                                  bank: flaggedBank,
                                  nominee: flaggedNominee,
                                  documents: flaggedDocuments
                                },
                                history: existingHistory
                              };

                              const serializedFeedback = JSON.stringify(feedbackObj);
                              handleLoanStatus(selectedLoan.id, 'action_required', serializedFeedback);
                              setSelectedLoan({...selectedLoan, status: 'action_required', admin_feedback: serializedFeedback});
                            }}
                            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shrink-0"
                          >
                            Send Revision Request
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </motion.div>
          </>
        )}

        {showDirectMessageModal && directMessageUsers.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDirectMessageModal(false)}></div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="text-blue-500" /> {directMessageUsers.length > 1 ? 'Bulk Message' : 'Message User'}
                </h3>
                <button onClick={() => setShowDirectMessageModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  To: <span className="font-bold text-gray-900 dark:text-white">
                    {directMessageUsers.length === 1 
                      ? `${directMessageUsers[0].first_name} ${directMessageUsers[0].last_name || ''}`
                      : `${directMessageUsers.length} Selected Users`}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <textarea
                    value={directMessageText}
                    onChange={(e) => setDirectMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    disabled={isSendingDirect}
                  ></textarea>
                </div>
                <button
                  onClick={handleSendDirectMessage}
                  disabled={!directMessageText.trim() || isSendingDirect}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSendingDirect ? <Activity className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                  {isSendingDirect ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
