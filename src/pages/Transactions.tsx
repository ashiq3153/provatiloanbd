import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, FileText, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, Download, Search, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../lib/store';
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
      case 'deposit': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100';
      case 'withdraw': return 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100';
      case 'emi': return 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100';
      case 'loan': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100';
    }
  };

  const getAppStatusStyles = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100';
      case 'approved': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100';
      case 'rejected': return 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100';
    }
  };

  const getAppStatusIcon = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-amber-500 dark:text-amber-400" />;
      case 'approved': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'rejected': return <XCircle size={16} className="text-rose-500" />;
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
    <div className="p-5 pb-24 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white transition-colors tracking-tight">{isBn ? "লেনদেন সমূহ" : "Records"}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{isBn ? "আপনার আর্থিক কার্যক্রম এবং লোন" : "Your financial activities & loans"}</p>
      </div>

      {/* Statistics Cards */}
      {view === 'transactions' && (
        <motion.div 
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-700/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{isBn ? "মোট জমা" : "Total Deposit"}</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-300 mt-1">৳{stats.totalDeposit.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-200 dark:bg-emerald-700/50 rounded-lg flex items-center justify-center text-emerald-600">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-700/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">{isBn ? "মোট উত্তোলন" : "Total Withdraw"}</p>
                <p className="text-lg font-black text-rose-600 dark:text-rose-300 mt-1">৳{stats.totalWithdraw.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-rose-200 dark:bg-rose-700/50 rounded-lg flex items-center justify-center text-rose-600">
                <TrendingDown size={20} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-4 rounded-2xl border border-violet-200 dark:border-violet-700/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">{isBn ? "মোট ইএমআই" : "Total EMI"}</p>
                <p className="text-lg font-black text-violet-600 dark:text-violet-300 mt-1">৳{stats.totalEmi.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-violet-200 dark:bg-violet-700/50 rounded-lg flex items-center justify-center text-violet-600">
                <Wallet size={20} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{isBn ? "মোট লোন" : "Total Loans"}</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-300 mt-1">৳{stats.totalLoans.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 dark:bg-blue-700/50 rounded-lg flex items-center justify-center text-blue-600">
                <FileText size={20} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-900 transition-colors p-1 rounded-xl mb-6 shadow-inner">
         <button
            onClick={() => setView('transactions')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              view === 'transactions' 
                ? 'bg-white dark:bg-gray-800 transition-colors text-gray-900 dark:text-white transition-colors shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {isBn ? "হিস্ট্রি" : "History"}
          </button>
          <button
            onClick={() => setView('applications')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              view === 'applications' 
                ? 'bg-white dark:bg-gray-800 transition-colors text-gray-900 dark:text-white transition-colors shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {isBn ? "আবেদন সমূহ" : "Applications"}
          </button>
      </div>

      {/* Search Bar - Only for Transactions */}
      {view === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-3"
        >
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={isBn ? "লেনদেন খুঁজুন..." : "Search transactions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Sort and Export Options */}
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none transition-colors"
              >
                <option value="newest">{isBn ? "নতুন প্রথম" : "Newest First"}</option>
                <option value="oldest">{isBn ? "পুরনো প্রথম" : "Oldest First"}</option>
                <option value="amount-high">{isBn ? "বেশি টাকা" : "Amount High"}</option>
                <option value="amount-low">{isBn ? "কম টাকা" : "Amount Low"}</option>
              </select>
            </div>
            
            <button
              onClick={exportToCSV}
              className="p-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1.5 whitespace-nowrap text-xs font-medium"
              title={isBn ? "এক্সপোর্ট করুন" : "Export"}
            >
              <Download size={16} />
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
            <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
              {(['all', 'deposit', 'withdraw'] as const).map((f) => (
                <button
                  key={isBn && f === "all" ? "সব" : isBn && f === "deposit" ? "জমা" : isBn && f === "withdraw" ? "উত্তোলন" : f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
                    filter === f 
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md shadow-primary-500/30' 
                      : 'bg-white dark:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {isBn && f === "all" ? "সব" : isBn && f === "deposit" ? "জমা" : isBn && f === "withdraw" ? "উত্তোলন" : f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="text-right shrink-0 space-y-2">
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 transition-colors rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <FileText size={32} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{searchQuery ? (isBn ? "কোনো লেনদেন পাওয়া যায়নি" : "No transactions found") : (isBn ? "কোনো লেনদেন পাওয়া যায়নি" : "No transactions found")}</p>
                  {searchQuery && (
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{isBn ? "অনুসন্ধান ফলাফল পরিবর্তন করুন" : "Try changing your search"}</p>
                  )}
                </div>
              ) : (
                filteredTransactions.map((tx, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={tx.id}
                    className="bg-white dark:bg-gray-800 transition-colors p-4 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors shadow-sm hover:shadow-md dark:hover:shadow-lg/20 hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${getIconStyles(tx.type)}`}>
                        {getIcon(tx.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white transition-colors text-sm truncate pr-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{isBn && tx.title === "Deposit via bKash" ? "বিকাশ এর মাধ্যমে জমা" : isBn && tx.title === "EMI Payment - Home Loan" ? "ইএমআই পেমেন্ট - হোম লোন" : isBn && tx.title === "Withdrawal to Bank" ? "ব্যাংকে উত্তোলন" : isBn && tx.title === "Business Loan Disbursed" ? "বিজনেস লোন বিতরণ" : isBn && tx.title === "Deposit via Nagad" ? "নগদ এর মাধ্যমে জমা" : tx.title}</h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-black text-sm ${getAmountColor(tx.type)}`}>
                          {getAmountPrefix(tx.type)}৳{tx.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {getStatusIcon(tx.status)}
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 capitalize">{isBn && tx.status === "completed" ? "সম্পন্ন" : isBn && tx.status === "pending" ? "অপেক্ষমান" : isBn && tx.status === "failed" ? "ব্যর্থ" : tx.status}</span>
                        </div>
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
                  key={isBn && f === "all" ? "সব" : isBn && f === "pending" ? "অপেক্ষমান" : isBn && f === "approved" ? "অনুমোদিত" : isBn && f === "rejected" ? "বাতিল" : f}
                  onClick={() => setAppFilter(f)}
                  className={`px-5 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
                    appFilter === f 
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md shadow-primary-500/30' 
                      : 'bg-white dark:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {isBn && f === "all" ? "সব" : isBn && f === "pending" ? "অপেক্ষমান" : isBn && f === "approved" ? "অনুমোদিত" : isBn && f === "rejected" ? "বাতিল" : f}
                </button>
              ))}
            </div>

            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="space-y-2 flex-1 pr-6">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 relative z-10">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-3 w-16 ml-auto" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 transition-colors rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <FileText size={32} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{isBn ? "এখনো কোনো আবেদন নেই" : "No loan applications yet"}</p>
                  <Link to="/apply" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors">
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
                  className="bg-white dark:bg-gray-800 transition-colors p-5 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors shadow-sm hover:shadow-md dark:hover:shadow-lg/20 hover:border-gray-200 dark:hover:border-gray-600 transition-all relative overflow-hidden group cursor-pointer"
                >
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/30/50 rounded-bl-full -mr-8 -mt-8 z-0 group-hover:w-32 group-hover:h-32 transition-all"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white transition-colors text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{isBn && app.title === "Personal Loan" ? "ব্যক্তিগত লোন" : isBn && app.title === "Business Loan" ? "বিজনেস লোন" : isBn && app.title === "Education Loan" ? "শিক্ষা লোন" : app.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{isBn ? "আইডি:" : "ID:"} {app.id}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-xs font-bold capitalize ${getAppStatusStyles(app.status)}`}>
                       {getAppStatusIcon(app.status)}
                       {isBn && app.status === "pending" ? "অপেক্ষমান" : isBn && app.status === "approved" ? "অনুমোদিত" : isBn && app.status === "rejected" ? "বাতিল" : app.status}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700/50 relative z-10">
                    <div>
                       <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{isBn ? "পরিমাণ" : "Amount"}</p>
                       <p className="font-black text-gray-900 dark:text-white transition-colors text-lg">৳{app.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{isBn ? "আবেদনের তারিখ" : "Applied On"}</p>
                       <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{formatDate(app.date).split(',')[0]}</p>
                    </div>
                  </div>
                  
                  {app.status === 'pending' && (
                     <div className="mt-4 bg-orange-50 dark:bg-orange-900/30 p-3 rounded-xl flex items-start gap-2 relative z-10">
                       <AlertCircle size={14} className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                       <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">{isBn ? "আপনার আবেদনটি বর্তমানে পর্যালোচনার অধীনে রয়েছে।" : "Your application is currently under review by our team."}</p>
                     </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-end relative z-10">
                    <Link to={`/application/${app.id}`} className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 flex items-center gap-1">
                      {isBn ? "বিস্তারিত" : "View Details"} <ChevronRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
