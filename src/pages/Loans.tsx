import { useEffect, useState } from 'react';
import { getTelegramUser } from '../lib/telegram';
import { getLoanApplications } from '../lib/api';
import type { LoanApplication } from '../types/database';
import { useAppStore } from '../lib/store';
import { FileText, AlertCircle, Clock, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';

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
      case 'pending': return { text: isBn ? 'অপেক্ষমান' : 'Pending', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', icon: Clock };
      case 'approved': return { text: isBn ? 'অনুমোদিত' : 'Approved', color: 'text-green-600 bg-green-50 dark:bg-green-900/30', icon: CheckCircle2 };
      case 'active': return { text: isBn ? 'সক্রিয়' : 'Active', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', icon: CheckCircle2 };
      case 'rejected': return { text: isBn ? 'বাতিল' : 'Rejected', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', icon: XCircle };
      case 'action_required': return { text: isBn ? 'আপডেট প্রয়োজন' : 'Action Required', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 border border-orange-200', icon: AlertCircle };
      case 'completed': return { text: isBn ? 'সম্পন্ন' : 'Completed', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800', icon: CheckCircle2 };
      default: return { text: status, color: 'text-gray-600 bg-gray-50', icon: FileText };
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <FileText size={32} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{isBn ? 'কোনো লোন নেই' : 'No Loans Found'}</h2>
        <p className="text-gray-500 mb-6 text-sm">{isBn ? 'আপনি এখনও কোনো লোনের আবেদন করেননি।' : 'You have not applied for any loans yet.'}</p>
        <Link to="/apply" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 active:scale-95 transition-all">
          {isBn ? 'নতুন আবেদন করুন' : 'Apply Now'}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 pb-20 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{isBn ? 'আমার লোন সমূহ' : 'My Loans'}</h2>
      
      {loans.map(loan => {
        const status = getStatusDisplay(loan.status);
        const StatusIcon = status.icon;
        
        return (
          <div key={loan.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">{loan.loan_category} Loan</h3>
                <p className="text-xs text-gray-500 font-mono">ID: {loan.id.split('-')[0].toUpperCase()}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${status.color}`}>
                <StatusIcon size={14} />
                {status.text}
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{isBn ? 'পরিমাণ' : 'Amount'}</p>
                <p className="text-xl font-black text-primary-600 dark:text-primary-400">৳{(loan.amount || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{isBn ? 'তারিখ' : 'Date'}</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {new Date(loan.applied_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {loan.status === 'action_required' && loan.admin_feedback && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-orange-800 dark:text-orange-400 mb-1">{isBn ? 'অ্যাডমিন মেসেজ:' : 'Admin Message:'}</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">{loan.admin_feedback}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/apply?edit=${loan.id}`)}
                  className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Pencil size={16} />
                  {isBn ? 'আবেদন আপডেট করুন' : 'Update Application'}
                </button>
              </div>
            )}
            
            {loan.status !== 'action_required' && (
              <button 
                onClick={() => navigate(`/application/${loan.id}`)}
                className="mt-4 w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
