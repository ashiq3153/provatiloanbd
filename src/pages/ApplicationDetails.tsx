import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText, Calendar, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency } from '../lib/translation';
import { useState, useEffect } from 'react';
import { getLoanApplicationById } from '../lib/api';
import type { LoanApplication } from '../types/database';

type LoanAppStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'action_required' | 'active' | 'completed';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!appDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <FileText size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">{isBn ? 'আবেদন পাওয়া যায়নি' : 'Application not found'}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">{isBn ? 'দুঃখিত, এই আইডি দিয়ে কোনো আবেদন খুঁজে পাওয়া যায়নি।' : 'Sorry, no application could be found with this ID.'}</p>
        <button onClick={() => navigate(-1)} className="px-8 py-3.5 bg-primary-600 text-white rounded-full font-bold shadow-lg shadow-primary-600/30 hover:bg-primary-700 active:scale-95 transition-all">
          {isBn ? 'ফিরে যান' : 'Go Back'}
        </button>
      </div>
    );
  }

  const getAppStatusStyles = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'under_review': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'active': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'rejected': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
      case 'action_required': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      case 'completed': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getAppStatusIcon = (status: LoanAppStatus) => {
    switch (status) {
      case 'pending': return <Clock size={20} className="text-amber-600 dark:text-amber-400" />;
      case 'under_review': return <Clock size={20} className="text-purple-600 dark:text-purple-400" />;
      case 'approved': return <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />;
      case 'active': return <CheckCircle2 size={20} className="text-blue-600 dark:text-blue-400" />;
      case 'rejected': return <XCircle size={20} className="text-rose-600 dark:text-rose-400" />;
      case 'action_required': return <AlertCircle size={20} className="text-orange-600 dark:text-orange-400" />;
      case 'completed': return <CheckCircle2 size={20} className="text-gray-600 dark:text-gray-400" />;
      default: return <FileText size={20} className="text-gray-600 dark:text-gray-400" />;
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

  const displayStatus = (status: string) => {
    if (isBn) {
      switch (status) {
        case 'pending': return 'অপেক্ষমান';
        case 'under_review': return 'রিভিউ চলছে';
        case 'approved': return 'অনুমোদিত';
        case 'active': return 'সক্রিয়';
        case 'rejected': return 'বাতিল';
        case 'action_required': return 'আপডেট প্রয়োজন';
        case 'completed': return 'সম্পন্ন';
        default: return status;
      }
    }
    switch (status) {
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'active': return 'Active';
      case 'rejected': return 'Rejected';
      case 'action_required': return 'Action Required';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors pb-24">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2.5 -ml-2.5 bg-gray-50 dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all text-gray-700 dark:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? 'আবেদনের বিস্তারিত' : 'Application Details'}
            </h1>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 transition-colors">
              #{appDetails.id.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Main Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10 z-0"></div>
          
          <div className="relative z-10">
            <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5 border-4 border-white dark:border-gray-800 shadow-xl ${getAppStatusStyles(appDetails.status as LoanAppStatus).replace('border-', 'ring-1 ring-').replace('text-', 'text-').replace('bg-', 'bg-')} transition-colors`}>
              {getAppStatusIcon(appDetails.status as LoanAppStatus)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
              {appDetails.loan_category ? `${appDetails.loan_category} Loan` : 'Loan Amount'}
            </p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">{formatCurrency(appDetails.amount || 0, isBn)}</h2>

            <div className="pt-5 border-t border-gray-100 dark:border-gray-700 flex justify-center">
              <div className={`px-5 py-2.5 rounded-full border shadow-sm text-sm font-bold capitalize flex items-center gap-2 ${getAppStatusStyles(appDetails.status as LoanAppStatus)}`}>
                <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                {isBn ? 'স্ট্যাটাস: ' : 'Status: '} {displayStatus(appDetails.status)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Application Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
             <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
               <FileText size={18} className="text-gray-500 dark:text-gray-400" /> 
               {isBn ? 'সারাংশ' : 'Summary'}
             </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            <div className="p-5 flex justify-between items-center bg-white dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                 <Calendar size={18} className="text-gray-400" /> {isBn ? 'আবেদনের তারিখ' : 'Applied On'}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(appDetails.applied_at)}</span>
            </div>
            <div className="p-5 flex justify-between items-center bg-white dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" /> {isBn ? 'মেয়াদ' : 'Duration'}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{convertDigits(appDetails.tenure_months, isBn)} {isBn ? 'মাস' : 'months'}</span>
            </div>
            <div className="p-5 flex justify-between items-center bg-primary-50/50 dark:bg-primary-900/10">
              <span className="text-sm font-bold flex items-center gap-2 text-primary-700 dark:text-primary-400">
                 <Wallet size={18} /> {isBn ? 'সম্ভাব্য মাসিক কিস্তি (EMI)' : 'Estimated EMI'}
              </span>
              <span className="text-base font-black text-primary-700 dark:text-primary-300">{formatCurrency(appDetails.emi_amount || 0, isBn)}</span>
            </div>
          </div>
        </motion.div>

        {/* Admin Feedback */}
        {appDetails.admin_feedback && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-[24px] p-6 relative overflow-hidden"
           >
             <div className="flex items-center gap-3 mb-3 relative z-10">
               <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800/50 flex items-center justify-center shrink-0">
                 <AlertCircle size={20} className="text-orange-600 dark:text-orange-400" />
               </div>
               <h3 className="font-bold text-orange-900 dark:text-orange-100 text-base">
                 {isBn ? 'এডমিন নোটস' : 'Admin Notes'}
               </h3>
             </div>
             <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl border border-orange-100/50 dark:border-orange-800/50 relative z-10 font-medium">
               {appDetails.admin_feedback}
             </p>
           </motion.div>
        )}
        
      </div>
    </div>
  );
}
