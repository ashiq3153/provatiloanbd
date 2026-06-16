import { useEffect, useState } from 'react';
import { getTelegramUser } from '../lib/telegram';
import { getLoanApplications } from '../lib/api';
import type { LoanApplication } from '../types/database';
import { useAppStore } from '../lib/store';
import { convertDigits, formatCurrency } from '../lib/translation';
import { FileText, AlertCircle, Clock, CheckCircle2, XCircle, Pencil, ArrowRight, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';

export default function Loans() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getTelegramUser();
  const { language } = useAppStore();
  const isBn = language === 'bn';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      const data = await getLoanApplications(user.id);
      setLoans(data);
      setLoading(false);
    };
    fetchLoans();
  }, [user.id]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { text: isBn ? 'অপেক্ষমান' : 'Pending', color: 'neu-badge-orange border-white/20', icon: Clock };
      case 'under_review': return { text: isBn ? 'রিভিউ চলছে' : 'Under Review', color: 'neu-badge-orange border-white/20', icon: Clock };
      case 'approved': return { text: isBn ? 'অনুমোদিত' : 'Approved', color: 'neu-badge-green border-white/20', icon: CheckCircle2 };
      case 'active': return { text: isBn ? 'সক্রিয়' : 'Active', color: 'neu-badge-green border-white/20', icon: CheckCircle2 };
      case 'rejected': return { text: isBn ? 'বাতিল' : 'Rejected', color: 'neu-badge-red border-white/20', icon: XCircle };
      case 'action_required': return { text: isBn ? 'আপডেট প্রয়োজন' : 'Action Required', color: 'neu-badge-purple border-white/20', icon: AlertCircle };
      case 'completed': return { text: isBn ? 'সম্পন্ন' : 'Completed', color: 'neu-badge-green border-white/20', icon: CheckCircle2 };
      default: return { text: status, color: 'neu-badge-orange border-white/20', icon: FileText };
    }
  };

  const activeLoansCount = loans.filter(l => l.status === 'active' || l.status === 'approved').length;

  return (
    <div className="min-h-screen neu-bg flex flex-col relative transition-colors pb-24">
      {/* Premium Header */}
      <div className="neu-bg px-5 py-4 sticky top-0 z-30 shadow-md border-b border-white/20 dark:border-white/5 transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full neu-sunken flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors">
              {isBn ? 'আমার লোন সমূহ' : 'My Loans'}
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
              {isBn ? 'আপনার সকল ঋণের বিবরণ' : 'All your loan details'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        
        {/* Animated Active Loans summary (only show if there are active loans) */}
        {!loading && activeLoansCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="neu-raised rounded-[24px] p-6 relative overflow-hidden text-gray-900 dark:text-white"
          >
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{isBn ? 'সক্রিয় লোন সংখ্যা' : 'Active Loans Count'}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{activeLoansCount}</p>
              </div>
              <div className="w-14 h-14 neu-sunken rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                <FileText size={28} />
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="neu-raised rounded-[24px] p-6 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="space-y-2 flex-1 pr-6">
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/20 dark:border-white/5 relative z-10">
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
              ))}
            </div>
          ) : loans.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 neu-raised rounded-[32px] mt-4"
            >
              <div className="w-24 h-24 neu-sunken rounded-full flex items-center justify-center mx-auto mb-5 text-primary-500">
                <FileText size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isBn ? 'কোনো লোন নেই' : 'No Loans Found'}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm font-medium">{isBn ? 'আপনি এখনও কোনো লোনের আবেদন করেননি।' : 'You have not applied for any loans yet.'}</p>
              <Link to="/apply" className="inline-flex items-center gap-2 neu-btn-primary text-white px-8 py-4 rounded-full font-bold active:scale-95 transition-all text-base">
                {isBn ? 'নতুন আবেদন করুন' : 'Apply Now'} <ArrowRight size={18} />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan, index) => {
                const status = getStatusDisplay(loan.status);
                const StatusIcon = status.icon;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={loan.id} 
                    className="neu-raised rounded-[24px] p-6 transition-all group relative overflow-hidden cursor-pointer hover:scale-[1.005]"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 dark:bg-primary-900/5 rounded-bl-full -mr-10 -mt-10 z-0 group-hover:scale-110 transition-transform"></div>

                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{loan.loan_category} Loan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">ID: #{loan.id.split('-')[0].toUpperCase()}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-bold capitalize ${status.color}`}>
                        <StatusIcon size={14} />
                        {status.text}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end pt-4 border-t border-white/20 dark:border-white/5 relative z-10">
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">{isBn ? 'পরিমাণ' : 'Amount'}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(loan.amount || 0, isBn)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">{isBn ? 'তারিখ' : 'Date'}</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {convertDigits(new Date(loan.applied_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US'), isBn)}
                        </p>
                      </div>
                    </div>

                    {loan.status === 'action_required' && loan.admin_feedback && (
                      <div className="mt-5 p-4 neu-sunken border border-orange-500/20 rounded-[16px] relative z-10">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-1">{isBn ? 'অ্যাডমিন মেসেজ:' : 'Admin Message:'}</p>
                            <p className="text-xs font-medium leading-relaxed text-orange-700 dark:text-orange-400">
                              {(() => {
                                const feedbackStr = loan.admin_feedback;
                                if (!feedbackStr) return '';
                                if (feedbackStr.trim().startsWith('{')) {
                                  try {
                                    const parsed = JSON.parse(feedbackStr);
                                    return parsed.note || '';
                                  } catch (e) {
                                    console.error("Error parsing admin_feedback in Loans.tsx", e);
                                  }
                                }
                                return feedbackStr;
                              })()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/apply?edit=${loan.id}`)}
                          className="mt-4 w-full neu-btn-primary text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Pencil size={16} />
                          {isBn ? 'আবেদন আপডেট করুন' : 'Update Application'}
                        </button>
                      </div>
                    )}
                    
                    {loan.status !== 'action_required' && (
                      <button 
                        onClick={() => navigate(`/application/${loan.id}`)}
                        className="mt-5 w-full neu-btn text-gray-700 dark:text-gray-250 py-3 rounded-[16px] text-sm font-bold active:scale-95 transition-all relative z-10"
                      >
                        {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
