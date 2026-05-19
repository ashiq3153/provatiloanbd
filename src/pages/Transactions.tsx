import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, FileText, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, Download, Search, TrendingUp, TrendingDown, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency, formatNumber } from '../lib/translation';
import { getTelegramUser } from '../lib/telegram';
import { getTransactions, getLoanApplications } from '../lib/api';
import type { Transaction as DBTransaction, LoanApplication } from '../types/database';

type TransactionType = 'deposit' | 'withdraw' | 'emi' | 'loan';
type TransactionStatus = 'completed' | 'pending' | 'failed';
type LoanAppStatus = 'pending' | 'approved' | 'rejected';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  status: TransactionStatus;
  title: string;
}

interface LoanApp {
  id: string;
  amount: number;
  date: string;
  status: LoanAppStatus;
  title: string;
}

export default function Transactions() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const user = getTelegramUser();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'transactions' | 'applications'>('transactions');
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [applications, setApplications] = useState<LoanApp[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [txnData, appData] = await Promise.all([
          getTransactions(user.id),
          getLoanApplications(user.id),
        ]);

        // Map DB transactions to display format
        const mappedTxns: Transaction[] = txnData.map((t: DBTransaction) => {
          let type: TransactionType = 'deposit';
          let title = '';
          if (t.type === 'deposit') {
            type = 'deposit';
            title = t.payment_method ? `Deposit via ${t.payment_method}` : 'Deposit';
          } else if (t.type === 'withdraw') {
            type = 'withdraw';
            title = 'Withdrawal to Bank';
          } else if (t.type === 'emi_payment') {
            type = 'emi';
            title = 'EMI Payment';
          } else if (t.type === 'disbursement') {
            type = 'loan';
            title = 'Loan Disbursed';
          }
          return {
            id: t.id,
            type,
            amount: t.amount,
            date: t.created_at,
            status: t.status as TransactionStatus,
            title,
          };
        });

        // Map DB applications to display format
        const mappedApps: LoanApp[] = appData
          .filter((a: LoanApplication) => ['pending', 'approved', 'rejected'].includes(a.status))
          .map((a: LoanApplication) => ({
            id: a.id,
            amount: a.amount,
            date: a.applied_at,
            status: a.status as LoanAppStatus,
            title: a.loan_category ? `${a.loan_category.charAt(0).toUpperCase() + a.loan_category.slice(1)} Loan` : 'Loan',
          }));

        setTransactions(mappedTxns);
        setApplications(mappedApps);
      } catch (err) {
        console.error('Transactions fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Calculate statistics
  const stats = {
    totalDeposit: transactions.filter(tx => tx.type === 'deposit' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0),
    totalWithdraw: transactions.filter(tx => tx.type === 'withdraw' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0),
    totalEmi: transactions.filter(tx => tx.type === 'emi' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0),
    totalLoans: transactions.filter(tx => tx.type === 'loan' && tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0),
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  }).filter(tx => 
    tx.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount-high':
        return b.amount - a.amount;
      case 'amount-low':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const filteredApplications = applications.filter(app => {
    if (appFilter === 'all') return true;
    return app.status === appFilter;
  });

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return <ArrowDownToLine size={20} />;
      case 'withdraw': return <ArrowUpFromLine size={20} />;
      case 'emi': return <Wallet size={20} />;
      case 'loan': return <FileText size={20} />;
    }
  };

  const getIconStyles = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200';
      case 'withdraw': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200';
      case 'emi': return 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200';
      case 'loan': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200';
    }
  };

  const getAppStatusStyles = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200';
      case 'rejected': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200';
    }
  };

  const getAppStatusIcon = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle2 size={16} />;
      case 'rejected': return <XCircle size={16} />;
    }
  };

  const getAmountColor = (type: TransactionType) => {
    if (type === 'deposit' || type === 'loan') return 'text-emerald-600 dark:text-emerald-400';
    return 'text-gray-900 dark:text-white transition-colors';
  };

  const getAmountPrefix = (type: TransactionType) => {
    if (type === 'deposit' || type === 'loan') return '+';
    return '-';
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'pending': return <Clock size={12} className="text-amber-500 dark:text-amber-400" />;
      case 'failed': return <XCircle size={12} className="text-rose-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Export function
  const exportToCSV = () => {
    const data = filteredTransactions.map(tx => ({
      'Date': formatDate(tx.date),
      'Type': tx.type,
      'Title': tx.title,
      'Amount': tx.amount,
      'Status': tx.status
    }));
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors pb-24">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <LayoutList size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? "রেকর্ডস" : "Records"}
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
              {isBn ? "আপনার সকল আর্থিক বিবরণী" : "Your financial history"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-6">

        {/* Tabs */}
        <div className="flex bg-gray-200/50 dark:bg-gray-800 p-1 rounded-[16px] shadow-inner transition-colors">
           <button
              onClick={() => setView('transactions')}
              className={`flex-1 py-3 text-sm font-bold rounded-[12px] transition-all flex justify-center items-center gap-2 ${
                view === 'transactions' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <LayoutList size={16} />
              {isBn ? "হিস্ট্রি" : "History"}
            </button>
            <button
              onClick={() => setView('applications')}
              className={`flex-1 py-3 text-sm font-bold rounded-[12px] transition-all flex justify-center items-center gap-2 ${
                view === 'applications' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <FileText size={16} />
              {isBn ? "আবেদন সমূহ" : "Applications"}
            </button>
        </div>

        {/* Statistics Cards - Animated entry */}
        <AnimatePresence>
          {view === 'transactions' && (
            <motion.div 
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-[24px] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">{isBn ? "মোট জমা" : "Total Deposit"}</p>
                <p className="text-2xl font-black mt-1">{formatCurrency(stats.totalDeposit, isBn)}</p>
              </div>

              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-5 rounded-[24px] shadow-lg shadow-rose-500/20 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <TrendingDown size={20} />
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-100">{isBn ? "মোট উত্তোলন" : "Total Withdraw"}</p>
                <p className="text-2xl font-black mt-1">{formatCurrency(stats.totalWithdraw, isBn)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar - Only for Transactions */}
        {view === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={isBn ? "লেনদেন খুঁজুন..." : "Search transactions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[20px] text-base font-medium focus:outline-none focus:border-primary-500 transition-all shadow-sm"
              />
            </div>

            {/* Sort and Export Options */}
            <div className="flex gap-2 justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-[16px] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex-1 px-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="newest">{isBn ? "নতুন প্রথম" : "Newest First"}</option>
                  <option value="oldest">{isBn ? "পুরনো প্রথম" : "Oldest First"}</option>
                  <option value="amount-high">{isBn ? "বেশি টাকা" : "Amount High"}</option>
                  <option value="amount-low">{isBn ? "কম টাকা" : "Amount Low"}</option>
                </select>
              </div>
              
              <button
                onClick={exportToCSV}
                className="p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors flex items-center justify-center"
                title={isBn ? "এক্সপোর্ট করুন" : "Export"}
              >
                <Download size={18} />
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {view === 'transactions' ? (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2">
                {(['all', 'deposit', 'withdraw'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
                      filter === f 
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isBn && f === "all" ? "সব" : isBn && f === "deposit" ? "জমা" : isBn && f === "withdraw" ? "উত্তোলন" : f}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-[20px] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <div className="text-right shrink-0 space-y-2">
                        <Skeleton className="h-5 w-16 ml-auto" />
                        <Skeleton className="h-3 w-12 ml-auto" />
                      </div>
                    </div>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 border-dashed">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                      <Search size={40} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-bold">{searchQuery ? (isBn ? "কোনো লেনদেন পাওয়া যায়নি" : "No transactions found") : (isBn ? "কোনো লেনদেন পাওয়া যায়নি" : "No transactions found")}</p>
                    {searchQuery && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{isBn ? "অনুসন্ধান ফলাফল পরিবর্তন করুন" : "Try changing your search terms"}</p>
                    )}
                  </div>
                ) : (
                  filteredTransactions.map((tx, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={tx.id}
                      className="bg-white dark:bg-gray-800 p-5 rounded-[20px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border group-hover:scale-110 transition-transform ${getIconStyles(tx.type)}`}>
                        {getIcon(tx.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {isBn && tx.title === "Deposit via bKash" ? "বিকাশ এর মাধ্যমে জমা" : isBn && tx.title === "EMI Payment - Home Loan" ? "ইএমআই পেমেন্ট - হোম লোন" : isBn && tx.title === "Withdrawal to Bank" ? "ব্যাংকে উত্তোলন" : isBn && tx.title === "Business Loan Disbursed" ? "বিজনেস লোন বিতরণ" : isBn && tx.title === "Deposit via Nagad" ? "নগদ এর মাধ্যমে জমা" : tx.title}
                        </h3>
                        <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mt-1">{formatDate(tx.date)}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-black text-lg ${getAmountColor(tx.type)}`}>
                          {getAmountPrefix(tx.type)}{formatCurrency(tx.amount, isBn)}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {getStatusIcon(tx.status)}
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 capitalize">
                            {isBn && tx.status === "completed" ? "সম্পন্ন" : isBn && tx.status === "pending" ? "অপেক্ষমান" : isBn && tx.status === "failed" ? "ব্যর্থ" : tx.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="applications"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex gap-2 mb-2 overflow-x-auto hide-scrollbar pb-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAppFilter(f)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
                      appFilter === f 
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isBn && f === "all" ? "সব" : isBn && f === "pending" ? "অপেক্ষমান" : isBn && f === "approved" ? "অনুমোদিত" : isBn && f === "rejected" ? "বাতিল" : f}
                  </button>
                ))}
              </div>

              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="space-y-3 flex-1 pr-6">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 relative z-10">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-3 w-16 ml-auto" />
                        <Skeleton className="h-5 w-20 ml-auto" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-[24px] border border-gray-100 dark:border-gray-700 border-dashed">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                      <FileText size={40} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-bold">{isBn ? "এখনো কোনো আবেদন নেই" : "No loan applications yet"}</p>
                    <Link to="/apply" className="mt-5 inline-block px-8 py-3.5 bg-primary-600 text-white rounded-full text-base font-bold shadow-lg shadow-primary-600/30 hover:bg-primary-700 active:scale-95 transition-all">
                      {isBn ? "এখনই আবেদন করুন" : "Apply Now"}
                    </Link>
                </div>
              ) : (
                filteredApplications.map((app, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={app.id}
                    className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all relative overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/10 rounded-bl-full -mr-10 -mt-10 z-0 group-hover:scale-110 transition-transform"></div>
                    
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {isBn && app.title === "Personal Loan" ? "ব্যক্তিগত লোন" : isBn && app.title === "Business Loan" ? "বিজনেস লোন" : isBn && app.title === "Education Loan" ? "শিক্ষা লোন" : app.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">{isBn ? "আইডি:" : "ID:"} #{app.id.substring(0,8)}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-bold capitalize ${getAppStatusStyles(app.status)}`}>
                         {getAppStatusIcon(app.status)}
                         {isBn && app.status === "pending" ? "অপেক্ষমান" : isBn && app.status === "approved" ? "অনুমোদিত" : isBn && app.status === "rejected" ? "বাতিল" : app.status}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 relative z-10">
                      <div>
                         <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">{isBn ? "পরিমাণ" : "Amount"}</p>
                         <p className="font-black text-gray-900 dark:text-white text-xl">{formatCurrency(app.amount, isBn)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">{isBn ? "আবেদনের তারিখ" : "Applied On"}</p>
                         <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">{formatDate(app.date).split(',')[0]}</p>
                      </div>
                    </div>
                    
                    {app.status === 'pending' && (
                       <div className="mt-5 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex items-start gap-3 relative z-10 border border-amber-100 dark:border-amber-900/30">
                         <AlertCircle size={18} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                         <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                           {isBn ? "আপনার আবেদনটি বর্তমানে পর্যালোচনার অধীনে রয়েছে। খুব শীঘ্রই আপডেট জানানো হবে।" : "Your application is currently under review by our team. You'll be notified soon."}
                         </p>
                       </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end relative z-10">
                      <Link to={`/application/${app.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1 font-bold text-sm bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-4 py-2 rounded-lg transition-colors">
                        {isBn ? "বিস্তারিত দেখুন" : "View Details"} <ChevronRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
