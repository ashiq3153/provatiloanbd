import React, { useState, useEffect } from "react";
import { getTelegramUser } from "../lib/telegram";
import { submitLoanApplication } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  Store,
  Plane,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  CheckSquare,
  User,
  Clock,
  Award
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'sonner';
import { useAppStore } from "../lib/store";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLoanSchema, LoanFormData } from "./ApplyLoanSchema";

// Constants & Data Models
const getCategories = (isBn: boolean, settings?: any) => [
  {
    id: "personal",
    title: isBn ? "চাকরিজীবী" : "Salaried",
    icon: Briefcase,
    limit: isBn ? "৫ লক্ষ" : "5 Lac",
    maxAmount: 500000,
    tenureRange: isBn ? "১২-৬০ মাস" : "12-60 months",
    intRates: settings?.minRatePersonal ? `${(settings.minRatePersonal * 100).toFixed(1)}% - ${(settings.minRatePersonal * 100 + 0.8).toFixed(1)}%` : (isBn ? "১.২% - ২.০%" : "1.2% - 2.0%"),
    procTime: isBn ? "২-৩ দিন" : "2-3 days",
    color: "blue",
    features: isBn ? ["যেকোনো প্রয়োজনে", "সহজ কিস্তি"] : ["Any purpose", "Easy EMI"],
    minRate: settings?.minRatePersonal ?? 0.012,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "business",
    title: isBn ? "ব্যবসায়ী" : "Business",
    icon: Store,
    limit: isBn ? "৫০ লক্ষ" : "50 Lac",
    maxAmount: 5000000,
    tenureRange: isBn ? "১২-১২০ মাস" : "12-120 months",
    intRates: settings?.minRateBusiness ? `${(settings.minRateBusiness * 100).toFixed(1)}% - ${(settings.minRateBusiness * 100 + 1.0).toFixed(1)}%` : (isBn ? "১.৫% - ২.৫%" : "1.5% - 2.5%"),
    procTime: isBn ? "৩-৫ দিন" : "3-5 days",
    color: "green",
    features: isBn ? ["ব্যবসা সম্প্রসারণ", "সহজ শর্ত"] : ["Business Expansion", "Easy Terms"],
    minRate: settings?.minRateBusiness ?? 0.015,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "expat",
    title: isBn ? "প্রবাসী" : "Expatriate",
    icon: Plane,
    limit: isBn ? "১০ লক্ষ" : "10 Lac",
    maxAmount: 1000000,
    tenureRange: isBn ? "২৪-৭২ মাস" : "24-72 months",
    intRates: settings?.minRateExpat ? `${(settings.minRateExpat * 100).toFixed(1)}% - ${(settings.minRateExpat * 100 + 0.8).toFixed(1)}%` : (isBn ? "১.০% - ১.৮%" : "1.0% - 1.8%"),
    procTime: isBn ? "১-২ দিন" : "1-2 days",
    color: "purple",
    features: isBn ? ["দ্রুত অনুমোদন", "অনলাইন আবেদন সুবিধা"] : ["Fast Approval", "Online Apply"],
    minRate: settings?.minRateExpat ?? 0.01,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "student",
    title: isBn ? "শিক্ষার্থী" : "Student",
    icon: GraduationCap,
    limit: isBn ? "৫ লক্ষ" : "5 Lac",
    maxAmount: 500000,
    tenureRange: isBn ? "১২-৪৮ মাস" : "12-48 months",
    intRates: settings?.minRateStudent ? `${(settings.minRateStudent * 100).toFixed(1)}% - ${(settings.minRateStudent * 100 + 0.4).toFixed(1)}%` : (isBn ? "০.৮% - ১.২%" : "0.8% - 1.2%"),
    procTime: isBn ? "২-৩ দিন" : "2-3 days",
    color: "orange",
    features: isBn ? ["শিক্ষা লোন", "সর্বনিম্ন ফি"] : ["Education Loan", "Low Fees"],
    minRate: settings?.minRateStudent ?? 0.008,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "emergency",
    title: isBn ? "জরুরি ঋণ" : "Emergency",
    icon: AlertCircle,
    limit: isBn ? "১ লক্ষ" : "1 Lac",
    maxAmount: 100000,
    tenureRange: isBn ? "৬-২৪ মাস" : "6-24 months",
    intRates: settings?.minRateEmergency ? `${(settings.minRateEmergency * 100).toFixed(1)}% - ${(settings.minRateEmergency * 100 + 1.0).toFixed(1)}%` : (isBn ? "২.০% - ৩.০%" : "2.0% - 3.0%"),
    procTime: isBn ? "২-৬ ঘণ্টা" : "2-6 hours",
    color: "rose",
    features: isBn ? ["তাৎক্ষণিক অনুমোদন", "চিকিৎসা বা জরুরি"] : ["Instant Approval", "Medical/Emergency"],
    minRate: settings?.minRateEmergency ?? 0.02,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "women",
    title: isBn ? "নারী উদ্যোক্তা" : "Women Entrepreneur",
    icon: Award,
    limit: isBn ? "২০ লক্ষ" : "20 Lac",
    maxAmount: 2000000,
    tenureRange: isBn ? "১২-৮৪ মাস" : "12-84 months",
    intRates: settings?.minRateWomen ? `${(settings.minRateWomen * 100).toFixed(1)}% - ${(settings.minRateWomen * 100 + 0.7).toFixed(1)}%` : (isBn ? "০.৮% - ১.৫%" : "0.8% - 1.5%"),
    procTime: isBn ? "৩-৫ দিন" : "3-5 days",
    color: "pink",
    features: isBn ? ["বিশেষ রেট", "সরকারি সুবিধা"] : ["Special Rate", "Govt Benefits"],
    minRate: settings?.minRateWomen ?? 0.008,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  }
];

