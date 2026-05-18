import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText, Calendar, Wallet, Loader2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useState, useEffect } from 'react';
import { getLoanApplicationById } from '../lib/api';
import type { LoanApplication } from '../types/database';

type LoanAppStatus = 'pending' | 'approved' | 'rejected';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const [loading, setLoading] = useState(true);
  const [appDetails, setAppDetails] = useState<LoanApplication | null>(null);

  useEffect(() => {
    const fetchApp = async () => {
      if (!id) return;
      setLoading(true);
      const data = await getLoanApplicationById(id);
      setAppDetails(data);
      setLoading(false);
    };
    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!appDetails) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <p className="text-gray-500 font-medium">{isBn ? 'আবেদন পাওয়া যায়নি' : 'Application not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold">
          {isBn ? 'ফিরে যান' : 'Go Back'}
        </button>
      </div>
    );
  }

  const getAppStatusStyles = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'rejected': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
    }
  };

  const getAppStatusIcon = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return <Clock size={20} className="text-amber-500" />;
      case 'approved': return <CheckCircle2 size={20} className="text-emerald-500" />;
      case 'rejected': return <XCircle size={20} className="text-rose-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-GB", {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 flex items-center gap-3 transition-colors">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all">
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300 transition-colors" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight transition-colors">
            {isBn ? 'আবেদনের বিস্তারিত' : 'Apply Details'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors">#{appDetails.id}</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-md ${getAppStatusStyles(appDetails.status as LoanAppStatus).replace('border-', 'ring-1 ring-')} transition-colors`}>
            {getAppStatusIcon(appDetails.status as LoanAppStatus)}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 transition-colors">৳{appDetails.amount.toLocaleString()}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">{appDetails.loan_category ? `${appDetails.loan_category.charAt(0).toUpperCase() + appDetails.loan_category.slice(1)} Loan` : 'Loan'}</p>

          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-center transition-colors">
            <span className={`px-4 py-1.5 rounded-full border text-sm font-bold capitalize flex items-center gap-1.5 ${getAppStatusStyles(appDetails.status as LoanAppStatus)}`}>
              {isBn ? 'স্ট্যাটাস: ' : 'Status: '} {isBn && appDetails.status === "pending" ? "অপেক্ষমান" : isBn && appDetails.status === "approved" ? "অনুমোদিত" : isBn && appDetails.status === "rejected" ? "বাতিল" : appDetails.status}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors"
        >
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 transition-colors">
             <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 transition-colors">
               <FileText size={16} className="text-gray-500 dark:text-gray-400" /> 
               {isBn ? ' আবেদনের সারাংশ' : ' Application Summary'}
             </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700 transition-colors">
            <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 transition-colors">
                 <Calendar size={16} /> {isBn ? ' আবেদনের তারিখ' : ' Applied On'}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{formatDate(appDetails.applied_at)}</span>
            </div>
            <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">{isBn ? 'মেয়াদ' : 'Duration'}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{appDetails.tenure_months} {isBn ? 'মাস' : 'months'}</span>
            </div>
            <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">{isBn ? 'ক্যাটাগরি' : 'Category'}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white transition-colors capitalize">{appDetails.loan_category}</span>
            </div>
            <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-800 bg-blue-50/30 dark:bg-blue-900/10 transition-colors">
              <span className="text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400 transition-colors">
                 <Wallet size={16} /> {isBn ? ' সম্ভাব্য ইএমআই' : ' Estimated EMI'}
              </span>
              <span className="text-sm font-black text-blue-700 dark:text-blue-300 transition-colors">৳{(appDetails.emi_amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {appDetails.admin_feedback && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 transition-colors"
           >
             <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-2 transition-colors">
               {isBn ? 'এডমিন নোটস' : 'Admin Notes'}
             </h3>
             <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl border border-blue-100/50 dark:border-blue-800/50 transition-colors">
               {appDetails.admin_feedback}
             </p>
           </motion.div>
        )}
        
      </div>
    </div>
  );
}
