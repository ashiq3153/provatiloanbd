import { useState, useEffect } from 'react';
import { ShieldAlert, Users, FileText, Activity, CheckCircle, XCircle, Search, DollarSign, Trash2, Ban, Eye, Menu, X, LayoutDashboard, Settings, Star, Download, Upload } from 'lucide-react';
import { getAllProfiles, getAllLoanApplications, getAllTransactions, updateLoanApplicationStatus, updateTransactionStatus, updateSystemSettings, getAllAdminSuccessStories, addSuccessStory, deleteSuccessStory, banUser, deleteUser } from '../../lib/adminApi';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../../types/database';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/store';
import { convertDigits, formatCurrency } from '../../lib/translation';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'deposits' | 'withdrawals' | 'users' | 'stories' | 'settings'>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // New Story Form State
  const [newStory, setNewStory] = useState({
    name: '',
    loan_type: '',
    amount: '',
    approval_time: '',
    rating: 5,
    avatar_url: ''
  });
  
  const { systemSettings, setSystemSettings, language, toggleLanguage } = useAppStore();
  const isBn = language === 'bn';
  const [config, setConfig] = useState({
    processingFee: 1,
    securityDeposit: 10,
    minRatePersonal: 1.2,
    minRateBusiness: 1.5,
    minRateExpat: 1.0,
    minRateStudent: 0.8,
    minRateEmergency: 2.0,
    minRateWomen: 0.8,
    telegramSupport: 'https://t.me/Provati_Loan',
    whatsappSupport: 'https://wa.me/8801700000000'
  });

  useEffect(() => {
    if (systemSettings) {
      setConfig({
        processingFee: systemSettings.procFee ? systemSettings.procFee * 100 : 1,
        securityDeposit: systemSettings.secDeposit ? systemSettings.secDeposit * 100 : 10,
        minRatePersonal: systemSettings.minRatePersonal ? systemSettings.minRatePersonal * 100 : 1.2,
        minRateBusiness: systemSettings.minRateBusiness ? systemSettings.minRateBusiness * 100 : 1.5,
        minRateExpat: systemSettings.minRateExpat ? systemSettings.minRateExpat * 100 : 1.0,
        minRateStudent: systemSettings.minRateStudent ? systemSettings.minRateStudent * 100 : 0.8,
        minRateEmergency: systemSettings.minRateEmergency ? systemSettings.minRateEmergency * 100 : 2.0,
        minRateWomen: systemSettings.minRateWomen ? systemSettings.minRateWomen * 100 : 0.8,
        telegramSupport: systemSettings.telegramSupport || 'https://t.me/Provati_Loan',
        whatsappSupport: systemSettings.whatsappSupport || 'https://wa.me/8801700000000'
      });
    }
  }, [systemSettings]);

  useEffect(() => {
    fetchData();
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

  const handleSaveSettings = async () => {
    const loadingId = toast.loading('Saving settings...');
    const newSettings = {
      procFee: config.processingFee / 100,
      secDeposit: config.securityDeposit / 100,
      minRatePersonal: config.minRatePersonal / 100,
      minRateBusiness: config.minRateBusiness / 100,
      minRateExpat: config.minRateExpat / 100,
      minRateStudent: config.minRateStudent / 100,
      minRateEmergency: config.minRateEmergency / 100,
      minRateWomen: config.minRateWomen / 100,
      telegramSupport: config.telegramSupport,
      whatsappSupport: config.whatsappSupport
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
    } else {
      toast.error('Failed to update loan status');
    }
  };

  const handleTxnStatus = async (id: string, status: Transaction['status']) => {
    const success = await updateTransactionStatus(id, status);
    if (success) {
      toast.success(`Transaction marked as ${status}`);
      setTransactions(transactions.map(t => t.id === id ? { ...t, status } : t));
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

  if (loading) return <div className="p-8 text-center text-gray-500 flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900"><Activity className="animate-spin text-primary-500 mr-2" /> {isBn ? 'অ্যাডমিন প্যানেল লোড হচ্ছে...' : 'Loading admin panel...'}</div>;

  const sidebarLinks = [
    { id: 'overview', label: isBn ? 'ওভারভিউ' : 'Overview', icon: LayoutDashboard },
    { id: 'loans', label: isBn ? 'ঋণ আবেদনসমূহ' : 'Loan Applications', icon: FileText },
    { id: 'deposits', label: isBn ? 'ডিপোজিট সমূহ' : 'Deposits', icon: Download },
    { id: 'withdrawals', label: isBn ? 'উত্তোলন সমূহ' : 'Withdrawals', icon: Upload },
    { id: 'users', label: isBn ? 'ইউজার নিয়ন্ত্রণ' : 'Manage Users', icon: Users },
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
                  stories: 'সফলতার গল্প',
                  settings: 'সিস্টেম সেটিংস'
                };
                return titles[activeTab] || activeTab;
              })()}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleLanguage}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-5 relative z-10 border border-blue-100 dark:border-blue-800/50"><Users size={28} /></div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{isBn ? 'মোট ইউজার' : 'Total Users'}</h3>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mt-1 relative z-10">{convertDigits(profiles.length, isBn)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 relative z-10 border border-emerald-100 dark:border-emerald-800/50"><FileText size={28} /></div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{isBn ? 'ঋণ আবেদনসমূহ' : 'Loan Applications'}</h3>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mt-1 relative z-10">{convertDigits(loans.length, isBn)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full blur-2xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-5 relative z-10 border border-amber-100 dark:border-amber-800/50"><Activity size={28} /></div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{isBn ? 'অপেক্ষমাণ ঋণ' : 'Pending Loans'}</h3>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mt-1 relative z-10">{convertDigits(loans.filter(l => l.status === 'pending').length, isBn)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-5 relative z-10 border border-purple-100 dark:border-purple-800/50"><DollarSign size={28} /></div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{isBn ? 'অপেক্ষমাণ ডিপোজিট' : 'Pending Deposits'}</h3>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mt-1 relative z-10">{convertDigits(transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length, isBn)}</p>
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
                              <div className="font-bold text-gray-900 dark:text-white text-base">{loan.full_name}</div>
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
                                loan.status === 'action_required' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                              }`}>
                                {loan.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex flex-col gap-3">
                              {loan.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleLoanStatus(loan.id, 'approved')} className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-1" title="Approve"><CheckCircle size={14} /> Approve</button>
                                  <button onClick={() => handleLoanStatus(loan.id, 'rejected')} className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-1" title="Reject"><XCircle size={14} /> Reject</button>
                                </div>
                              )}
                              {(loan.status === 'pending' || loan.status === 'action_required') && (
                                <div className="flex flex-col gap-2">
                                   <input 
                                     type="text" 
                                     placeholder="Add feedback note..." 
                                     className="px-3 py-2 text-xs border rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-full focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                     id={`feedback-${loan.id}`}
                                     defaultValue={loan.admin_feedback || ''}
                                   />
                                   <button 
                                     onClick={() => {
                                       const fb = (document.getElementById(`feedback-${loan.id}`) as HTMLInputElement).value;
                                       if(!fb) return toast.error('Please enter feedback');
                                       handleLoanStatus(loan.id, 'action_required', fb);
                                     }}
                                     className="text-xs px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold w-full transition-colors"
                                   >
                                     Request Revision
                                   </button>
                                </div>
                              )}
                              {(loan.status === 'approved' || loan.status === 'active') && (
                                 <button onClick={() => handleLoanStatus(loan.id, 'completed')} className="text-xs px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold transition-colors w-max">Mark Completed</button>
                              )}
                              {loan.documents && Object.keys(loan.documents).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                  {Object.entries(loan.documents).map(([key, url]) => (
                                    <a key={key} href={url as string} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                                      <Eye size={12} /> {key.replace('_', ' ')}
                                    </a>
                                  ))}
                                </div>
                              )}
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
                        {filteredTxns.filter(t => t.type === (activeTab === 'deposits' ? 'deposit' : 'withdraw')).map(txn => (
                          <tr key={txn.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-900 dark:text-white text-xs">{txn.chat_id}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900 dark:text-white capitalize">
                                {txn.type === 'deposit' && txn.deposit_type ? txn.deposit_type.replace('_', ' ') : txn.type.replace('_', ' ')}
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
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl">Registered Users</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage platform users and access controls.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4">Profile</th>
                          <th className="px-6 py-4">Chat ID</th>
                          <th className="px-6 py-4">Username</th>
                          <th className="px-6 py-4">Joined At</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {profiles.map(user => (
                          <motion.tr layout key={user.chat_id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${user.is_banned ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                            <td className="px-6 py-4 flex items-center gap-4">
                              <img src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`} alt="" className="w-10 h-10 rounded-full shadow-sm" />
                              <span className="font-bold text-gray-900 dark:text-white text-base">{user.first_name} {user.last_name}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 text-xs">{user.chat_id}</td>
                            <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400">@{user.username || '-'}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">{new Date(user.created_at).toLocaleDateString()}</td>
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
                            const added = await addSuccessStory({ ...newStory, amount: Number(newStory.amount), is_verified: true, avatar_url: newStory.avatar_url || null });
                            if (added) {
                              toast.success('Story added');
                              fetchData();
                              setNewStory({name: '', loan_type: '', amount: '', approval_time: '', rating: 5, avatar_url: ''});
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
                          <div key={story.id} className="bg-white dark:bg-gray-800 p-5 rounded-[20px] border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-start hover:shadow-md transition-all group">
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
                <div className="bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm p-8">
                  <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl">System Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure global application parameters.</p>
                  </div>

                  <div className="max-w-3xl space-y-8">
                    {/* Global Fees */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[20px] border border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-primary-500" /> Global Fees
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Processing Fee (%)</label>
                          <input type="number" step="0.1" value={config.processingFee} onChange={e => setConfig({...config, processingFee: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Security Deposit (%)</label>
                          <input type="number" step="0.1" value={config.securityDeposit} onChange={e => setConfig({...config, securityDeposit: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Interest Rates */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[20px] border border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-primary-500" /> Minimum Interest Rates (%)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {[
                          { label: 'Personal Loan', key: 'minRatePersonal' },
                          { label: 'Business Loan', key: 'minRateBusiness' },
                          { label: 'Expatriate Loan', key: 'minRateExpat' },
                          { label: 'Student Loan', key: 'minRateStudent' },
                          { label: 'Emergency Loan', key: 'minRateEmergency' },
                          { label: 'Women Entrep.', key: 'minRateWomen' },
                        ].map((item) => (
                          <div key={item.key}>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">{item.label}</label>
                            <input 
                              type="number" step="0.1" 
                              value={(config as any)[item.key]} 
                              onChange={e => setConfig({...config, [item.key]: parseFloat(e.target.value) || 0})} 
                              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Support Links */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[20px] border border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={18} className="text-primary-500" /> Support Links
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

                    <div className="pt-4 flex justify-end">
                      <button onClick={handleSaveSettings} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/30 flex items-center gap-2 active:scale-95">
                        <Settings size={18} /> Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