const snapPoints = [12, 24, 36, 48, 60, 72, 84, 96, 120, 144, 180];
const amountPackages = [
  50000, 100000, 150000, 200000, 300000, 500000, 700000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000
];

const formatAmount = (num: number, isBn: boolean) => {
  if (num >= 100000) return isBn ? `৳ ${(num / 100000).toString()} লাখ` : `৳ ${(num / 100000).toString()} Lac`;
  return isBn ? `৳ ${(num / 1000).toString()} হাজার` : `৳ ${(num / 1000).toString()}k`;
};

const getAllowedTenure = (amount: number) => {
  if (amount <= 50000) return [12, 24];
  if (amount <= 100000) return [12, 36];
  if (amount <= 150000) return [24, 36];
  if (amount <= 200000) return [24, 48];
  if (amount <= 300000) return [24, 60];
  if (amount <= 500000) return [36, 84];
  if (amount <= 700000) return [36, 96];
  if (amount <= 1000000) return [60, 120];
  if (amount <= 1500000) return [84, 144];
  if (amount <= 2500000) return [84, 180];
  if (amount <= 3000000) return [96, 180];
  return [120, 180]; 
};

// Helper for UI colors
const getColorStyles = (color: string, isActive: boolean) => {
  const base = "transition-all duration-200 border-2 ";
  if (!isActive) return base + "border-gray-100 dark:border-gray-700 transition-colors dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 transition-colors";
  switch (color) {
    case "blue": return base + "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md shadow-blue-500/20 transition-colors";
    case "green": return base + "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/20 transition-colors";
    case "purple": return base + "border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 shadow-md shadow-purple-500/20 transition-colors";
    case "orange": return base + "border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-md shadow-orange-500/20 transition-colors";
    case "rose": return base + "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 shadow-md shadow-rose-500/20 transition-colors";
    case "pink": return base + "border-pink-500 bg-pink-50/50 dark:bg-pink-900/20 shadow-md shadow-pink-500/20 transition-colors";
    default: return base + "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-md shadow-primary-500/20 transition-colors";
  }
};

const getIconColor = (color: string) => {
  switch (color) {
    case "blue": return "text-blue-500 bg-blue-100 dark:bg-blue-900/30 transition-colors";
    case "green": return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 transition-colors";
    case "purple": return "text-purple-500 bg-purple-100 dark:bg-purple-900/30 transition-colors";
    case "orange": return "text-orange-500 bg-orange-100 dark:bg-orange-900/30 transition-colors";
    case "rose": return "text-rose-500 bg-rose-100 dark:bg-rose-900/30 transition-colors";
    case "pink": return "text-pink-500 bg-pink-100 dark:bg-pink-900/30 transition-colors";
    default: return "text-primary-500 bg-primary-100 dark:bg-primary-900/30 transition-colors";
  }
};

export default function ApplyLoan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, systemSettings } = useAppStore();
  const isBn = language === "bn";
  const user = getTelegramUser();
  const categories = getCategories(isBn, systemSettings);

  const methods = useForm<LoanFormData>({
    resolver: zodResolver(getLoanSchema(isBn)),
    mode: "onChange",
  });
  const { register, trigger, formState: { errors } } = methods;


  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Form State
  const [category, setCategory] = useState<ReturnType<typeof getCategories>[0] | null>(null);
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(24);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selectedCategory = params.get('category');
    if (selectedCategory && !category) {
      const matched = categories.find((cat) => cat.id === selectedCategory);
      if (matched) setCategory(matched);
    }
  }, [location.search, categories, category]);

  // Auto-adjusted tenure state
  const handleAmountChange = (val: number) => {
    setAmount(val);
    const [minAllowed, maxAllowed] = getAllowedTenure(val);
    if (tenure < minAllowed) setTenure(minAllowed);
    if (tenure > maxAllowed) setTenure(maxAllowed);
  };

  const calculateEMI = () => {
    if (!category) return 0;
    const r = category.minRate;
    const n = tenure;
    if (r === 0) return amount / n;
    const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };


