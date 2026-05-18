import { useState, useEffect } from 'react';
import { ShieldAlert, Users, FileText, Activity, CheckCircle, XCircle, Search, DollarSign, Trash2, Ban } from 'lucide-react';
import { getAllProfiles, getAllLoanApplications, getAllTransactions, updateLoanApplicationStatus, updateTransactionStatus, getSystemSettings, updateSystemSettings, getAllAdminSuccessStories, addSuccessStory, deleteSuccessStory, banUser, deleteUser } from '../../lib/adminApi';
import type { Profile, LoanApplication, Transaction, SuccessStory } from '../../types/database';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'deposits' | 'withdrawals' | 'users' | 'stories' | 'settings'>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Story Form State
  const [newStory, setNewStory] = useState({
    name: '',
    loan_type: '',
    amount: '',
    approval_time: '',
    rating: 5,
    avatar_url: ''
  });
  
  const { systemSettings, setSystemSettings } = useAppStore();
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
      // Optional: remove their loans and transactions from local state too
      setLoans(loans.filter(l => l.chat_id !== chatId));
      setTransactions(transactions.filter(t => t.chat_id !== chatId));
    } else {
      toast.error('Failed to delete user');
    }
  };

  const filteredLoans = loans.filter(l => l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.includes(searchTerm));
  const filteredTxns = transactions.filter(t => t.trx_id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.chat_id.toString().includes(searchTerm));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin panel...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-500" /> Admin Control Panel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage users, loans, transactions & settings</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          {['overview', 'loans', 'deposits', 'withdrawals', 'users', 'stories', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={24} /></div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{profiles.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><FileText size={24} /></div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Loan Apps</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{loans.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Activity size={24} /></div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Loans</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{loans.filter(l => l.status === 'pending').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-4"><DollarSign size={24} /></div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Deposits</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length}</p>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Loan Applications</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search loans..." 
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
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
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{loan.full_name}</div>
                      <div className="text-xs text-gray-500">{loan.id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize">{loan.loan_category}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">৳{loan.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                        loan.status === 'approved' || loan.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        loan.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-col gap-2">
                      {loan.status === 'pending' && (
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => handleLoanStatus(loan.id, 'approved')} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} /></button>
                          <button onClick={() => handleLoanStatus(loan.id, 'rejected')} className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                        </div>
                      )}
                      {(loan.status === 'pending' || loan.status === 'action_required') && (
                        <div className="flex flex-col gap-1">
                           <input 
                             type="text" 
                             placeholder="Feedback for user..." 
                             className="px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-32"
                             id={`feedback-${loan.id}`}
                           />
                           <button 
                             onClick={() => {
                               const fb = (document.getElementById(`feedback-${loan.id}`) as HTMLInputElement).value;
                               if(!fb) return toast.error('Please enter feedback');
                               handleLoanStatus(loan.id, 'action_required', fb);
                             }}
                             className="text-[10px] px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-bold"
                           >
                             Request Update
                           </button>
                        </div>
                      )}
                      {(loan.status === 'approved' || loan.status === 'active') && (
                         <button onClick={() => handleLoanStatus(loan.id, 'completed')} className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold">Mark Completed</button>
                      )}
                      {loan.documents && Object.keys(loan.documents).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(loan.documents).map(([key, url]) => (
                            <a key={key} href={url as string} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors text-gray-700 dark:text-gray-300">
                              {key.replace('_', ' ')}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg capitalize">{activeTab} Requests</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search TXN..." 
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">User (Chat ID)</th>
                  <th className="px-6 py-4">Type / Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Trx ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTxns.filter(t => t.type === (activeTab === 'deposits' ? 'deposit' : 'withdraw')).map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{txn.chat_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white capitalize">{txn.type.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500 uppercase">{txn.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">৳{txn.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs font-mono">{txn.trx_id || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                        txn.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        txn.status === 'failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {txn.status === 'pending' && (
                        <>
                          <button onClick={() => handleTxnStatus(txn.id, 'completed')} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"><CheckCircle size={18} /></button>
                          <button onClick={() => handleTxnStatus(txn.id, 'failed')} className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors"><XCircle size={18} /></button>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Registered Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
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
                  <motion.tr layout key={user.chat_id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${user.is_banned ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name}`} alt="" className="w-8 h-8 rounded-full" />
                      <span className="font-bold text-gray-900 dark:text-white">{user.first_name} {user.last_name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{user.chat_id}</td>
                    <td className="px-6 py-4 text-blue-500">@{user.username || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-bold">Suspended</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-bold">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => handleBanUser(user.chat_id, !user.is_banned)} 
                        className={`p-2 rounded-lg transition-colors ${user.is_banned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        title={user.is_banned ? 'Unban User' : 'Suspend User'}
                      >
                        {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.chat_id)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-6">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Manage Success Stories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold mb-3 text-gray-900 dark:text-white">Add New Story (Max 10)</h3>
              <div className="space-y-3">
                <input type="text" placeholder="User Name (e.g. Rahim M.)" value={newStory.name} onChange={e => setNewStory({...newStory, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                <input type="text" placeholder="Loan Type (e.g. Business Loan)" value={newStory.loan_type} onChange={e => setNewStory({...newStory, loan_type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                <input type="number" placeholder="Amount (e.g. 500000)" value={newStory.amount} onChange={e => setNewStory({...newStory, amount: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                <input type="text" placeholder="Approval Time (e.g. In 24 Hours)" value={newStory.approval_time} onChange={e => setNewStory({...newStory, approval_time: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                <input type="text" placeholder="Avatar URL (Optional)" value={newStory.avatar_url} onChange={e => setNewStory({...newStory, avatar_url: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                <div className="flex gap-2 items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                  <input type="number" min="1" max="5" value={newStory.rating} onChange={e => setNewStory({...newStory, rating: Number(e.target.value)})} className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
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
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                >
                  Add Success Story
                </button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stories.map(story => (
                  <div key={story.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-start">
                    <div className="flex gap-3">
                      <img 
                        src={story.avatar_url || `https://ui-avatars.com/api/?name=${story.name}&background=random`} 
                        alt="" 
                        onError={(e) => { 
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.name)}&background=random`;
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-gray-100 object-cover shrink-0" 
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{story.name}</h4>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-bold">৳{(story.amount || 0).toLocaleString()} • {story.loan_type}</p>
                        <p className="text-[10px] text-gray-500">{story.approval_time}</p>
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
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
                {stories.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                    No success stories yet. App will show default ones until you add here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">System Settings</h2>
          <div className="max-w-2xl">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Global Fees</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Processing Fee (%)</label>
                <input type="number" step="0.1" value={config.processingFee} onChange={e => setConfig({...config, processingFee: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Security Deposit (%)</label>
                <input type="number" step="0.1" value={config.securityDeposit} onChange={e => setConfig({...config, securityDeposit: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Minimum Interest Rates</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Personal Loan (%)</label>
                <input type="number" step="0.1" value={config.minRatePersonal} onChange={e => setConfig({...config, minRatePersonal: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Business Loan (%)</label>
                <input type="number" step="0.1" value={config.minRateBusiness} onChange={e => setConfig({...config, minRateBusiness: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Expatriate Loan (%)</label>
                <input type="number" step="0.1" value={config.minRateExpat} onChange={e => setConfig({...config, minRateExpat: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Student Loan (%)</label>
                <input type="number" step="0.1" value={config.minRateStudent} onChange={e => setConfig({...config, minRateStudent: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Emergency Loan (%)</label>
                <input type="number" step="0.1" value={config.minRateEmergency} onChange={e => setConfig({...config, minRateEmergency: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Women Entrep. Loan (%)</label>
                <input type="number" step="0.1" value={config.minRateWomen} onChange={e => setConfig({...config, minRateWomen: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
            </div>
            
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Support Links</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Telegram Link</label>
                <input type="text" value={config.telegramSupport || ''} onChange={e => setConfig({...config, telegramSupport: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">WhatsApp Link</label>
                <input type="text" value={config.whatsappSupport || ''} onChange={e => setConfig({...config, whatsappSupport: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
              </div>
            </div>

            <button onClick={handleSaveSettings} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors w-full">Save System Settings</button>
          </div>
        </div>
      )}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