const ErrorText = ({ field }: { field: keyof LoanFormData }) => {
  return errors[field] ? <p className="text-red-500 text-xs mt-1 font-medium transition-opacity animate-in fade-in">{errors[field]?.message}</p> : null;
};

  const nextStep = async () => {
    if (step < totalSteps) {
      if (step === 1 && !category) return;
      if (step === 2 && (!amount || !tenure)) return;
      if (step === 3) {
        const isValid = await trigger(['fullName', 'fatherName', 'motherName', 'dob', 'gender', 'mobile', 'whatsapp', 'email', 'currentAddress', 'permanentAddress']);
        if (!isValid) return;
      }
      if (step === 4) {
        let fields: any = [];
        if (category?.id === 'personal') fields = ['companyName', 'designation', 'workDuration', 'monthlyIncome'];
        else if (category?.id === 'business' || category?.id === 'women') fields = ['businessName', 'shopAddress', 'tradeLicense', 'monthlyIncome'];
        else if (category?.id === 'expat') fields = ['workingCountry', 'visaType', 'passportNumber', 'monthlyIncome'];
        else if (category?.id === 'student') fields = ['institutionName', 'studentId', 'guardianIncome'];
        else if (category?.id === 'emergency') fields = ['professionName', 'emergencyReason', 'monthlyIncome'];
        
        const isValid = await trigger(fields);
        if (!isValid) return;
      }
      if (step === 5) {
        const isValid = await trigger(['bankName', 'accountName', 'accountNumber', 'routingNumber', 'mobileBanking', 'nomineeName', 'nomineeRelation', 'nomineeMobile', 'nomineeNid']);
        if (!isValid) return;
      }

      if (step === 7 && acceptedTerms) {
        setIsSubmitting(true);
        const loadingId = toast.loading(isBn ? 'আবেদন জমা দেওয়া হচ্ছে...' : 'Submitting application...');
        
        try {
          const formData = methods.getValues();
          // Build professional info based on category
          const professionalInfo: Record<string, string> = {};
          if (category?.id === 'personal') {
            professionalInfo.companyName = formData.companyName || '';
            professionalInfo.designation = formData.designation || '';
            professionalInfo.workDuration = formData.workDuration || '';
            professionalInfo.monthlyIncome = formData.monthlyIncome || '';
          } else if (category?.id === 'business' || category?.id === 'women') {
            professionalInfo.businessName = formData.businessName || '';
            professionalInfo.shopAddress = formData.shopAddress || '';
            professionalInfo.tradeLicense = formData.tradeLicense || '';
          } else if (category?.id === 'expat') {
            professionalInfo.workingCountry = formData.workingCountry || '';
            professionalInfo.visaType = formData.visaType || '';
            professionalInfo.passportNumber = formData.passportNumber || '';
          } else if (category?.id === 'student') {
            professionalInfo.institutionName = formData.institutionName || '';
            professionalInfo.studentId = formData.studentId || '';
            professionalInfo.guardianIncome = formData.guardianIncome || '';
          } else if (category?.id === 'emergency') {
            professionalInfo.professionName = formData.professionName || '';
            professionalInfo.emergencyReason = formData.emergencyReason || '';
          }

          const result = await submitLoanApplication({
            chat_id: user.id,
            loan_category: category?.id || 'personal',
            amount,
            tenure_months: tenure,
            interest_rate: category?.minRate || 0,
            emi_amount: calculateEMI(),
            processing_fee: amount * (category?.procFee || 0.01),
            security_deposit: amount * (category?.secDeposit || 0.1),
            full_name: formData.fullName,
            father_name: formData.fatherName,
            mother_name: formData.motherName,
            dob: formData.dob,
            gender: formData.gender,
            mobile: formData.mobile,
            whatsapp: formData.whatsapp || null,
            email: formData.email || null,
            current_address: formData.currentAddress,
            permanent_address: formData.permanentAddress,
            professional_info: professionalInfo,
            bank_name: formData.bankName,
            account_name: formData.accountName,
            account_number: formData.accountNumber,
            routing_number: formData.routingNumber || null,
            mobile_banking: formData.mobileBanking || null,
            nominee_name: formData.nomineeName,
            nominee_relation: formData.nomineeRelation,
            nominee_mobile: formData.nomineeMobile,
            nominee_nid: formData.nomineeNid,
          });

          if (result) {
            toast.success(isBn ? 'আপনার আবেদন সফলভাবে জমা হয়েছে!' : 'Application successfully submitted!', { id: loadingId });
          } else {
            toast.error(isBn ? 'সমস্যা হয়েছে, আবার চেষ্টা করুন' : 'Failed, please try again', { id: loadingId });
          }
        } catch (err) {
          console.error('Loan submit error:', err);
          toast.error(isBn ? 'সার্ভার সমস্যা' : 'Server error', { id: loadingId });
        }
        setIsSubmitting(false);
      }

      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Step Components ---

  const Step1Category = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "লোনের ধরন নির্বাচন করুন" : "Select Loan Type"}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{isBn ? "আপনার পেশা অনুযায়ী সঠিক লোন নির্বাচন করুন" : "Select the right loan based on your profession"}</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat) => {
          const isActive = category?.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat);
                const [minT] = getAllowedTenure(amount);
                setTenure(minT);
                setTimeout(() => {
                  setStep((s) => s + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 200);
              }}
              className={`rounded-2xl p-5 text-left relative overflow-hidden ${getColorStyles(cat.color, isActive)}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getIconColor(cat.color)}`}>
                  <cat.icon size={28} />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-gray-900 dark:text-white transition-colors text-lg mb-1">{cat.title}</h3>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide transition-colors">{isBn ? "সর্বোচ্চঃ" : "Up to"} {cat.limit} {isBn ? "টাকা" : ""}</p>
                </div>
                <div className="shrink-0 text-gray-300 mt-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-current opacity-100' : 'border-gray-300 opacity-50'}`}>
                    {isActive && <div className="w-3 h-3 rounded-full bg-current"></div>}
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-white dark:bg-gray-800 transition-colors/60 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700 transition-colors backdrop-blur-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{isBn ? "মেয়াদঃ" : "Tenure:"}</span>
                  <span className="font-bold text-gray-900 dark:text-white transition-colors">{cat.tenureRange}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{isBn ? "সুদের হারঃ" : "Int. Rate:"}</span>
                  <span className="font-bold text-gray-900 dark:text-white transition-colors">{cat.intRates}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{isBn ? "প্রসেসিং সময়ঃ" : "Proc. Time:"}</span>
                  <span className="font-bold text-gray-900 dark:text-white transition-colors">{cat.procTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {cat.features.map((feature, i) => (
                  <span key={i} className={`px-2.5 py-1 text-[10px] rounded border font-bold ${
                    isActive ? 'bg-white dark:bg-gray-800 transition-colors border-'+cat.color+'-200 text-'+cat.color+'-700' : 'bg-gray-50 dark:bg-gray-900 transition-colors border-gray-200 text-gray-600'
                  }`}>
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const Step2Calculator = () => {
    if (!category) return null;
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "লোন ক্যালকুলেটর" : "Loan Calculator"}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{isBn ? "আপনার প্রয়োজনের উপর ভিত্তি করে হিসাব করুন" : "Calculate based on your needs"}</p>
        </div>

        {/* Amount Chips */}
        <div className="bg-white dark:bg-gray-800 transition-colors p-5 rounded-3xl border border-gray-100 dark:border-gray-700 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-4 transition-colors">{isBn ? "লোনের পরিমাণ" : "Loan Amount"}</label>
          <div className="flex flex-wrap gap-2">
            {amountPackages.filter(amt => amt <= (category?.maxAmount || 5000000)).map(pkg => (
              <button
                key={pkg}
                onClick={() => handleAmountChange(pkg)}
                className={`py-2 px-3 rounded-xl font-bold text-sm transition-all border-2 flex-grow text-center ${
                  amount === pkg 
                    ? "border-primary-600 bg-primary-50 text-primary-700 shadow-sm" 
                    : "border-gray-100 dark:border-gray-700 transition-colors bg-gray-50 dark:bg-gray-900 transition-colors hover:border-gray-200 text-gray-600"
                }`}
              >
                {formatAmount(pkg, isBn)}
              </button>
            ))}
          </div>
        </div>

        {/* Tenure Snap Slider */}
        <div className="bg-white dark:bg-gray-800 transition-colors p-5 rounded-3xl border border-gray-100 dark:border-gray-700 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-4 transition-colors">{isBn ? "সময়কাল (মাস)" : "Tenure (Months)"}</label>
          
          <div className="flex flex-wrap gap-2">
            {snapPoints.map(months => {
              const [minAllowed, maxAllowed] = getAllowedTenure(amount);
              const isAllowed = months >= minAllowed && months <= maxAllowed;
              const isSelected = tenure === months;
              
              let btnClass = "py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 flex-grow text-center ";
              if (isSelected) {
                btnClass += "border-primary-600 bg-primary-50 text-primary-700 shadow-sm";
              } else if (isAllowed) {
                btnClass += "border-gray-200 bg-white dark:bg-gray-800 transition-colors text-gray-700 hover:border-gray-300";
              } else {
                btnClass += "border-gray-100 dark:border-gray-700 transition-colors bg-gray-50 dark:bg-gray-900 transition-colors text-gray-300 cursor-not-allowed";
              }

              return (
                <button
                  key={months}
                  disabled={!isAllowed}
                  onClick={() => setTenure(months)}
                  className={btnClass}
                >
                  {months}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium text-center">
            {amount.toLocaleString()} {isBn ? "টাকার জন্য" : "Taka allows"} {getAllowedTenure(amount)[0]} - {getAllowedTenure(amount)[1]} {isBn ? "মাস অনুমোদিত" : "months"}
          </p>
        </div>

        {/* Breakdown */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-gray-800 transition-colors/5 rounded-bl-[100px] -mr-8 -mt-8"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
               <div>
                 <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{isBn ? "মাসিক কিস্তি" : "Monthly EMI"}</p>
                 <p className="text-3xl font-black">৳ {calculateEMI().toLocaleString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{isBn ? "মোট পরিশোধ" : "Total Payable"}</p>
                 <p className="text-xl font-bold text-emerald-400">৳ {(calculateEMI() * tenure).toLocaleString()}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{isBn ? "সুদ হার" : "Interest Rate"}</p>
                <p className="font-semibold text-sm">{category.intRates}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{isBn ? "প্রসেসিং ফি (১%)" : "Processing Fee (1%)"}</p>
                <p className="font-semibold text-sm">৳ {(amount * category.procFee).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{isBn ? "সিকিউরিটি মানি (১০%)" : "Security Deposit (10%)"}</p>
                <p className="font-semibold text-sm">৳ {(amount * category.secDeposit).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Step3PersonalInfo = () => (
    <div className="space-y-5 pb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "ব্যক্তিগত তথ্য" : "Personal Info"}</h2>
        <p className="text-sm text-gray-500">{isBn ? "আপনার সঠিক এবং সম্পূর্ণ তথ্য প্রদান করুন" : "Provide correct and complete information"}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2 mb-3">{isBn ? "প্রাথমিক তথ্য" : "Primary Info"}</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "পূর্ণ নাম (NID অনুযায়ী)" : "Full Name (as per NID)"}</label>
          <input type="text" {...register("fullName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.fullName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500 focus:border-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder={isBn ? "যেমন: মোঃ রহিম উদ্দিন" : "e.g. Md. Rahim Uddin"} /><ErrorText field="fullName" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "পিতার নাম" : "Father's Name"}</label>
            <input type="text" {...register("fatherName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.fatherName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder={isBn ? "পিতার নাম" : "Father's Name"} /><ErrorText field="fatherName" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মাতার নাম" : "Mother's Name"}</label>
            <input type="text" {...register("motherName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.motherName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder={isBn ? "মাতার নাম" : "Mother's Name"} /><ErrorText field="motherName" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "জন্ম তারিখ" : "Date of Birth"}</label>
            <input type="date" {...register("dob")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.dob ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} /><ErrorText field="dob" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "লিঙ্গ" : "Gender"}</label>
            <select {...register("gender")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.gender ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`}>
              <option>{isBn ? "পুরুষ" : "Male"}</option>
              <option>{isBn ? "নারী" : "Female"}</option>
              <option>{isBn ? "অন্যান্য" : "Other"}</option>
            </select><ErrorText field="gender" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2 mb-3">{isBn ? "যোগাযোগের তথ্য" : "Contact Info"}</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মোবাইল নাম্বার" : "Mobile Number"}</label>
              <input type="tel" {...register("mobile")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.mobile ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all resize-none`} placeholder="01XXXXXXXXX" /><ErrorText field="mobile" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "হোয়াটসঅ্যাপ (যদি থাকে)" : "WhatsApp (If any)"}</label>
              <input type="tel" {...register("whatsapp")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.whatsapp ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all resize-none`} placeholder="01XXXXXXXXX" /><ErrorText field="whatsapp" />
            </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "ইমেইল" : "Email"}</label>
          <input type="email" {...register("email")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all resize-none`} placeholder="example@email.com" /><ErrorText field="email" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2 mb-3">{isBn ? "ঠিকানা" : "Address"}</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "বর্তমান ঠিকানা" : "Current Address"}</label>
          <textarea rows={2} {...register("currentAddress")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.currentAddress ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all resize-none`} placeholder={isBn ? "বাসা, রাস্তা, এলাকা..." : "House, Road, Area..."} /><ErrorText field="currentAddress" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "স্থায়ী ঠিকানা" : "Permanent Address"}</label>
          <textarea rows={2} {...register("permanentAddress")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.permanentAddress ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all resize-none`} placeholder={isBn ? "এনআইডি অনুযায়ী সম্পূর্ণ ঠিকানা..." : "Complete address as per NID..."} /><ErrorText field="permanentAddress" />
        </div>
      </div>
    </div>
  );

  const Step4ProfessionalInfo = () => {
    return (
      <div className="space-y-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "পেশাগত তথ্য" : "Professional Info"}</h2>
          <p className="text-sm text-gray-500">{isBn ? "আপনার পেশা সম্পর্কিত বিস্তারিত তথ্য" : "Detailed information about your profession"}</p>
        </div>

        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center gap-3 mb-4">
          {category?.icon && <category.icon size={24} className="text-primary-600" />}
          <div>
             <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">{isBn ? "নির্বাচিত পেশা" : "Selected Profession"}</p>
             <p className="font-bold text-primary-900">{category?.title}</p>
          </div>
        </div>

        <div className="space-y-4">

          {category?.id === 'personal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "কোম্পানির নাম / পেশা" : "Company/Profession Name"}</label>
                <input type="text" {...register("companyName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.companyName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder={isBn ? "কোম্পানি বা পেশার নাম" : "Company or Profession name"} /><ErrorText field="companyName" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "পদবী" : "Designation"}</label>
                  <input type="text" {...register("designation")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.designation ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Manager/Worker" /><ErrorText field="designation" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "কাজের মেয়াদ" : "Work Duration"}</label>
                  <input type="text" {...register("workDuration")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.workDuration ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="যেমন: ৩ বছর" /><ErrorText field="workDuration" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                <input type="number" {...register("monthlyIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.monthlyIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="৳" /><ErrorText field="monthlyIncome" />
              </div>
            </motion.div>
          )}

          {(category?.id === 'business' || category?.id === 'women') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "ব্যবসার নাম" : "Business Name"}</label>
                <input type="text" {...register("businessName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.businessName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="আপনার স্টোর বা কোম্পানির নাম" /><ErrorText field="businessName" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "দোকান / অফিসের ঠিকানা" : "Shop / Office Address"}</label>
                <textarea rows={2} {...register("shopAddress")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.shopAddress ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} resize-none placeholder={isBn ? "ঠিকানা লিখুন" : "Enter Address"} /><ErrorText field="shopAddress" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "ট্রেড লাইসেন্স নম্বর" : "Trade License No"}</label>
                  <input type="text" {...register("tradeLicense")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.tradeLicense ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Tr xxx-xxx" /><ErrorText field="tradeLicense" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                  <input type="number" {...register("guardianIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.guardianIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="৳" /><ErrorText field="guardianIncome" />
                </div>
              </div>
            </motion.div>
          )}

          {category?.id === 'expat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "কর্মরত দেশের নাম" : "Working Country"}</label>
                  <input type="text" {...register("workingCountry")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.workingCountry ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Dubai / KSA" /><ErrorText field="workingCountry" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "ভিসার ধরন" : "Visa Type"}</label>
                  <input type="text" {...register("visaType")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.visaType ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Work Visa" /><ErrorText field="visaType" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "পাসপোর্ট নম্বর" : "Passport Number"}</label>
                  <input type="text" {...register("passportNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.passportNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="AXXXXXXXX" /><ErrorText field="passportNumber" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                  <input type="number" className="w-full bg-gray-50 dark:bg-gray-900 transition-colors border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="৳" />
                </div>
              </div>
            </motion.div>
          )}

          {category?.id === 'student' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "প্রতিষ্ঠানের নাম" : "Institution Name"}</label>
                <input type="text" {...register("institutionName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.institutionName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="University Name" /><ErrorText field="institutionName" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "স্টুডেন্ট আইডি" : "Student ID"}</label>
                  <input type="text" {...register("studentId")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.studentId ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="201-xx-xx" /><ErrorText field="studentId" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "অভিভাবকের আয়" : "Guardian's Income"}</label>
                  <input type="number" className="w-full bg-gray-50 dark:bg-gray-900 transition-colors border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="৳" />
                </div>
              </div>
            </motion.div>
          )}

          {category?.id === 'emergency' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "পেশা" : "Profession"}</label>
                <input type="text" {...register("professionName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.professionName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder={isBn ? "পেশা" : "Profession"} /><ErrorText field="professionName" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "জরুরি কারণ" : "Emergency Reason"}</label>
                <textarea rows={2} {...register("emergencyReason")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.emergencyReason ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} resize-none placeholder="সংক্ষেপে কারণ লিখুন" /><ErrorText field="emergencyReason" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                <input type="number" className="w-full bg-gray-50 dark:bg-gray-900 transition-colors border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="৳" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const Step5BankInfo = () => (
    <div className="space-y-6 pb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "ব্যাংক ও নমিনি" : "Bank & Nominee"}</h2>
        <p className="text-sm text-gray-500">{isBn ? "আপনার একাউন্ট এবং নমিনির তথ্য" : "Your account and nominee info"}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2">{isBn ? "ব্যাংক তথ্য" : "Bank Info"}</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "ব্যাংকের নাম" : "Bank Name"}</label>
          <input type="text" {...register("bankName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.bankName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="DBBL / BRAC Bank / Islami Bank" /><ErrorText field="bankName" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "একাউন্টের নাম" : "Account Name"}</label>
          <input type="text" {...register("accountName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.accountName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Account Holder Name" /><ErrorText field="accountName" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "একাউন্ট নম্বর" : "Account Number"}</label>
              <input type="text" {...register("accountNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.accountNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Account Number" /><ErrorText field="accountNumber" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "রাউটিং নাম্বার (ঐচ্ছিক)" : "Routing Number (Optional)"}</label>
              <input type="text" {...register("routingNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.routingNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Routing Number" /><ErrorText field="routingNumber" />
            </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মোবাইল ব্যাংকিং নম্বর (বিকাশ/নগদ)" : "Mobile Banking Number (bKash/Nagad)"}</label>
          <input type="tel" {...register("mobileBanking")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.mobileBanking ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="01XXXXXXXXX" /><ErrorText field="mobileBanking" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2">{isBn ? "নমিনি তথ্য" : "Nominee Info"}</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "নমিনির নাম" : "Nominee Name"}</label>
          <input type="text" {...register("nomineeName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="Nominee Name" /><ErrorText field="nomineeName" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "সম্পর্ক" : "Relationship"}</label>
            <input type="text" {...register("nomineeRelation")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeRelation ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="ভাই/স্ত্রী" /><ErrorText field="nomineeRelation" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "মোবাইল নাম্বার" : "Mobile Number"}</label>
            <input type="text" {...register("nomineeMobile")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeMobile ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="01XXXXXXXXX" /><ErrorText field="nomineeMobile" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "NID নম্বর" : "NID Number"}</label>
          <input type="text" {...register("nomineeNid")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeNid ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-primary-500"} rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all`} placeholder="নমিনির এনআইডি নম্বর" /><ErrorText field="nomineeNid" />
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-700 mb-1">{isBn ? "নমিনির ছবি (ঐচ্ছিক)" : "Nominee Photo (Optional)"}</label>
           <button className="w-full bg-gray-50 dark:bg-gray-900 transition-colors border border-dashed border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-colors">
             <UploadCloud size={16} className="text-gray-500" />
             <span className="text-xs font-bold text-gray-600">{isBn ? "ছবি আপলোড করুন" : "Upload Photo"}</span>
           </button>
        </div>
      </div>
    </div>
  );

  const Step6Documents = () => (
    <div className="space-y-6 pb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "প্রয়োজনীয় কাগজপত্র" : "Required Documents"}</h2>
        <p className="text-sm text-gray-500">{isBn ? "অনুমোদনের জন্য ডকুমেন্টস আপলোড করুন" : "Upload documents for approval"}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2">{isBn ? "পরিচয়পত্র ও ছবি (সবার জন্য)" : "ID & Photo (For All)"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-colors">
             <div className="w-10 h-10 bg-white dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center shadow-sm">
               <UploadCloud size={18} className="text-gray-500" />
             </div>
             <span className="text-xs font-bold text-gray-600 text-center">{isBn ? "NID সামনের অংশ" : "NID Front"}</span>
          </button>
          <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-colors">
             <div className="w-10 h-10 bg-white dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center shadow-sm">
               <UploadCloud size={18} className="text-gray-500" />
             </div>
             <span className="text-xs font-bold text-gray-600 text-center">{isBn ? "NID পেছনের অংশ" : "NID Back"}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-colors">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center shadow-sm">
                <User size={18} className="text-blue-500" />
              </div>
              <span className="text-xs font-bold text-gray-600 text-center">{isBn ? "সেলফি (NID সহ)" : "Selfie (with NID)"}</span>
          </button>
          <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-colors">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center shadow-sm">
                <UploadCloud size={18} className="text-primary-500" />
              </div>
              <span className="text-xs font-bold text-gray-600 text-center">{isBn ? "পাসপোর্ট সাইজ ছবি" : "Passport Size Photo"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2">{isBn ? "আয়ের প্রমাণপত্র" : "Income Proof"} ({category?.title})</h3>
        <div className="grid grid-cols-1 gap-3">
          {category?.id === 'personal' && (
            <>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "অফিস আইডি কার্ড (Job ID)" : "Office ID Card"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "বেতনের প্রমাণপত্র" : "Salary Certificate"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "অ্যাপয়েন্টমেন্ট লেটার" : "Appointment Letter"}</span>
              </button>
            </>
          )}

          {(category?.id === 'business' || category?.id === 'women') && (
            <>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "ট্রেড লাইসেন্স কপি" : "Trade License Copy"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "দোকান/প্রতিষ্ঠানের ছবি" : "Shop/Institution Photo"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "ব্যবসায়িক ডকুমেন্টস" : "Business Documents"}</span>
              </button>
            </>
          )}

          {category?.id === 'expat' && (
            <>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "পাসপোর্ট কপি" : "Passport Copy"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "ভিসা কপি" : "Visa Copy"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "ওয়ার্ক পারমিট / ওভারসিস আইডি" : "Work Permit / Overseas ID"}</span>
              </button>
            </>
          )}

          {category?.id === 'student' && (
            <>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "স্টুডেন্ট আইডি" : "Student ID"} কার্ড</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "অভিভাবকের NID কপি" : "Guardian's NID Copy"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "অভিভাবকের আয়ের প্রমাণপত্র" : "Guardian's Income Proof"}</span>
              </button>
            </>
          )}

          {category?.id === 'emergency' && (
            <>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "আয়ের প্রমাণপত্র / ব্যাংক স্টেটমেন্ট" : "Income Proof / Bank Statement"}</span>
              </button>
              <button className="bg-gray-50 dark:bg-gray-900 transition-colors border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-primary-50 hover:border-primary-300 transition-colors text-left">
                 <UploadCloud size={18} className="text-gray-500 shrink-0" />
                 <span className="text-xs font-bold text-gray-600 flex-1">{isBn ? "মেডিকেল বা জরুরি ডকুমেন্টস (যদি থাকে)" : "Medical or Emergency Documents (if any)"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-start gap-3 mt-4">
          <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-800 leading-tight font-medium">{isBn ? "অতিরিক্ত ডকুমেন্টস (যেমন: TIN Certificate, Utility Bill) এডমিন আপনার প্রোফাইল যাচাই করার পর সাবমিট করতে হতে পারে।" : "Additional documents (e.g. TIN, Utility Bill) may be required after admin reviews your profile."}</p>
      </div>
    </div>
  );

  const Step7Review = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "আবেদন পর্যালোচনা" : "Application Review"}</h2>
        <p className="text-sm text-gray-500">{isBn ? "জমা দেওয়ার আগে বিস্তারিত চেক করুন" : "Check details before submission"}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 transition-colors p-4 border-b border-gray-100 dark:border-gray-700 transition-colors flex justify-between items-center">
          <div className="flex items-center gap-2">
            {category?.icon && <category.icon size={18} className="text-gray-500" />}
            <span className="font-bold text-sm text-gray-700">{category?.title} লোন</span>
          </div>
          <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full">New</span>
        </div>
        
        <div className="p-4 divide-y divide-gray-50">
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 text-sm">{isBn ? "লোনের পরিমাণ" : "Loan Amount"}</span>
            <span className="font-bold text-gray-900 dark:text-white transition-colors">৳ {amount.toLocaleString()}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 text-sm">সময়কাল</span>
            <span className="font-bold text-gray-900 dark:text-white transition-colors">{tenure} মাস</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 text-sm">{isBn ? "মাসিক কিস্তি (EMI)" : "Monthly EMI"}</span>
            <span className="font-bold text-primary-600">৳ {calculateEMI().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 transition-colors rounded-2xl border border-gray-200 cursor-pointer group">
        <div className="pt-0.5">
          <input 
            type="checkbox" 
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          {isBn ? "আমি ঘোষণা করছি যে, আমার দেওয়া সকল তথ্য সঠিক। আমি" : "I declare that all provided information is correct. I agree to the"} <span className="text-primary-600 font-bold hover:underline">{isBn ? "শর্তাবলীতে" : "Terms & Conditions"}</span> {isBn ? "সম্মত আছি এবং লোন অনুমোদনের ক্ষেত্রে কর্তৃপক্ষের সিদ্ধান্ত চূড়ান্ত বলে গণ্য হবে।" : "and authority decision will be considered final regarding loan approval."}
        </p>
      </label>
    </div>
  );

  const Step8Success = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-10 px-5 space-y-6"
    >
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 ring-8 ring-green-50/50">
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white transition-colors mb-2">{isBn ? "আবেদন সফল!" : "Application Successful!"}</h2>
        <p className="text-gray-600 text-sm">{isBn ? "আপনার আবেদনটি পর্যালোচনার জন্য পাঠানো হয়েছে।" : "Your application has been submitted for review."}</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 transition-colors rounded-2xl border border-gray-200 p-5 text-left max-w-xs mx-auto">
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{isBn ? "ট্র্যাকিং আইডি" : "Tracking ID"}</p>
        <p className="text-lg font-mono font-black text-gray-900 dark:text-white transition-colors mb-4">#LN-{(Math.random()*100000).toFixed(0).padStart(6,'0')}</p>
        
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{isBn ? "বর্তমান স্ট্যাটাস" : "Current Status"}</p>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
           <p className="font-bold text-amber-600 text-sm">{isBn ? "রিভিউ চলছে" : "Under Review"}</p>
        </div>
      </div>

      <div className="pt-6">
        <Link 
          to="/transactions" 
          className="w-full block bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-900/20 active:scale-95 transition-all text-sm"
        >
          ট্র্যাকিং পেজে যান
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-full bg-white dark:bg-gray-800 transition-colors flex flex-col relative">
      {/* Dynamic Header */}
      {step < 8 && (
        <div className="bg-white dark:bg-gray-800 transition-colors px-5 pt-6 pb-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
           {step > 1 ? (
             <button onClick={prevStep} className="p-2 -ml-2 rounded-full bg-gray-50 dark:bg-gray-900 transition-colors hover:bg-gray-100 text-gray-700 transition-colors">
               <ChevronLeft size={20} />
             </button>
           ) : (
             <div className="w-8"></div>
           )}
           
           <div className="flex flex-col items-center">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Step {step} of {totalSteps - 1}</p>
             <div className="flex gap-1 h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 className="bg-primary-500 h-full rounded-full"
                 initial={{ width: 0 }}
                 animate={{ width: `${(step / (totalSteps-1)) * 100}%` }}
                 transition={{ duration: 0.3 }}
               />
             </div>
           </div>

           <div className="w-8"></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="px-5 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && <Step1Category />}
            {step === 2 && <Step2Calculator />}
            {step === 3 && <Step3PersonalInfo />}
            {step === 4 && <Step4ProfessionalInfo />}
            {step === 5 && <Step5BankInfo />}
            {step === 6 && <Step6Documents />}
            {step === 7 && <Step7Review />}
            {step === 8 && <Step8Success />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      {step < 8 && (
        <div className="sticky bottom-0 left-0 right-0 p-5 bg-white dark:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700 transition-colors z-50">
          <button
            onClick={nextStep}
            disabled={(step === 1 && !category) || (step === 7 && !acceptedTerms) || isSubmitting}
            className="w-full bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (isBn ? 'অপেক্ষা করুন...' : 'Please wait...') : step === 7 ? (isBn ? "সাবমিট করুন" : "Submit") : (isBn ? "পরবর্তী ধাপ" : "Next Step")} {!isSubmitting && <ChevronRight size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
