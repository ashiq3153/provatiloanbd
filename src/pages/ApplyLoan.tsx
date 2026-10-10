import React, { useState, useEffect } from "react";
import { getTelegramUser } from "../lib/telegram";
import { submitLoanApplication, getLoanApplicationById, updateLoanApplication, checkDuplicateApplication, uploadDocument } from "../lib/api";
import { supabase } from "../lib/supabase";
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
  Award,
  Users,
  Landmark,
  X,
  Lock,
  ShieldAlert,
  Search
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'sonner';
import { useAppStore } from "../lib/store";
import { convertDigits, formatCurrency } from "../lib/translation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLoanSchema, LoanFormData } from "./ApplyLoanSchema";
import { AddressSelector, AddressValue, emptyAddress, serializeAddress } from "../components/AddressSelector";
import "../loan-application-redesign.css";

import { getCategories, snapPoints, amountPackages, formatAmount, getAllowedTenure, getColorStyles, getIconColor } from "./apply-loan-utils";
import { calculateLoan, getLoanFeeRates } from "../lib/finance";
import { getLoanDocumentRequirements, getMissingRequiredDocuments } from "../lib/loan-document-requirements";

const ErrorText = ({ field }: { field: keyof LoanFormData }) => {
  const { formState: { errors } } = useFormContext<LoanFormData>();
  const error = errors[field];
  return error ? (
    <p className="text-red-500 text-xs mt-1 font-medium transition-opacity animate-in fade-in flex items-center gap-1">
      <AlertCircle size={12} className="shrink-0" />
      <span>{error.message}</span>
    </p>
  ) : null;
};

const AccordionSection = ({
  sectionKey,
  title,
  icon,
  fields,
  isExpanded,
  onToggle,
  isBn,
  category,
  flagged,
  children
}: {
  sectionKey: string;
  title: string;
  icon: React.ReactNode;
  fields: (keyof LoanFormData)[];
  isExpanded: boolean;
  onToggle: () => void;
  isBn: boolean;
  category: any;
  flagged?: boolean;
  children: React.ReactNode;
}) => {
  const { formState: { errors }, getValues } = useFormContext<LoanFormData>();
  const errorCount = fields.filter(f => errors[f]).length;
  const hasError = errorCount > 0;
  const isComplete = !hasError && fields.some(f => getValues(f));

  return (
    <div id={`accordion-section-${sectionKey}`} className="space-y-1.5 scroll-mt-20">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 transition-all text-left font-bold text-sm select-none cursor-pointer border ${
          isExpanded
            ? flagged
              ? "bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm border-amber-500 text-amber-900 dark:text-amber-100 rounded-t-2xl rounded-b-none ring-2 ring-amber-500/20"
              : "bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm border-primary-500/50 dark:border-primary-500/30 text-primary-900 dark:text-primary-100 rounded-t-2xl rounded-b-none"
            : flagged
            ? "bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm border-amber-400 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 rounded-2xl ring-2 ring-amber-500/10 animate-pulse"
            : hasError
            ? "bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm border-rose-400/60 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl"
            : "bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800 text-gray-800 dark:text-gray-200 hover:border-primary-500/30 rounded-2xl"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            isExpanded
              ? flagged ? "bg-amber-500 text-white" : "bg-primary-500 text-white"
              : flagged
              ? "bg-amber-500 text-white animate-bounce"
              : hasError
              ? "bg-rose-500 text-white"
              : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-gray-500 dark:text-gray-400"
          }`}>
            {icon}
          </div>
          <div className="flex items-center gap-2">
            <span>{title}</span>
            {sectionKey === "professional" && category && (
              <span className="px-2 py-0.5 text-[9px] bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 rounded font-black tracking-wide uppercase">
                {category.title}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {flagged ? (
            <span className="flex items-center gap-1 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-black animate-pulse border border-amber-300 dark:border-amber-800">
              <AlertCircle size={10} className="text-amber-600 dark:text-amber-450" />
              {isBn ? "সংশোধন প্রয়োজন" : "Needs Revision"}
            </span>
          ) : hasError ? (
            <span className="flex items-center gap-1 text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 px-2 py-1 rounded-full font-black animate-pulse">
              <AlertCircle size={10} />
              {isBn ? `${convertDigits(errorCount.toString(), true)}টি ভুল` : `${errorCount} errors`}
            </span>
          ) : isComplete ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : null}
          <ChevronRight 
            size={16} 
            className={`transition-transform duration-200 text-gray-400 ${isExpanded ? "rotate-90 text-primary-500" : ""}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="apply-accordion-body p-3 pt-3 bg-gray-50/40 dark:bg-gray-950/20 border border-t-0 border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800 rounded-b-2xl space-y-4 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.02)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const computeChangesDiff = (original: any, current: any, isBn: boolean): string[] => {
  const changes: string[] = [];
  if (!original) return changes;

  const originalForm = original.formData || {};
  const currentForm = current || {};

  const fieldLabels: Record<string, { bn: string; en: string }> = {
    fullName: { bn: "পূর্ণ নাম", en: "Full Name" },
    fatherName: { bn: "পিতার নাম", en: "Father's Name" },
    motherName: { bn: "Mother's Name", en: "Mother's Name" },
    dob: { bn: "জন্ম তারিখ", en: "Date of Birth" },
    gender: { bn: "লিঙ্গ", en: "Gender" },
    mobile: { bn: "মোবাইল নম্বর", en: "Mobile Number" },
    whatsapp: { bn: "হোয়াটসঅ্যাপ নম্বর", en: "WhatsApp Number" },
    email: { bn: "ইমেইল এড্রেস", en: "Email Address" },
    currentAddress: { bn: "বর্তমান ঠিকানা", en: "Current Address" },
    permanentAddress: { bn: "স্থায়ী ঠিকানা", en: "Permanent Address" },
    nidNumber: { bn: "এনআইডি নম্বর", en: "NID Number" },
    
    companyName: { bn: "কোম্পানির নাম", en: "Company Name" },
    designation: { bn: "পদবী", en: "Designation" },
    workDuration: { bn: "কাজের মেয়াদ", en: "Work Duration" },
    monthlyIncome: { bn: "মাসিক আয়", en: "Monthly Income" },
    businessName: { bn: "ব্যবসার নাম", en: "Business Name" },
    shopAddress: { bn: "দোকানের ঠিকানা", en: "Shop Address" },
    tradeLicense: { bn: "ট্রেড লাইসেন্স নম্বর", en: "Trade License Number" },
    workingCountry: { bn: "কর্মরত দেশ", en: "Working Country" },
    visaType: { bn: "ভিসার ধরণ", en: "Visa Type" },
    passportNumber: { bn: "পাসপোর্ট নম্বর", en: "Passport Number" },
    institutionName: { bn: "প্রতিষ্ঠানের নাম", en: "Institution Name" },
    studentId: { bn: "স্টুডেন্ট আইডি", en: "Student ID" },
    guardianIncome: { bn: "অভিভাবকের আয়", en: "Guardian's Income" },
    professionName: { bn: "পেশার নাম", en: "Profession Name" },
    emergencyReason: { bn: "জরুরি কারণ", en: "Emergency Reason" },

    bankName: { bn: "ব্যাংকের নাম", en: "Bank Name" },
    accountName: { bn: "হিসাবের নাম", en: "Account Name" },
    accountNumber: { bn: "হিসাব নম্বর", en: "Account Number" },
    routingNumber: { bn: "রাউটিং নম্বর", en: "Routing Number" },
    mobileBanking: { bn: "মোবাইল ব্যাংকিং", en: "Mobile Banking Number" },

    nomineeName: { bn: "নমিনির নাম", en: "Nominee Name" },
    nomineeRelation: { bn: "সম্পর্ক", en: "Nominee Relation" },
    nomineeMobile: { bn: "নমিনির মোবাইল", en: "Nominee Mobile" },
    nomineeNid: { bn: "নমিনির এনআইডি", en: "Nominee NID" },
  };

  for (const key of Object.keys(fieldLabels)) {
    const origVal = originalForm[key] !== undefined ? String(originalForm[key]).trim() : "";
    const currVal = currentForm[key] !== undefined ? String(currentForm[key]).trim() : "";
    if (origVal !== currVal) {
      const label = isBn ? fieldLabels[key].bn : fieldLabels[key].en;
      if (isBn) {
        changes.push(`${label} সংশোধন করা হয়েছে (পূর্বের মান: '${origVal || "খালি"}', নতুন মান: '${currVal || "খালি"}')`);
      } else {
        changes.push(`${label} changed from '${origVal || "empty"}' to '${currVal || "empty"}'`);
      }
    }
  }

  const origDocs = original.documents || {};
  const currDocs = currentForm.documents || {};
  const docLabels: Record<string, { bn: string; en: string }> = {
    nid_front: { bn: "এনআইডি সামনের অংশ ছবি", en: "NID Front Side Photo" },
    nid_back: { bn: "এনআইডি পেছনের অংশ ছবি", en: "NID Back Side Photo" },
    selfie: { bn: "সেলফি ছবি", en: "Selfie Image" },
    photo: { bn: "পাসপোর্ট সাইজ ছবি", en: "Passport Size Photo" },
    nominee_photo: { bn: "নমিনির ছবি", en: "Nominee Photo" },
    office_id: { bn: "অফিস আইডি কার্ড", en: "Office ID Card" },
    salary_cert: { bn: "বেতনের প্রমাণপত্র", en: "Salary Certificate" },
    appointment_letter: { bn: "অ্যাপয়েন্টমেন্ট লেটার", en: "Appointment Letter" },
    trade_license: { bn: "ট্রেড লাইসেন্স কপি", en: "Trade License Copy" },
    shop_photo: { bn: "দোকান/প্রতিষ্ঠানের ছবি", en: "Shop/Institution Photo" },
    business_docs: { bn: "ব্যবসায়িক অন্যান্য ডকুমেন্টস", en: "Business Documents" },
    passport_copy: { bn: "পাসপোর্ট কপি", en: "Passport Copy" },
    visa_copy: { bn: "ভিসা কপি", en: "Visa Copy" },
    work_permit: { bn: "ওয়ার্ক পারমিট / ওভারসিস আইডি", en: "Work Permit" },
    student_id: { bn: "স্টুডেন্ট আইডি কার্ড", en: "Student ID Card" },
    guardian_nid: { bn: "অভিভাবকের NID কপি", en: "Guardian's NID Copy" },
    guardian_income: { bn: "অভিভাবকের আয়ের প্রমাণপত্র", en: "Guardian's Income Proof" },
    income_proof: { bn: "আয়ের প্রমাণপত্র / ব্যাংক স্টেটমেন্ট", en: "Income Proof / Bank Statement" },
    emergency_docs: { bn: "মেডিকেল বা জরুরি ডকুমেন্টস", en: "Medical/Emergency Documents" },
  };

  for (const key of Object.keys(docLabels)) {
    const origDoc = origDocs[key] || "";
    const currDoc = currDocs[key] || "";
    if (origDoc !== currDoc) {
      const label = isBn ? docLabels[key].bn : docLabels[key].en;
      if (isBn) {
        changes.push(`${label} পুনরায় আপলোড করা হয়েছে`);
      } else {
        changes.push(`${label} has been re-uploaded`);
      }
    }
  }

  return changes;
};

export default function ApplyLoan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, systemSettings } = useAppStore();
  const isBn = language === "bn";
  const user = getTelegramUser();
  const draftStorageKey = `loan_draft_v1_${user.id}`;
  const categories = React.useMemo(() => {
    const allCats = getCategories(isBn, systemSettings);
    return allCats.filter(cat => systemSettings?.categories?.[cat.id]?.enabled !== false);
  }, [isBn, systemSettings]);

  const monthlyRateLabel = (key: string, fallback: number) => {
    const configured = Number(systemSettings?.[key]);
    const rate = Number.isFinite(configured) && configured >= 0 ? configured : fallback;
    return convertDigits((rate * 100).toFixed(2) + "%", isBn);
  };
  const loanLimitLabel = (key: string, fallback: number) => {
    const configured = Number(systemSettings?.categories?.[key]?.maxAmount);
    const amount = Number.isFinite(configured) && configured > 0 ? configured : fallback;
    return convertDigits(amount.toLocaleString("en-IN"), isBn);
  };
  const feeTiers = systemSettings?.feeTiers || {};
  const percentLabel = (rate: number) => convertDigits((rate * 100).toFixed(2) + "%", isBn);
  const processingFeeUpTo1m = Number(feeTiers.processingFeeUpTo1m ?? 0.01);
  const processingFeeAbove1m = Number(feeTiers.processingFeeAbove1m ?? 0.005);
  const securityDepositUpTo500k = Number(feeTiers.securityDepositUpTo500k ?? 0.10);
  const securityDepositAbove500k = Number(feeTiers.securityDepositAbove500k ?? 0.05);

  const methods = useForm<LoanFormData>({
    resolver: zodResolver(getLoanSchema(isBn)),
    mode: "onChange",
  });
  const { register, trigger, formState: { errors } } = methods;


  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [category, setCategory] = useState<ReturnType<typeof getCategories>[0] | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string>("");
  const [amount, setAmount] = useState(500000);
  const [tenure, setTenure] = useState(24);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [professionSearch, setProfessionSearch] = useState("");
  const [detailsCategoryId, setDetailsCategoryId] = useState<string | null>(null);
  const [showRepaymentSchedule, setShowRepaymentSchedule] = useState(false);
  const [repaymentStartDate, setRepaymentStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Structured address states
  const [currentAddress, setCurrentAddress] = useState<AddressValue>(emptyAddress());
  const [permanentAddress, setPermanentAddress] = useState<AddressValue>(emptyAddress());
  const [addressErrors, setAddressErrors] = useState<{
    current: Partial<Record<keyof AddressValue, string>>;
    permanent: Partial<Record<keyof AddressValue, string>>;
  }>({ current: {}, permanent: {} });

  // Smart Review System States
  const [verificationStage, setVerificationStage] = useState<'idle' | 'confirm' | 'verifying' | 'success' | 'failed'>('idle');
  const [activeCheck, setActiveCheck] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [verifyingError, setVerifyingError] = useState<string | null>(null);

  // Warnings Checklist Checklist States
  const [checkAntiFraud, setCheckAntiFraud] = useState(false);
  const [checkNoRefund, setCheckNoRefund] = useState(false);
  const [checkSavingsRule, setCheckSavingsRule] = useState(false);
  const [checkEmiObligation, setCheckEmiObligation] = useState(false);

  const handleCloseVerification = () => {
    setVerificationStage('idle');
    setCheckAntiFraud(false);
    setCheckNoRefund(false);
    setCheckSavingsRule(false);
    setCheckEmiObligation(false);
    setProgressPercent(0);
    setActiveCheck(0);
    setVerifyingError(null);
  };

  // Accordion state for Step 3 combined info form
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    personal: true,
    professional: false,
    bank: false,
    nominee: false,
    guarantor: false
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showStepHelp, setShowStepHelp] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [flaggedSections, setFlaggedSections] = useState<Record<string, boolean>>({
    personal: false,
    professional: false,
    bank: false,
    nominee: false,
    guarantor: false,
    documents: false
  });
  const [originalData, setOriginalData] = useState<any>(null);

  // Ban check on mount
  useEffect(() => {
    if (user && user.id) {
      supabase.from('profiles').select('is_banned').eq('chat_id', user.id).single().then(({ data }) => {
        if (data?.is_banned) {
          toast.error(isBn ? 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। আপনি লোন আবেদন করতে পারবেন না।' : 'Your account is suspended. You cannot apply for loans.');
          navigate('/');
        }
      });
    }
  }, [user, isBn, navigate]);

  // Scroll to top on step changes to ensure user starts from top of next step
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollTimers = [
      setTimeout(() => window.scrollTo(0, 0), 50),
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 150),
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 300)
    ];
    return () => scrollTimers.forEach(clearTimeout);
  }, [step]);

  const toggleSection = (section: string) => {
    const nextState = !expanded[section];
    setExpanded(prev => ({ ...prev, [section]: nextState }));
    if (nextState) {
      setTimeout(() => {
        const el = document.getElementById(`accordion-section-${section}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Remove the legacy shared key: it has no owner ID and could contain another member's private draft.
    localStorage.removeItem('loan_draft_v1');
    const selectedCategory = params.get('category');
    const edit = params.get('edit');

    if (edit) {
      setEditId(edit);
      getLoanApplicationById(edit).then(loan => {
        if (loan) {
          const matched = categories.find(cat => cat.id === loan.loan_category);
          if (matched) setCategory(matched);
          setAmount(Number(loan.amount));
          setTenure(Number(loan.tenure_months));
          if (loan.documents) {
            setDocuments(loan.documents);
          }

          // Parse stored address JSON (if stored) or fall back to empty
          let parsedCurrentAddr: AddressValue = emptyAddress();
          let parsedPermanentAddr: AddressValue = emptyAddress();
          try {
            if (loan.current_address && loan.current_address.trim().startsWith('{')) {
              parsedCurrentAddr = JSON.parse(loan.current_address);
            }
          } catch (e) {}
          try {
            if (loan.permanent_address && loan.permanent_address.trim().startsWith('{')) {
              parsedPermanentAddr = JSON.parse(loan.permanent_address);
            }
          } catch (e) {}
          setCurrentAddress(parsedCurrentAddr);
          setPermanentAddress(parsedPermanentAddr);

          const defaultFields = {
            fullName: loan.full_name,
            fatherName: loan.father_name,
            motherName: loan.mother_name,
            dob: loan.dob || '',
            gender: loan.gender || 'Male',
            mobile: loan.mobile,
            whatsapp: loan.whatsapp || '',
            email: loan.email || '',
            currentAddress: parsedCurrentAddr,
            permanentAddress: parsedPermanentAddr,
            nidNumber: loan.nid_number || '',
            bankName: loan.bank_name,
            accountName: loan.account_name,
            accountNumber: loan.account_number,
            routingNumber: loan.routing_number || '',
            mobileBanking: loan.mobile_banking || '',
            nomineeName: loan.nominee_name,
            nomineeRelation: loan.nominee_relation,
            nomineeMobile: loan.nominee_mobile,
            nomineeNid: loan.nominee_nid,
            ...(loan.professional_info as any)
          };

          methods.reset(defaultFields);
          if (loan.documents) setDocuments(loan.documents);

          // Parse admin feedback JSON for flagged sections
          let feedbackText = loan.admin_feedback || '';
          let flagged = {
            personal: false,
            professional: false,
            bank: false,
            nominee: false,
            guarantor: false,
            documents: false
          };

          if (loan.status === 'action_required' && loan.admin_feedback) {
            try {
              if (loan.admin_feedback.trim().startsWith('{')) {
                const parsed = JSON.parse(loan.admin_feedback);
                feedbackText = parsed.note || '';
                if (parsed.flagged) {
                  flagged = {
                    personal: !!parsed.flagged.personal,
                    professional: !!parsed.flagged.professional,
                    bank: !!parsed.flagged.bank,
                    nominee: !!parsed.flagged.nominee,
                    guarantor: !!parsed.flagged.guarantor,
                    documents: !!parsed.flagged.documents
                  };
                }
              }
            } catch (e) {
              console.error("Error parsing admin_feedback JSON", e);
            }
          }

          setFeedbackNote(feedbackText);
          setFlaggedSections(flagged);
          setOriginalData({
            formData: defaultFields,
            documents: loan.documents || {}
          });

          if (loan.status === 'action_required') {
            // Auto expand flagged sections in step 3
            setExpanded({
              personal: flagged.personal,
              professional: flagged.professional,
              bank: flagged.bank,
              nominee: flagged.nominee,
              guarantor: flagged.guarantor
            });

            // Auto navigate step
            if (flagged.personal || flagged.professional || flagged.bank || flagged.nominee || flagged.guarantor) {
              setStep(3);
            } else if (flagged.documents) {
              setStep(4);
            }
          }
        }
      });
    } else if (selectedCategory) {
      const matched = categories.find((cat) => cat.id === selectedCategory);
      if (matched) {
        setCategory(matched);
        setStep(2);
      }
    } else {
      // Try to restore in-progress draft (only if past step 1)
      const draftStr = localStorage.getItem(draftStorageKey);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          // Only restore if user was past step 1 (mid-application)
          if (Number(draft.chatId) === user.id && draft.step && draft.step > 1 && draft.step < 5) {
            setStep(draft.step);
            if (draft.categoryId) {
              const matched = categories.find(cat => cat.id === draft.categoryId);
              if (matched) setCategory(matched);
            }
            if (draft.amount) setAmount(draft.amount);
            if (draft.tenure) setTenure(draft.tenure);
            if (draft.formData) {
              methods.reset(draft.formData);
              if (draft.formData.currentAddress) {
                setCurrentAddress(draft.formData.currentAddress);
              }
              if (draft.formData.permanentAddress) {
                setPermanentAddress(draft.formData.permanentAddress);
              }
            }
          } else {
            localStorage.removeItem(draftStorageKey);
          }
        } catch(e) {
          localStorage.removeItem(draftStorageKey);
        }
      }
    }
  }, [location.search, categories]);

  // Save draft without causing re-renders (subscription-based)
  useEffect(() => {
    if (editId || step >= 5) return;
    const subscription = methods.watch((formData) => {
      const draft = {
        chatId: user.id,
        step,
        categoryId: category?.id,
        amount,
        tenure,
        formData
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    });
    return () => subscription.unsubscribe();
  }, [step, category, amount, tenure, editId]);

  // Auto-adjusted tenure state
  const handleAmountChange = (val: number) => {
    setAmount(val);
    const rawAllowed = getAllowedTenure(val);
    const minAllowed = Math.max(rawAllowed[0], category?.minTenure ?? 12);
    const maxAllowed = Math.min(rawAllowed[1], category?.maxTenure ?? 60);
    if (tenure < minAllowed) setTenure(minAllowed);
    if (tenure > maxAllowed) setTenure(maxAllowed);
  };

  const getLoanCalculation = () => {
    const feeRates = getLoanFeeRates(amount, systemSettings);
    return calculateLoan({
      principal: amount,
      monthlyRate: category?.minRate || 0,
      tenureMonths: tenure,
      processingFeeRate: feeRates.processingFeeRate,
      securityDepositRate: feeRates.securityDepositRate,
      insuranceRate: systemSettings?.insuranceRate ?? 0.01,
      insuranceEnabled: !!systemSettings?.insuranceEnabled,
      method: "flat",
    });
  };

  const calculateEMI = () => getLoanCalculation().emi;



  const nextStep = async () => {
    if (step < totalSteps) {
      if (step === 1 && !category) return;
      if (step === 2 && (!amount || !tenure)) return;
      
      if (step === 3) {
        // Validate address fields manually
        const validateAddr = (addr: AddressValue, isBn: boolean) => {
          const errs: Partial<Record<keyof AddressValue, string>> = {};
          if (!addr.district) errs.district = isBn ? "জেলা নির্বাচন করুন" : "Select district";
          if (!addr.upazila) errs.upazila = isBn ? "উপজেলা নির্বাচন করুন" : "Select upazila";
          if (!addr.union) errs.union = isBn ? "ইউনিয়ন/পৌরসভা লিখুন" : "Enter union";
          if (!addr.village) errs.village = isBn ? "গ্রাম/মহল্লা লিখুন" : "Enter village";
          if (!addr.postCode || addr.postCode.length < 4) errs.postCode = isBn ? "পোস্ট কোড দিন" : "Enter post code";
          return errs;
        };
        const currErrs = validateAddr(currentAddress, isBn);
        const permErrs = validateAddr(permanentAddress, isBn);
        setAddressErrors({ current: currErrs, permanent: permErrs });
        const hasAddrError = Object.keys(currErrs).length > 0 || Object.keys(permErrs).length > 0;

        // Sync address values to form for RHF validation
        methods.setValue('currentAddress', currentAddress as any);
        methods.setValue('permanentAddress', permanentAddress as any);

        const personalFields: (keyof LoanFormData)[] = ['fullName', 'fatherName', 'motherName', 'dob', 'gender', 'mobile', 'whatsapp', 'email', 'nidNumber'];
        
        let profFields: (keyof LoanFormData)[] = [];
        if (category?.id === 'personal') profFields = ['companyName', 'designation', 'workDuration', 'monthlyIncome', 'jobAddress'];
        else if (category?.id === 'business') profFields = [
          'businessName', 'brandName', 'shopAddress', 'tradeLicense', 'tradeLicenseIssueDate', 
          'vatBinNumber', 'rjscNumber', 'factoryAddress', 'showroomCount', 'totalEmployees', 
          'yearsInProfit', 'avgMonthlySales', 'seasonalSales', 'cogs', 'netProfitMargin', 
          'accountsReceivable', 'accountsPayable', 'currentStockValue', 'loanPurposeDetails', 
          'mainCurrentAccount', 'ccOdLimit', 'otherActiveLoans', 'monthlyIncome'
        ];
        else if (category?.id === 'women') profFields = [
          'businessName', 'brandName', 'shopAddress', 'tradeLicense', 'tradeLicenseIssueDate', 
          'vatBinNumber', 'rjscNumber', 'equityPercentage', 'applicantRole', 'productType', 
          'rawMaterialSource', 'salesChannel', 'govtScheme', 'monthlyIncome'
        ];
        else if (category?.id === 'expat') profFields = [
          'workingCountry', 'visaType', 'passportNumber', 'passportIssueDate', 'passportExpiryDate',
          'iqamaNumber', 'foreignAddress', 'foreignMobile', 'foreignWhatsapp', 'foreignCompanyName',
          'foreignCompanyContact', 'workerCategory', 'supervisorNameContact', 'avgMonthlyRemittance',
          'remittanceChannel', 'receiverBankAccount', 'coApplicantName', 'coApplicantRelation',
          'coApplicantProfession', 'coApplicantIncome', 'coApplicantNid', 'coApplicantCurrentAddress',
          'coApplicantPermanentAddress', 'monthlyIncome'
        ];
        else if (category?.id === 'student') profFields = [
          'sscRoll', 'sscReg', 'sscBoard', 'sscGpa', 'sscYear', 'sscInstitution',
          'hscRoll', 'hscReg', 'hscBoard', 'hscGpa', 'hscYear', 'hscInstitution',
          'gradRoll', 'gradReg', 'gradBoard', 'gradCgpa', 'gradYear', 'gradInstitution',
          'targetUniversity', 'targetDepartment', 'courseRanking', 'creditHours', 'tuitionFee',
          'accommodationCost', 'healthInsurance', 'otherFees', 'sponsorName', 'sponsorRelation',
          'sponsorIncomeSource', 'sponsorJobDetails', 'sponsorTaxableIncome', 'sponsorNetWorth'
        ];
        else if (category?.id === 'emergency') profFields = [
          'professionName', 'patientName', 'patientRelation', 'patientNid', 'patientCondition',
          'hospitalName', 'referringDoctor', 'doctorBmdc', 'hospitalDepartment', 'treatmentType',
          'estimatedCost', 'applicantContribution', 'insuranceCoverage', 'insuranceAmount', 'shortfallAmount', 'hrContactNumber'
        ];
        
        const bankFields: (keyof LoanFormData)[] = ['bankName', 'accountName', 'accountNumber', 'routingNumber', 'mobileBanking'];
        const nomineeFields: (keyof LoanFormData)[] = ['nomineeName', 'nomineeRelation', 'nomineeMobile', 'nomineeNid'];
        let guarantorFields: (keyof LoanFormData)[] = [];
        if (category?.id === 'personal') {
          guarantorFields = ['g1Name', 'g1Relation', 'g1Nid', 'g1Mobile', 'g1Address', 'g1Profession', 'g2Name', 'g2Designation', 'g2OfficialId', 'g2Email', 'g2Mobile'];
        }
        
        const allFields = [...personalFields, ...profFields, ...bankFields, ...nomineeFields, ...guarantorFields];
        const isValid = await trigger(allFields);
        
        if (!isValid || hasAddrError) {
          // Auto-expand sections that have validation errors
          const newExpanded = { ...expanded };
          const hasPersonalError = personalFields.some(f => errors[f]) || hasAddrError;
          const hasProfError = profFields.some(f => errors[f]);
          const hasBankError = bankFields.some(f => errors[f]);
          const hasNomineeError = nomineeFields.some(f => errors[f]);
          const hasGuarantorError = guarantorFields.some(f => errors[f]);
          
          if (hasPersonalError) newExpanded.personal = true;
          if (hasProfError) newExpanded.professional = true;
          if (hasBankError) newExpanded.bank = true;
          if (hasNomineeError) newExpanded.nominee = true;
          if (hasGuarantorError) newExpanded.guarantor = true;
          
          setExpanded(newExpanded);
          toast.error(isBn ? 'অনুগ্রহ করে লাল চিহ্নিত ত্রুটিযুক্ত তথ্যগুলো সঠিকভাবে পূরণ করুন।' : 'Please correct the errors marked in red.');
          return;
        }
      }

      if (step === 4) {
        const missingDocuments = getMissingRequiredDocuments(category?.id || 'personal', documents);
        if (missingDocuments.length > 0) {
          const preview = missingDocuments.slice(0, 3).map(d => isBn ? d.labelBn : d.labelEn).join(', ');
          const extra = missingDocuments.length > 3 ? (isBn ? ` এবং আরও ${missingDocuments.length - 3}টি` : ` and ${missingDocuments.length - 3} more`) : '';
          toast.error(isBn ? `প্রয়োজনীয় কাগজপত্র দিন: ${preview}${extra}` : `Required documents missing: ${preview}${extra}`);
          return;
        }
        if (!acceptedTerms) {
          toast.error(isBn ? 'অনুগ্রহ করে শর্তাবলীতে সম্মত হন' : 'Please agree to the terms and conditions');
          return;
        }
        setVerificationStage('confirm');
        return;
      }

      const newStep = step + 1;
      setStep(newStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const draftStr = localStorage.getItem(draftStorageKey);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          draft.step = newStep;
          localStorage.setItem(draftStorageKey, JSON.stringify(draft));
        } catch (e) {}
      }
    }
  };

  const processLoanApplication = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    const loadingId = toast.loading(isBn ? 'আবেদন জমা দেওয়া হচ্ছে...' : 'Submitting application...');
    
    try {
      const formData = methods.getValues();
      
      const duplicateMatch = await checkDuplicateApplication(
        formData.mobile,
        formData.email || null,
        formData.accountNumber,
        formData.nomineeNid,
        formData.nidNumber,
        formData.passportNumber || null,
        editId
      );
      
      if (duplicateMatch) {
        toast.error(isBn ? `এই ${duplicateMatch} ইতিমধ্যে ব্যবহার করা হয়েছে! Fake Apply Detected.` : `This ${duplicateMatch} is already used! Fake Apply Detected.`, { id: loadingId });
        setIsSubmitting(false);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('is_banned').eq('chat_id', user.id).single();
      if (profile?.is_banned) {
        toast.error(isBn ? 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। আপনি আবেদন করতে পারবেন না।' : 'Your account is suspended. You cannot apply.', { id: loadingId });
        setIsSubmitting(false);
        return;
      }

      const professionalInfo: Record<string, string> = {};
      if (category?.id === 'personal') {
        professionalInfo.companyName = formData.companyName || '';
        professionalInfo.designation = formData.designation || '';
        professionalInfo.workDuration = formData.workDuration || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
        
        // Extra personal info
        professionalInfo.eTin = formData.eTin || '';
        professionalInfo.bloodGroup = formData.bloodGroup || '';
        professionalInfo.maritalStatus = formData.maritalStatus || '';
        professionalInfo.spouseProfession = formData.spouseProfession || '';
        professionalInfo.spouseIncome = formData.spouseIncome || '';

        // HR & Salary
        professionalInfo.corporateCode = formData.corporateCode || '';
        professionalInfo.joiningDate = formData.joiningDate || '';
        professionalInfo.confirmationDate = formData.confirmationDate || '';
        professionalInfo.hrName = formData.hrName || '';
        professionalInfo.hrDesignation = formData.hrDesignation || '';
        professionalInfo.hrEmail = formData.hrEmail || '';
        professionalInfo.hrMobile = formData.hrMobile || '';
        professionalInfo.basicSalary = formData.basicSalary || '';
        professionalInfo.houseRentAllowance = formData.houseRentAllowance || '';
        professionalInfo.festivalBonus = formData.festivalBonus || '';
        professionalInfo.providentFundDeduction = formData.providentFundDeduction || '';
        professionalInfo.netTakeHomePay = formData.netTakeHomePay || '';
        professionalInfo.existingLoanBank = formData.existingLoanBank || '';
        professionalInfo.existingLoanEmi = formData.existingLoanEmi || '';
        professionalInfo.existingCreditCardOutstanding = formData.existingCreditCardOutstanding || '';

        // Guarantors
        professionalInfo.g1Name = formData.g1Name || '';
        professionalInfo.g1Relation = formData.g1Relation || '';
        professionalInfo.g1Nid = formData.g1Nid || '';
        professionalInfo.g1Mobile = formData.g1Mobile || '';
        professionalInfo.g1Address = formData.g1Address || '';
        professionalInfo.g1Profession = formData.g1Profession || '';
        professionalInfo.g2Name = formData.g2Name || '';
        professionalInfo.g2Designation = formData.g2Designation || '';
        professionalInfo.g2OfficialId = formData.g2OfficialId || '';
        professionalInfo.g2Email = formData.g2Email || '';
        professionalInfo.g2Mobile = formData.g2Mobile || '';
      } else if (category?.id === 'business' || category?.id === 'women') {
        professionalInfo.businessName = formData.businessName || '';
        professionalInfo.brandName = formData.brandName || '';
        professionalInfo.shopAddress = formData.shopAddress || '';
        professionalInfo.tradeLicense = formData.tradeLicense || '';
        professionalInfo.tradeLicenseIssueDate = formData.tradeLicenseIssueDate || '';
        professionalInfo.vatBinNumber = formData.vatBinNumber || '';
        professionalInfo.rjscNumber = formData.rjscNumber || '';
        professionalInfo.factoryAddress = formData.factoryAddress || '';
        professionalInfo.showroomCount = formData.showroomCount || '';
        professionalInfo.totalEmployees = formData.totalEmployees || '';
        professionalInfo.yearsInProfit = formData.yearsInProfit || '';
        professionalInfo.avgMonthlySales = formData.avgMonthlySales || '';
        professionalInfo.seasonalSales = formData.seasonalSales || '';
        professionalInfo.cogs = formData.cogs || '';
        professionalInfo.netProfitMargin = formData.netProfitMargin || '';
        professionalInfo.accountsReceivable = formData.accountsReceivable || '';
        professionalInfo.accountsPayable = formData.accountsPayable || '';
        professionalInfo.currentStockValue = formData.currentStockValue || '';
        professionalInfo.loanPurposeDetails = formData.loanPurposeDetails || '';
        professionalInfo.mainCurrentAccount = formData.mainCurrentAccount || '';
        professionalInfo.ccOdLimit = formData.ccOdLimit || '';
        professionalInfo.otherActiveLoans = formData.otherActiveLoans || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
      } else if (category?.id === 'expat') {
        professionalInfo.workingCountry = formData.workingCountry || '';
        professionalInfo.visaType = formData.visaType || '';
        professionalInfo.passportNumber = formData.passportNumber || '';
        professionalInfo.passportIssueDate = formData.passportIssueDate || '';
        professionalInfo.passportExpiryDate = formData.passportExpiryDate || '';
        professionalInfo.iqamaNumber = formData.iqamaNumber || '';
        professionalInfo.foreignAddress = formData.foreignAddress || '';
        professionalInfo.foreignMobile = formData.foreignMobile || '';
        professionalInfo.foreignWhatsapp = formData.foreignWhatsapp || '';
        professionalInfo.foreignCompanyName = formData.foreignCompanyName || '';
        professionalInfo.foreignCompanyContact = formData.foreignCompanyContact || '';
        professionalInfo.workerCategory = formData.workerCategory || '';
        professionalInfo.supervisorNameContact = formData.supervisorNameContact || '';
        professionalInfo.avgMonthlyRemittance = formData.avgMonthlyRemittance || '';
        professionalInfo.remittanceChannel = formData.remittanceChannel || '';
        professionalInfo.receiverBankAccount = formData.receiverBankAccount || '';
        professionalInfo.coApplicantName = formData.coApplicantName || '';
        professionalInfo.coApplicantRelation = formData.coApplicantRelation || '';
        professionalInfo.coApplicantProfession = formData.coApplicantProfession || '';
        professionalInfo.coApplicantIncome = formData.coApplicantIncome || '';
        professionalInfo.coApplicantNid = formData.coApplicantNid || '';
        professionalInfo.coApplicantCurrentAddress = formData.coApplicantCurrentAddress || '';
        professionalInfo.coApplicantPermanentAddress = formData.coApplicantPermanentAddress || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
      } else if (category?.id === 'student') {
        professionalInfo.sscRoll = formData.sscRoll || '';
        professionalInfo.sscReg = formData.sscReg || '';
        professionalInfo.sscBoard = formData.sscBoard || '';
        professionalInfo.sscGpa = formData.sscGpa || '';
        professionalInfo.sscYear = formData.sscYear || '';
        professionalInfo.sscInstitution = formData.sscInstitution || '';

        professionalInfo.hscRoll = formData.hscRoll || '';
        professionalInfo.hscReg = formData.hscReg || '';
        professionalInfo.hscBoard = formData.hscBoard || '';
        professionalInfo.hscGpa = formData.hscGpa || '';
        professionalInfo.hscYear = formData.hscYear || '';
        professionalInfo.hscInstitution = formData.hscInstitution || '';

        professionalInfo.gradRoll = formData.gradRoll || '';
        professionalInfo.gradReg = formData.gradReg || '';
        professionalInfo.gradBoard = formData.gradBoard || '';
        professionalInfo.gradCgpa = formData.gradCgpa || '';
        professionalInfo.gradYear = formData.gradYear || '';
        professionalInfo.gradInstitution = formData.gradInstitution || '';

        professionalInfo.targetUniversity = formData.targetUniversity || '';
        professionalInfo.targetDepartment = formData.targetDepartment || '';
        professionalInfo.courseRanking = formData.courseRanking || '';
        professionalInfo.creditHours = formData.creditHours || '';
        professionalInfo.tuitionFee = formData.tuitionFee || '';
        professionalInfo.accommodationCost = formData.accommodationCost || '';
        professionalInfo.healthInsurance = formData.healthInsurance || '';
        professionalInfo.otherFees = formData.otherFees || '';

        professionalInfo.sponsorName = formData.sponsorName || '';
        professionalInfo.sponsorRelation = formData.sponsorRelation || '';
        professionalInfo.sponsorIncomeSource = formData.sponsorIncomeSource || '';
        professionalInfo.sponsorJobDetails = formData.sponsorJobDetails || '';
        professionalInfo.sponsorTaxableIncome = formData.sponsorTaxableIncome || '';
        professionalInfo.sponsorNetWorth = formData.sponsorNetWorth || '';
      } else if (category?.id === 'emergency') {
        professionalInfo.professionName = formData.professionName || '';
        professionalInfo.patientName = formData.patientName || '';
        professionalInfo.patientRelation = formData.patientRelation || '';
        professionalInfo.patientNid = formData.patientNid || '';
        professionalInfo.patientCondition = formData.patientCondition || '';
        professionalInfo.hospitalName = formData.hospitalName || '';
        professionalInfo.referringDoctor = formData.referringDoctor || '';
        professionalInfo.doctorBmdc = formData.doctorBmdc || '';
        professionalInfo.hospitalDepartment = formData.hospitalDepartment || '';
        professionalInfo.treatmentType = formData.treatmentType || '';
        professionalInfo.estimatedCost = formData.estimatedCost || '';
        professionalInfo.applicantContribution = formData.applicantContribution || '';
        professionalInfo.insuranceCoverage = formData.insuranceCoverage || '';
        professionalInfo.insuranceAmount = formData.insuranceAmount || '';
        professionalInfo.shortfallAmount = formData.shortfallAmount || '';
        professionalInfo.hrContactNumber = formData.hrContactNumber || '';
      }

      let updatedFeedbackJson = '';
      if (editId) {
        try {
          const { data: currentLoan } = await supabase
            .from('loan_applications')
            .select('admin_feedback, status')
            .eq('id', editId)
            .single();

          if (currentLoan) {
            let existingHistory: any[] = [];
            if (currentLoan.admin_feedback && currentLoan.admin_feedback.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(currentLoan.admin_feedback);
                if (Array.isArray(parsed.history)) {
                  existingHistory = parsed.history;
                }
              } catch (e) {}
            }

            const currentFormData = { ...formData, documents: documents };
            const changes = computeChangesDiff(originalData, currentFormData, isBn);

            if (changes.length > 0 || feedbackNote) {
              const historyEntry = {
                date: new Date().toISOString(),
                note: feedbackNote || (isBn ? "ইউজার তথ্য সংশোধন করেছেন।" : "User corrected details."),
                changes: changes
              };
              existingHistory.push(historyEntry);
            }

            updatedFeedbackJson = JSON.stringify({
              note: null,
              flagged: {
                personal: false,
                professional: false,
                bank: false,
                nominee: false,
                guarantor: false,
                documents: false
              },
              history: existingHistory
            });
          }
        } catch (e) {
          console.error("Error computing diff on submit:", e);
        }
      }

      const payload = {
        chat_id: user.id,
        loan_category: category?.id || 'personal',
        amount,
        tenure_months: tenure,
        interest_rate: category?.minRate || 0,
        emi_amount: getLoanCalculation().emi,
        processing_fee: getLoanCalculation().processingFee,
        security_deposit: getLoanCalculation().securityDeposit,
        calculation_method: "flat",
        rate_version_id: null,
        total_interest: getLoanCalculation().totalInterest,
        total_payable: getLoanCalculation().totalPayable,
        full_name: formData.fullName,
        father_name: formData.fatherName,
        mother_name: formData.motherName,
        dob: formData.dob,
        gender: formData.gender,
        mobile: formData.mobile,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        current_address: JSON.stringify(currentAddress),
        permanent_address: JSON.stringify(permanentAddress),
        nid_number: formData.nidNumber,
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
        documents: documents,
        ...(editId && updatedFeedbackJson ? { admin_feedback: updatedFeedbackJson } : {})
      };

      let result;
      if (editId) {
        result = await updateLoanApplication(editId, payload);
      } else {
        result = await submitLoanApplication(payload);
      }

      if (result) {
        setSubmittedApplicationId(result.id || editId || null);
        toast.success(isBn ? 'আপনার আবেদন সফলভাবে জমা হয়েছে!' : 'Application successfully submitted!', { id: loadingId });
        localStorage.removeItem(draftStorageKey);
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(isBn ? 'সমস্যা হয়েছে, আবার চেষ্টা করুন' : 'Failed, please try again', { id: loadingId });
      }
    } catch (err) {
      console.error('Loan submit error:', err);
      toast.error(isBn ? 'সার্ভার সমস্যা' : 'Server error', { id: loadingId });
    }
    setIsSubmitting(false);
  };

  const prevStep = () => {
    if (step > 1) {
      const newStep = step - 1;
      setStep(newStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const draftStr = localStorage.getItem(draftStorageKey);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          draft.step = newStep;
          localStorage.setItem(draftStorageKey, JSON.stringify(draft));
        } catch (e) {}
      }
    }
  };

  const processSmartVerification = async () => {
    setVerificationStage('verifying');
    setVerifyingError(null);
    setActiveCheck(0);
    setProgressPercent(0);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // 1. Profile Completeness (0% -> 25%)
      setProgressPercent(10);
      await sleep(500);
      setProgressPercent(25);
      setActiveCheck(1);
      await sleep(400);

      // 2. Anti-Fraud & Duplicate check (25% -> 50%)
      setProgressPercent(35);
      await sleep(500);
      const formData = methods.getValues();
      const duplicateMatch = await checkDuplicateApplication(
        formData.mobile,
        formData.email || null,
        formData.accountNumber,
        formData.nomineeNid,
        formData.nidNumber,
        formData.passportNumber || null,
        editId
      );
      if (duplicateMatch) {
        setVerifyingError(
          isBn 
            ? `এই ${duplicateMatch} ইতিমধ্যে ব্যবহার করা হয়েছে! Fake Apply Detected.` 
            : `This ${duplicateMatch} is already used! Fake Apply Detected.`
        );
        setVerificationStage('failed');
        return;
      }
      setProgressPercent(50);
      setActiveCheck(2);
      await sleep(400);

      // 3. Account integrity check (50% -> 75%)
      setProgressPercent(60);
      await sleep(500);
      const { data: profile } = await supabase.from('profiles').select('is_banned').eq('chat_id', user.id).single();
      if (profile?.is_banned) {
        setVerifyingError(
          isBn 
            ? 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। আপনি আবেদন করতে পারবেন না।' 
            : 'Your account is suspended. Submission rejected.'
        );
        setVerificationStage('failed');
        return;
      }
      setProgressPercent(75);
      setActiveCheck(3);
      await sleep(400);

      // 4. Submission & Database entry (75% -> 100%)
      setProgressPercent(85);
      await sleep(500);

      const professionalInfo: Record<string, string> = {};
      if (category?.id === 'personal') {
        professionalInfo.companyName = formData.companyName || '';
        professionalInfo.designation = formData.designation || '';
        professionalInfo.workDuration = formData.workDuration || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
      } else if (category?.id === 'business') {
        professionalInfo.businessName = formData.businessName || '';
        professionalInfo.shopAddress = formData.shopAddress || '';
        professionalInfo.tradeLicense = formData.tradeLicense || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
      } else if (category?.id === 'women') {
        professionalInfo.businessName = formData.businessName || '';
        professionalInfo.brandName = formData.brandName || '';
        professionalInfo.shopAddress = formData.shopAddress || '';
        professionalInfo.tradeLicense = formData.tradeLicense || '';
        professionalInfo.tradeLicenseIssueDate = formData.tradeLicenseIssueDate || '';
        professionalInfo.vatBinNumber = formData.vatBinNumber || '';
        professionalInfo.rjscNumber = formData.rjscNumber || '';
        professionalInfo.equityPercentage = formData.equityPercentage || '';
        professionalInfo.applicantRole = formData.applicantRole || '';
        professionalInfo.productType = formData.productType || '';
        professionalInfo.rawMaterialSource = formData.rawMaterialSource || '';
        professionalInfo.salesChannel = formData.salesChannel || '';
        professionalInfo.govtScheme = formData.govtScheme || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
      } else if (category?.id === 'expat') {
        professionalInfo.workingCountry = formData.workingCountry || '';
        professionalInfo.visaType = formData.visaType || '';
        professionalInfo.passportNumber = formData.passportNumber || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
      } else if (category?.id === 'student') {
        professionalInfo.institutionName = formData.institutionName || '';
        professionalInfo.studentId = formData.studentId || '';
        professionalInfo.guardianIncome = formData.guardianIncome || '';
      } else if (category?.id === 'emergency') {
        professionalInfo.professionName = formData.professionName || '';
        professionalInfo.patientName = formData.patientName || '';
        professionalInfo.patientRelation = formData.patientRelation || '';
        professionalInfo.patientNid = formData.patientNid || '';
        professionalInfo.patientCondition = formData.patientCondition || '';
        professionalInfo.hospitalName = formData.hospitalName || '';
        professionalInfo.referringDoctor = formData.referringDoctor || '';
        professionalInfo.doctorBmdc = formData.doctorBmdc || '';
        professionalInfo.hospitalDepartment = formData.hospitalDepartment || '';
        professionalInfo.treatmentType = formData.treatmentType || '';
        professionalInfo.estimatedCost = formData.estimatedCost || '';
        professionalInfo.applicantContribution = formData.applicantContribution || '';
        professionalInfo.insuranceCoverage = formData.insuranceCoverage || '';
        professionalInfo.insuranceAmount = formData.insuranceAmount || '';
        professionalInfo.shortfallAmount = formData.shortfallAmount || '';
        professionalInfo.hrContactNumber = formData.hrContactNumber || '';
      }

      let updatedFeedbackJson = '';
      if (editId) {
        try {
          const { data: currentLoan } = await supabase
            .from('loan_applications')
            .select('admin_feedback, status')
            .eq('id', editId)
            .single();

          if (currentLoan) {
            let existingHistory: any[] = [];
            if (currentLoan.admin_feedback && currentLoan.admin_feedback.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(currentLoan.admin_feedback);
                if (Array.isArray(parsed.history)) {
                  existingHistory = parsed.history;
                }
              } catch (e) {}
            }

            const currentFormData = { ...formData, documents: documents };
            const changes = computeChangesDiff(originalData, currentFormData, isBn);

            if (changes.length > 0 || feedbackNote) {
              const historyEntry = {
                date: new Date().toISOString(),
                note: feedbackNote || (isBn ? "ইউজার তথ্য সংশোধন করেছেন।" : "User corrected details."),
                changes: changes
              };
              existingHistory.push(historyEntry);
            }

            updatedFeedbackJson = JSON.stringify({
              note: null,
              flagged: {
                personal: false,
                professional: false,
                bank: false,
                nominee: false,
                documents: false
              },
              history: existingHistory
            });
          }
        } catch (e) {
          console.error("Error computing diff on submit:", e);
        }
      }

      const payload = {
        chat_id: user.id,
        loan_category: category?.id || 'personal',
        amount,
        tenure_months: tenure,
        interest_rate: category?.minRate || 0,
        emi_amount: calculateEMI(),
        processing_fee: getLoanCalculation().processingFee,
        security_deposit: getLoanCalculation().securityDeposit,
        full_name: formData.fullName,
        father_name: formData.fatherName,
        mother_name: formData.motherName,
        dob: formData.dob,
        gender: formData.gender,
        mobile: formData.mobile,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        current_address: JSON.stringify(currentAddress),
        permanent_address: JSON.stringify(permanentAddress),
        nid_number: formData.nidNumber,
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
        documents: documents,
        ...(editId && updatedFeedbackJson ? { admin_feedback: updatedFeedbackJson } : {})
      };

      let result;
      if (editId) {
        result = await updateLoanApplication(editId, payload);
      } else {
        result = await submitLoanApplication(payload);
      }

      if (result) {
        setSubmittedApplicationId(result.id || editId || null);
        setProgressPercent(100);
        setActiveCheck(4);
        setVerificationStage('success');
        await sleep(650);

        localStorage.removeItem(draftStorageKey);
        handleCloseVerification();
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setVerifyingError(
          isBn 
            ? 'আবেদন সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' 
            : 'Failed to submit loan records. Please try again.'
        );
        setVerificationStage('failed');
      }
    } catch (err) {
      console.error('Smart verification error:', err);
      setVerifyingError(isBn ? 'সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে।' : 'Internal server error during verification.');
      setVerificationStage('failed');
    }
  };

  // --- Step Components ---

  const Step1Category = () => {
    type ProfessionOption = {
      id: string;
      label: string;
      shortLabel: string;
      icon: React.ElementType;
      categories: string[];
    };

    const professionOptions: ProfessionOption[] = [
      { id: "govt", label: "সরকারি চাকরিজীবী", shortLabel: "সরকারি চাকরি", icon: Briefcase, categories: ["personal"] },
      { id: "private", label: "বেসরকারি চাকরিজীবী", shortLabel: "বেসরকারি চাকরি", icon: Briefcase, categories: ["personal"] },
      { id: "teacher", label: "শিক্ষক/শিক্ষিকা", shortLabel: "শিক্ষক", icon: GraduationCap, categories: ["personal"] },
      { id: "health", label: "ডাক্তার/স্বাস্থ্যকর্মী", shortLabel: "স্বাস্থ্যকর্মী", icon: Award, categories: ["personal"] },
      { id: "engineer", label: "ইঞ্জিনিয়ার/প্রকৌশলী", shortLabel: "ইঞ্জিনিয়ার", icon: Briefcase, categories: ["personal"] },
      { id: "banker", label: "ব্যাংকার/আর্থিক প্রতিষ্ঠানের কর্মী", shortLabel: "ব্যাংকার", icon: Landmark, categories: ["personal"] },
      { id: "lawyer", label: "আইনজীবী", shortLabel: "আইনজীবী", icon: Briefcase, categories: ["personal"] },
      { id: "security", label: "পুলিশ/প্রতিরক্ষা/নিরাপত্তা কর্মী", shortLabel: "নিরাপত্তা", icon: Lock, categories: ["personal"] },
      { id: "professional", label: "এনজিও/মিডিয়া/আইটি পেশাজীবী", shortLabel: "পেশাজীবী", icon: Briefcase, categories: ["personal"] },
      { id: "freelancer", label: "ফ্রিল্যান্সার", shortLabel: "ফ্রিল্যান্সার", icon: Briefcase, categories: ["personal"] },

      { id: "shopkeeper", label: "দোকানদার/খুচরা ব্যবসায়ী", shortLabel: "দোকানদার", icon: Store, categories: ["business"] },
      { id: "wholesale", label: "পাইকারি ব্যবসায়ী", shortLabel: "পাইকারি ব্যবসা", icon: Store, categories: ["business"] },
      { id: "farmer", label: "কৃষক/খামারি", shortLabel: "কৃষক/খামারি", icon: Store, categories: ["business"] },
      { id: "entrepreneur", label: "উদ্যোক্তা/ব্যবসা প্রতিষ্ঠানের মালিক", shortLabel: "উদ্যোক্তা", icon: Store, categories: ["business"] },
      { id: "online", label: "অনলাইন ব্যবসায়ী", shortLabel: "অনলাইন ব্যবসা", icon: Store, categories: ["business"] },
      { id: "transport", label: "পরিবহন ব্যবসায়ী", shortLabel: "পরিবহন", icon: Store, categories: ["business"] },
      { id: "restaurant", label: "রেস্টুরেন্ট/হোটেল ব্যবসায়ী", shortLabel: "হোটেল/রেস্টুরেন্ট", icon: Store, categories: ["business"] },
      { id: "service", label: "সেবা/কারিগরি ব্যবসায়ী", shortLabel: "সেবা ব্যবসা", icon: Store, categories: ["business"] },
      { id: "contractor", label: "নির্মাণ/ঠিকাদারি ব্যবসায়ী", shortLabel: "ঠিকাদারি", icon: Store, categories: ["business"] },

      { id: "expat", label: "বিদেশে কর্মরত/প্রবাসী", shortLabel: "প্রবাসী", icon: Plane, categories: ["expat"] },
      { id: "expat-pro", label: "প্রবাসী পেশাজীবী/ব্যবসায়ী", shortLabel: "প্রবাসী পেশাজীবী", icon: Plane, categories: ["expat"] },

      { id: "student", label: "শিক্ষার্থী", shortLabel: "শিক্ষার্থী", icon: GraduationCap, categories: ["student"] },
      { id: "student-abroad", label: "বিদেশে পড়তে ইচ্ছুক শিক্ষার্থী", shortLabel: "বিদেশে পড়াশোনা", icon: GraduationCap, categories: ["student"] },

      { id: "women", label: "নারী উদ্যোক্তা/ব্যবসায়ী", shortLabel: "নারী উদ্যোক্তা", icon: Award, categories: ["women"] },
      { id: "women-farmer", label: "নারী কৃষক/খামারি", shortLabel: "নারী কৃষক", icon: Award, categories: ["women"] },
      { id: "women-online", label: "নারী অনলাইন উদ্যোক্তা", shortLabel: "নারী অনলাইন", icon: Award, categories: ["women"] },

      { id: "emergency", label: "জরুরি চিকিৎসা/জরুরি প্রয়োজন", shortLabel: "জরুরি প্রয়োজন", icon: AlertCircle, categories: ["emergency"] },
    ];

    const quickProfessionGroups: ProfessionOption[] = [
      { id: "job-group", label: "চাকরিজীবী", shortLabel: "চাকরি", icon: Briefcase, categories: ["personal"] },
      { id: "business-group", label: "ব্যবসায়ী", shortLabel: "ব্যবসা", icon: Store, categories: ["business"] },
      { id: "expat-group", label: "প্রবাসী", shortLabel: "প্রবাসী", icon: Plane, categories: ["expat"] },
      { id: "student-group", label: "শিক্ষার্থী", shortLabel: "শিক্ষার্থী", icon: GraduationCap, categories: ["student"] },
      { id: "women-group", label: "নারী উদ্যোক্তা", shortLabel: "নারী উদ্যোক্তা", icon: Award, categories: ["women"] },
      { id: "emergency-group", label: "জরুরি প্রয়োজন", shortLabel: "জরুরি", icon: AlertCircle, categories: ["emergency"] },
    ];

    const selectedOption =
      professionOptions.find(item => item.label === selectedProfession) ||
      quickProfessionGroups.find(item => item.label === selectedProfession);

    const selectedCategories = selectedOption?.categories || [];
    const visibleCategories = categories.filter(cat => selectedCategories.includes(cat.id));
    const filteredProfessions = professionOptions.filter(item =>
      item.label.toLowerCase().includes(professionSearch.trim().toLowerCase())
    );
    const detailsCategory = categories.find(cat => cat.id === detailsCategoryId);
    const detailsProfessions = detailsCategory
      ? professionOptions.filter(item => item.categories.includes(detailsCategory.id))
      : [];
    const detailRequirements = detailsCategory
      ? getLoanDocumentRequirements(detailsCategory.id)
      : [];
    const detailInfoLabels: Record<string, string> = {
      fullName: "পূর্ণ নাম", fatherName: "পিতার নাম", motherName: "মাতার নাম", dob: "জন্ম তারিখ", gender: "লিঙ্গ",
      mobile: "মোবাইল নম্বর", nidNumber: "NID নম্বর", currentAddress: "বর্তমান ঠিকানা", permanentAddress: "স্থায়ী ঠিকানা",
      companyName: "প্রতিষ্ঠানের নাম", designation: "পদবী", workDuration: "চাকরির মেয়াদ", monthlyIncome: "মাসিক আয়",
      businessName: "ব্যবসার নাম", shopAddress: "ব্যবসার ঠিকানা", tradeLicense: "ট্রেড লাইসেন্স", bankName: "ব্যাংকের নাম",
      accountNumber: "ব্যাংক হিসাব নম্বর", workingCountry: "কর্মরত দেশ", visaType: "ভিসার ধরন", passportNumber: "পাসপোর্ট নম্বর",
      institutionName: "শিক্ষা প্রতিষ্ঠানের নাম", studentId: "স্টুডেন্ট আইডি", guardianIncome: "অভিভাবকের আয়",
      targetUniversity: "টার্গেট বিশ্ববিদ্যালয়", targetDepartment: "বিভাগ/কোর্স", tuitionFee: "টিউশন ফি",
      patientName: "রোগীর নাম", patientRelation: "রোগীর সাথে সম্পর্ক", patientNid: "রোগীর NID", patientCondition: "রোগ/অবস্থা",
      hospitalName: "হাসপাতালের নাম", treatmentType: "চিকিৎসার ধরন", estimatedCost: "আনুমানিক চিকিৎসা খরচ",
      avgMonthlySales: "গড় মাসিক বিক্রয়", productType: "পণ্য/সেবার ধরন", eTin: "e-TIN/ট্যাক্স তথ্য",
      rjscNumber: "RJSC নম্বর", applicantRole: "আবেদনকারীর ভূমিকা", equityPercentage: "মালিকানা শতাংশ",
      avgMonthlyRemittance: "গড় মাসিক রেমিট্যান্স", remittanceChannel: "রেমিট্যান্স মাধ্যম",
      receiverBankAccount: "রিসিভার ব্যাংক হিসাব", foreignCompanyName: "বিদেশি প্রতিষ্ঠানের নাম",
      workerCategory: "কর্মীর ধরন", sponsorIncomeSource: "স্পনসরের আয়ের উৎস", sponsorTaxableIncome: "স্পনসরের আয়"
    };
    const detailInfoFields = Array.from(new Set(detailRequirements.flatMap(req => req.mapsTo)))
      .map(key => detailInfoLabels[key] || key);

    const selectCategory = (cat: ReturnType<typeof getCategories>[0]) => {
      const rawAllowed = getAllowedTenure(amount);
      const minAllowed = Math.max(rawAllowed[0], cat.minTenure ?? 12);
      setCategory(cat);
      setTenure(minAllowed);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const selectProfession = (item: ProfessionOption) => {
      setSelectedProfession(item.label);
      setShowProfessionModal(false);
      setProfessionSearch("");
    };

    return (
      <div className="loan-category-reference-screen loan-easy-font space-y-3 pb-5">
        <section className="rounded-[18px] bg-white dark:bg-[#0f2925] border border-slate-200 dark:border-emerald-900/40 shadow-sm overflow-hidden">
          <div className="px-3.5 pt-3 pb-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] leading-tight font-black text-slate-900 dark:text-white">
                  {isBn ? "আপনার পেশা নির্বাচন করুন" : "Choose your profession"}
                </h2>
                <p className="mt-0.5 text-[8px] leading-3.5 text-slate-500 dark:text-slate-400">
                  {isBn ? "আপনার পেশা অনুযায়ী শুধু প্রযোজ্য লোন দেখানো হবে" : "Only applicable loans will be shown for your profession"}
                </p>
              </div>
              
            </div>

            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {quickProfessionGroups.map(item => {
                const active = selectedCategories.length > 0 && item.categories.some(id => selectedCategories.includes(id));
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectProfession(item)}
                    className={
                      "shrink-0 min-w-[88px] h-[58px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all " +
                      (active
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-400 text-slate-900 dark:text-white shadow-sm"
                        : "bg-slate-50/80 dark:bg-[#10221f] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300")
                    }
                  >
                    <span className={"w-6 h-6 rounded-lg flex items-center justify-center " + (active ? "bg-amber-100 dark:bg-amber-900/30 text-emerald-800 dark:text-emerald-300" : "bg-white dark:bg-[#16302b] text-slate-500 dark:text-slate-300")}>
                      <Icon size={13} />
                    </span>
                    <span className="text-[8px] font-black leading-none">{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowProfessionModal(true)}
              className="mt-2 w-full h-9 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[9px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1"
            >
              {isBn ? "সব পেশা দেখুন" : "View all professions"} <ChevronRight size={13} />
            </button>
          </div>
        </section>

        {selectedOption ? (
          <>
<div className="flex items-center justify-between px-1 pt-1">
          <div>
            <h3 className="text-[12px] font-black text-slate-800 dark:text-white">
              {isBn ? "উপযুক্ত ক্যাটাগরি" : "Applicable loan categories"}
            </h3>
            <p className="text-[8px] text-slate-400 mt-0.5">
              {isBn ? (visibleCategories.length + "টি ক্যাটাগরি দেখানো হচ্ছে") : (visibleCategories.length + " applicable")}
            </p>
          </div>
          <span className="text-[8px] font-semibold text-slate-400">{isBn ? "পেশা অনুযায়ী ফিল্টার" : "Filtered by profession"}</span>
        </div>

        <div className="space-y-2.5">
          {visibleCategories.map(cat => {
            const isActive = category?.id === cat.id;
            return (
              <article
                key={cat.id}
                className={"relative overflow-hidden rounded-[16px] border bg-white dark:bg-[#10211f] shadow-sm transition-all " + (
                  isActive
                    ? "border-amber-400 ring-1 ring-amber-300/70 dark:ring-amber-800/60"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                {isActive && (
                  <div className="absolute right-0 top-0 bg-amber-400 text-[7px] font-black text-white px-2 py-1 rounded-bl-lg">
                    {isBn ? "আপনার জন্য সুপারিশকৃত" : "RECOMMENDED"}
                  </div>
                )}

                <div className="px-3 pt-2.5 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 " +
                        (cat.id === "personal" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" :
                         cat.id === "business" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                         cat.id === "expat" ? "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300" :
                         cat.id === "student" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" :
                         cat.id === "women" ? "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300" :
                         "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300")
                      }
                      >
                        <cat.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[12px] font-black leading-[1.1] text-slate-900 dark:text-white">
                          {cat.title} {isBn ? "লোন" : "Loan"} <span className="font-semibold text-slate-400">({cat.id === "expat" ? "Probashi" : cat.id === "business" ? "SME" : cat.id === "student" ? "Student" : cat.id === "personal" ? "Personal" : cat.id === "women" ? "Women Entrepreneur" : "Emergency"})</span>
                        </h4>
                        <p className={"mt-0.5 text-[8px] font-bold " + (cat.id === "emergency" ? "text-rose-500" : "text-emerald-600 dark:text-emerald-300")}>
                          {isBn ? "সর্বোচ্চ " + cat.limit + " পর্যন্ত" : "Up to " + cat.limit}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[8px] font-black text-slate-600 dark:text-slate-300">
                      {cat.id === "emergency" ? (isBn ? "জরুরি সেবা" : "Urgent") : (isBn ? "সাধারণ" : "Standard")}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700 rounded-xl bg-slate-50/80 dark:bg-[#0d1b1a] border border-slate-100 dark:border-slate-800 py-1.5">
                    <div className="px-2 text-center">
                      <p className="text-[7px] text-slate-400 font-semibold">{isBn ? "সুদের হার" : "Interest"}</p>
                      <p className="mt-0.5 text-[8px] font-black text-slate-800 dark:text-white">{cat.intRates}<span className="text-[6px] text-slate-400">/মাস</span></p>
                    </div>
                    <div className="px-2 text-center">
                      <p className="text-[7px] text-slate-400 font-semibold">{isBn ? "পরিশোধের সময়" : "Tenure"}</p>
                      <p className="mt-0.5 text-[8px] font-black text-slate-800 dark:text-white">{cat.tenureRange}</p>
                    </div>
                    <div className="px-2 text-center">
                      <p className="text-[7px] text-slate-400 font-semibold">{isBn ? "প্রসেসিং সময়" : "Processing"}</p>
                      <p className={"mt-0.5 text-[8px] font-black " + (cat.id === "emergency" ? "text-rose-500" : "text-slate-800 dark:text-white")}>{cat.procTime}</p>
                    </div>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[7px]">
                      <span className="text-slate-400">{isBn ? "প্রসেসিং ফি:" : "Processing fee:"}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{cat.procFeeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[7px]">
                      <span className="text-slate-400">{isBn ? "প্রয়োজনীয় নথি:" : "Required documents:"}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[68%]">{cat.reqDocs.slice(0, 2).join(" • ")}</span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailsCategoryId(cat.id)}
                      className="h-7 rounded-full border border-slate-400 dark:border-slate-600 bg-white dark:bg-transparent text-[8px] font-black text-slate-700 dark:text-slate-200"
                    >
                      {isBn ? "লোনের বিস্তারিত" : "Loan details"}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={"h-7 rounded-full text-[8px] font-black text-white shadow-sm flex items-center justify-center gap-1 " + (cat.id === "emergency" ? "bg-rose-600" : "bg-[#075f50] hover:bg-[#064c40]")}
                    >
                      {isBn ? "আবেদন করুন" : "Apply now"} <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {visibleCategories.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 px-3 py-3 text-center">
            <p className="text-[9px] font-black text-amber-800 dark:text-amber-200">{isBn ? "এই পেশার জন্য কোনো সক্রিয় ক্যাটাগরি নেই।" : "No active category is available for this profession."}</p>
          </div>
        )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-5 text-center">
            <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-200">
              {isBn ? "প্রথমে আপনার পেশা নির্বাচন করুন" : "Please select your profession first"}
            </p>
            <p className="mt-1 text-[8px] text-slate-500 dark:text-slate-400">
              {isBn ? "পেশা নির্বাচন করার পর শুধু আপনার জন্য প্রযোজ্য লোন ক্যাটাগরি দেখানো হবে।" : "Only the loan categories applicable to your profession will appear after selection."}
            </p>
          </div>
        )}

        {showProfessionModal && (
          <div className="fixed inset-0 z-[70] bg-black/55 flex items-end justify-center">
            <div className="w-full max-w-[520px] max-h-[88vh] rounded-t-[24px] bg-white dark:bg-[#0b1716] shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white">{isBn ? "সব পেশা নির্বাচন করুন" : "Choose profession"}</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5">{professionOptions.length}টি পেশা</p>
                  </div>
                  <button type="button" onClick={() => setShowProfessionModal(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <X size={17} />
                  </button>
                </div>
                <div className="mt-3 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 px-3">
                  <Search size={15} className="text-slate-400" />
                  <input
                    value={professionSearch}
                    onChange={e => setProfessionSearch(e.target.value)}
                    placeholder={isBn ? "পেশা খুঁজুন..." : "Search profession..."}
                    className="w-full bg-transparent outline-none text-[10px] font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="p-3 overflow-y-auto max-h-[65vh]">
                <div className="grid grid-cols-2 gap-2">
                  {filteredProfessions.map(item => {
                    const Icon = item.icon;
                    const active = selectedProfession === item.label;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectProfession(item)}
                        className={"text-left rounded-xl border p-2.5 flex items-center gap-2 " + (
                          active
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101d1b]"
                        )}
                      >
                        <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Icon size={15} />
                        </span>
                        <span className="text-[9px] font-black leading-3.5 text-slate-800 dark:text-slate-100">{item.label}</span>
                        {active && <CheckCircle2 size={14} className="ml-auto text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {detailsCategory && (
          <div className="fixed inset-0 z-[80] bg-black/55 flex items-end justify-center">
            <div className="w-full max-w-[520px] max-h-[90vh] rounded-t-[24px] bg-white dark:bg-[#0b1716] shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white">{detailsCategory.title} {isBn ? "লোনের বিস্তারিত" : "Loan details"}</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">{isBn ? "লোনের শর্ত, প্রয়োজনীয় কাগজপত্র ও আবেদন ধাপ" : "Terms, required documents and application steps"}</p>
                </div>
                <button type="button" onClick={() => setDetailsCategoryId(null)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X size={17} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[74vh] space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3"><p className="text-[8px] text-slate-400">সর্বোচ্চ লোন</p><p className="text-[10px] font-black mt-1 text-slate-900 dark:text-white">{detailsCategory.limit}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3"><p className="text-[8px] text-slate-400">সুদের হার</p><p className="text-[10px] font-black mt-1 text-slate-900 dark:text-white">{detailsCategory.intRates}/মাস</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3"><p className="text-[8px] text-slate-400">মেয়াদ</p><p className="text-[10px] font-black mt-1 text-slate-900 dark:text-white">{detailsCategory.tenureRange}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3"><p className="text-[8px] text-slate-400">প্রসেসিং সময়</p><p className="text-[10px] font-black mt-1 text-slate-900 dark:text-white">{detailsCategory.procTime}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3"><p className="text-[8px] text-slate-400">প্রসেসিং ফি</p><p className="text-[10px] font-black mt-1 text-slate-900 dark:text-white">{detailsCategory.procFeeLabel}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3"><p className="text-[8px] text-slate-400">সঞ্চয়/ডিপোজিট</p><p className="text-[10px] font-black mt-1 text-slate-900 dark:text-white">{detailsCategory.secDepositLabel}</p></div>
                </div>

                <section>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white">এই ক্যাটাগরিতে যেসব পেশায় আবেদন করা যাবে</h4>
                  <div className="mt-2 space-y-1.5">
                    {detailsProfessions.map(profession => (
                      <div key={profession.id} className="flex items-center gap-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 px-2.5 py-2 text-[9px] font-bold text-slate-700 dark:text-slate-200">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{profession.label}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white">প্রয়োজনীয় কাগজপত্র</h4>
                  <div className="mt-2 space-y-1.5">
                    {detailRequirements.map(doc => (
                      <div key={doc.key} className="flex items-start gap-2 text-[9px] text-slate-600 dark:text-slate-300">
                        <CheckCircle2 size={13} className={doc.required ? "text-emerald-600 mt-0.5 shrink-0" : "text-slate-400 mt-0.5 shrink-0"} />
                        <span>
                          {doc.labelBn}
                          {!doc.required && <span className="text-slate-400"> — ঐচ্ছিক/প্রযোজ্য হলে</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {detailInfoFields.length > 0 && (
                  <section>
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white">আবেদনে যে তথ্যগুলো দিতে হবে</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {detailInfoFields.map(field => (
                        <span key={field} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[8px] font-bold text-slate-600 dark:text-slate-300">
                          {field}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white">আবেদনের ধাপ</h4>
                  <ol className="mt-2 space-y-1.5">
                    {["লোনের পরিমাণ নির্বাচন", "ব্যক্তিগত ও পেশাগত তথ্য পূরণ", "প্রয়োজনীয় ডকুমেন্ট আপলোড", "আবেদন জমা ও যাচাই", "অনুমোদনের পর প্রযোজ্য ফি/ডিপোজিট", "চূড়ান্ত অনুমোদন ও বিতরণ"].map((stepLabel, index) => (
                      <li key={stepLabel} className="flex items-center gap-2 text-[9px] text-slate-600 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[8px] font-black shrink-0">{index + 1}</span>
                        <span>{stepLabel}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <button
                  type="button"
                  onClick={() => {
                    const target = detailsCategory;
                    setDetailsCategoryId(null);
                    selectCategory(target);
                  }}
                  className="w-full h-10 rounded-xl bg-[#075f50] text-white text-[10px] font-black flex items-center justify-center gap-1"
                >
                  {isBn ? "এই লোনের জন্য আবেদন করুন" : "Apply for this loan"} <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Step2Calculator = () => {
    if (!category) return null;

    const calc = getLoanCalculation();
    const rawAllowed = getAllowedTenure(amount);
    const minAllowed = Math.max(rawAllowed[0], category.minTenure ?? 12);
    const maxAllowed = Math.min(rawAllowed[1], category.maxTenure ?? 60);
    const amountOptions = amountPackages.filter(v => v >= 50000 && v <= category.maxAmount);
    const tenureOptions = snapPoints.filter(m => m >= minAllowed && m <= maxAllowed);

    const amountLabel = (value: number) => {
      const lakh = value / 100000;
      const text = Number.isInteger(lakh)
        ? String(lakh)
        : lakh.toFixed(1).replace(/\\.0$/, "");
      return convertDigits(text, isBn);
    };

    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);

    const repaymentRows = Array.from({ length: tenure }, (_, index) => {
      const principalPart = index === tenure - 1
        ? amount - Math.round((amount / tenure) * (tenure - 1))
        : Math.round((amount / tenure) * 100) / 100;
      const interestPart = Math.round(amount * (category.minRate || 0) * 100) / 100;
      const installment = Math.round((principalPart + interestPart) * 100) / 100;
      const dueDate = new Date(repaymentStartDate ? repaymentStartDate + "T12:00:00" : new Date().toISOString());
      dueDate.setMonth(dueDate.getMonth() + index + 1);
      const opening = Math.max(0, amount - Math.round((amount / tenure) * 100) / 100 * index);
      const closing = Math.max(0, opening - principalPart);
      return { no: index + 1, dueDate, opening, principal: principalPart, interest: interestPart, installment, closing };
    });

    return (
      <div className="loan-easy-font space-y-5 pb-28">
        <div className="px-1 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{isBn ? "লোনের পরিমাণ ও মেয়াদ" : "Loan amount & tenure"}</h2>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{isBn ? "আপনার প্রয়োজন অনুযায়ী পরিমাণ ও কিস্তির সময় নির্বাচন করুন" : "Choose the amount and repayment period that fits you"}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full neu-raised text-[10px] font-black text-primary-700 dark:text-primary-300 shrink-0">{category.title}</span>
          </div>
        </div>

        <section className="relative overflow-hidden neu-raised p-4 rounded-3xl">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-black text-gray-800 dark:text-gray-100">{isBn ? "লোনের পরিমাণ" : "Loan Amount"}</label>
              <span className="px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-700 dark:text-primary-300 text-[9px] font-black border border-primary-500/10">
                {isBn ? "সর্বোচ্চ" : "Max"} {category.limit}
              </span>
            </div>

            <div className="flex items-end justify-between mb-3 px-1">
              <div>
                <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{isBn ? "নির্বাচিত পরিমাণ" : "Selected amount"}</p>
                <p className="mt-1 text-[26px] leading-none font-black text-primary-600 dark:text-primary-300">{formatCurrency(amount, isBn)}</p>
              </div>
              <span className="px-3 py-1.5 rounded-full neu-raised text-[10px] font-black text-gray-700 dark:text-gray-200">BDT</span>
            </div>

            <input
              aria-label={isBn ? "ঋণের পরিমাণ" : "Loan amount"}
              type="range"
              min={50000}
              max={category.maxAmount}
              step={10000}
              value={Math.min(Math.max(amount, 50000), category.maxAmount)}
              onChange={e => handleAmountChange(Number(e.target.value))}
              className="w-full accent-primary-600"
            />

            <div className="flex items-center justify-between mt-4 mb-2">
              <p className="text-[10px] font-black text-gray-700 dark:text-gray-200">{isBn ? "দ্রুত পরিমাণ নির্বাচন" : "Quick amount"}</p>
              <p className="text-[9px] font-semibold text-gray-400">{amountLabel(50000)} — {amountLabel(category.maxAmount)}</p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {amountOptions.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleAmountChange(v)}
                  className={`py-2 rounded-xl font-black text-[11px] transition-all border ${
                    amount === v
                      ? "neu-btn-primary"
                      : "neu-btn text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {amountLabel(v)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="neu-raised p-4 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">{isBn ? "পরিশোধের মেয়াদ" : "Repayment Tenure"}</h3>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{isBn ? "মাসের সংখ্যা নির্বাচন করুন" : "Select repayment months"}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full neu-raised text-[10px] font-black text-primary-700 dark:text-primary-300">
              {convertDigits(tenure, isBn)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {tenureOptions.map(months => (
              <button
                key={months}
                type="button"
                onClick={() => setTenure(months)}
                className={`py-2.5 rounded-xl font-black text-[12px] transition-all ${
                  tenure === months
                    ? "neu-btn-primary"
                    : "neu-btn text-gray-700 dark:text-gray-200"
                }`}
              >
                {convertDigits(months, isBn)}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-[9px] text-gray-400">{isBn ? "অনুমোদিত সময়কাল" : "Allowed tenure"}</span>
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
              {convertDigits(minAllowed, isBn)} — {convertDigits(maxAllowed, isBn)} {isBn ? "মাস" : "months"}
            </span>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl p-5 text-white bg-gradient-to-br from-[#18253a] via-[#101827] to-[#090e17] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary-500/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 w-32 h-32 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <p className="text-[10px] font-bold text-gray-400">{isBn ? "আনুমানিক মাসিক কিস্তি" : "Estimated Monthly EMI"}</p>
                <p className="mt-1 text-[28px] leading-none font-black">{formatCurrency(calc.emi, isBn)} <span className="text-[10px] text-gray-400">/ {isBn ? "মাস" : "month"}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setShowRepaymentSchedule(true)}
                className="w-11 h-11 rounded-2xl neu-btn-primary flex items-center justify-center shrink-0"
                aria-label={isBn ? "কিস্তির পূর্ণ হিসাব দেখুন" : "View repayment schedule"}
              >
                <FileText size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-b border-white/10 text-center">
              <div>
                <p className="text-gray-500 text-[9px] font-bold">{isBn ? "ক্যাটাগরি" : "Category"}</p>
                <p className="mt-1 text-[10px] font-black text-gray-100 truncate">{category.title}</p>
              </div>
              <div className="border-x border-white/10">
                <p className="text-gray-500 text-[9px] font-bold">{isBn ? "পরিমাণ" : "Amount"}</p>
                <p className="mt-1 text-[10px] font-black text-primary-300">{formatCurrency(amount, isBn)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[9px] font-bold">{isBn ? "মেয়াদ" : "Tenure"}</p>
                <p className="mt-1 text-[10px] font-black text-gray-100">{convertDigits(tenure, isBn)} {isBn ? "মাস" : "mo"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4">
              {[
                [isBn ? "সুদের হার" : "Interest rate", `${(category.minRate * 100).toFixed(2)}% / ${isBn ? "মাস" : "mo"}`],
                [isBn ? "মোট সুদ" : "Total interest", formatCurrency(calc.totalInterest, isBn)],
                [isBn ? "মোট পরিশোধ" : "Total payable", formatCurrency(calc.totalPayable, isBn)],
                [isBn ? "প্রসেসিং ফি" : "Processing fee", formatCurrency(calc.processingFee, isBn)],
                [isBn ? "সিকিউরিটি ডিপোজিট" : "Security deposit", formatCurrency(calc.securityDeposit, isBn)],
                ...(calc.insuranceFee > 0 ? [[isBn ? "বীমা" : "Insurance", formatCurrency(calc.insuranceFee, isBn)]] : [])
              ].map(([label, value], index) => (
                <div key={String(label)} className="rounded-2xl bg-white/[0.06] border border-white/[0.07] px-3 py-2.5">
                  <p className="text-[8px] text-gray-500 font-bold">{label}</p>
                  <p className="mt-1 text-[11px] font-black text-gray-100">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="neu-raised rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-gray-800 dark:text-gray-100">{isBn ? "আবেদনের আগে হিসাব মিলিয়ে নিন" : "Review before continuing"}</p>
            <p className="mt-0.5 text-[9px] leading-4 text-gray-500 dark:text-gray-400">{isBn ? "পরিমাণ, মেয়াদ, কিস্তি ও প্রাথমিক ফি একসাথে দেখে নিন।" : "Review amount, tenure, EMI and upfront fees."}</p>
          </div>
          <span className="shrink-0 px-3 py-1.5 rounded-full neu-btn text-[9px] font-black text-gray-700 dark:text-gray-200">{formatCurrency(calc.totalUpfrontFees, isBn)}</span>
        </div>

        {showRepaymentSchedule && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full sm:max-w-lg max-h-[88vh] rounded-t-[28px] sm:rounded-[28px] bg-[#101827] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">{isBn ? "কিস্তির পূর্ণ হিসাব" : "Repayment schedule"}</h3>
                  <p className="mt-1 text-[9px] text-gray-400">{formatCurrency(amount, isBn)} • {convertDigits(tenure, isBn)} {isBn ? "মাস" : "months"}</p>
                </div>
                <button type="button" onClick={() => setShowRepaymentSchedule(false)} className="w-9 h-9 rounded-full neu-btn flex items-center justify-center text-gray-200"><X size={17} /></button>
              </div>
              <div className="px-4 py-3 bg-[#0c1422] border-b border-white/10">
                <label className="block text-[9px] font-black text-gray-400 mb-1.5">{isBn ? "লোন/কিস্তি শুরুর তারিখ" : "Loan / repayment start date"}</label>
                <input type="date" value={repaymentStartDate} onChange={e => setRepaymentStartDate(e.target.value)} className="w-full rounded-xl bg-[#101827] border border-white/10 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-primary-500" />
              </div>
              <div className="overflow-auto max-h-[62vh]">
                <div className="min-w-[590px]">
                  <div className="sticky top-0 z-10 grid grid-cols-[44px_88px_100px_100px_100px_100px] bg-[#172235] border-b border-white/10 text-[8px] font-black text-gray-400">
                    <div className="px-2 py-2">#</div><div className="px-2 py-2">{isBn ? "তারিখ" : "Date"}</div><div className="px-2 py-2 text-right">{isBn ? "মূল" : "Principal"}</div><div className="px-2 py-2 text-right">{isBn ? "সুদ" : "Interest"}</div><div className="px-2 py-2 text-right">{isBn ? "কিস্তি" : "Installment"}</div><div className="px-2 py-2 text-right">{isBn ? "বাকি" : "Balance"}</div>
                  </div>
                  {repaymentRows.map(row => (
                    <div key={row.no} className="grid grid-cols-[44px_88px_100px_100px_100px_100px] border-b border-white/5 text-[9px] text-gray-200">
                      <div className="px-2 py-2 font-black">{convertDigits(row.no, isBn)}</div>
                      <div className="px-2 py-2 whitespace-nowrap">{formatDate(row.dueDate)}</div>
                      <div className="px-2 py-2 text-right">{formatCurrency(row.principal, isBn)}</div>
                      <div className="px-2 py-2 text-right">{formatCurrency(row.interest, isBn)}</div>
                      <div className="px-2 py-2 text-right font-black text-primary-300">{formatCurrency(row.installment, isBn)}</div>
                      <div className="px-2 py-2 text-right">{formatCurrency(row.closing, isBn)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const Step3CombinedInfo = () => {
    const personalFields: (keyof LoanFormData)[] = ['fullName', 'fatherName', 'motherName', 'dob', 'gender', 'mobile', 'whatsapp', 'email', 'currentAddress', 'permanentAddress', 'nidNumber', 'eTin', 'bloodGroup', 'maritalStatus', 'spouseProfession', 'spouseIncome'];
    
    let profFields: (keyof LoanFormData)[] = [];
    if (category?.id === 'personal') profFields = [
      'companyName', 'corporateCode', 'designation', 'joiningDate', 'confirmationDate', 
      'hrName', 'hrDesignation', 'hrEmail', 'hrMobile',
      'basicSalary', 'houseRentAllowance', 'festivalBonus', 'providentFundDeduction', 
      'netTakeHomePay', 'existingLoanBank', 'existingLoanEmi', 'existingCreditCardOutstanding'
    ];
    else if (category?.id === 'business') profFields = ['businessName', 'shopAddress', 'tradeLicense', 'monthlyIncome'];
    else if (category?.id === 'women') profFields = [
      'businessName', 'brandName', 'shopAddress', 'tradeLicense', 'tradeLicenseIssueDate', 
      'vatBinNumber', 'rjscNumber', 'equityPercentage', 'applicantRole', 'productType', 
      'rawMaterialSource', 'salesChannel', 'govtScheme', 'monthlyIncome'
    ];
    else if (category?.id === 'expat') profFields = ['workingCountry', 'visaType', 'passportNumber', 'monthlyIncome'];
    else if (category?.id === 'student') profFields = ['institutionName', 'studentId', 'guardianIncome'];
    else if (category?.id === 'emergency') profFields = [
      'professionName', 'patientName', 'patientRelation', 'patientNid', 'patientCondition',
      'hospitalName', 'referringDoctor', 'doctorBmdc', 'hospitalDepartment', 'treatmentType',
      'estimatedCost', 'applicantContribution', 'insuranceCoverage', 'insuranceAmount', 'shortfallAmount', 'hrContactNumber'
    ];
    
    const bankFields: (keyof LoanFormData)[] = ['bankName', 'accountName', 'accountNumber', 'routingNumber', 'mobileBanking'];
    const nomineeFields: (keyof LoanFormData)[] = ['nomineeName', 'nomineeRelation', 'nomineeMobile', 'nomineeNid'];

    const handleInputFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    return (
      <div className="space-y-4 pb-6" onFocus={handleInputFocus}>
        {feedbackNote && (
          <div className="p-4 rounded-2xl border border-amber-500/40 dark:border-amber-900/40 bg-amber-500/5 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 text-xs font-semibold leading-relaxed flex gap-3 transition-colors mb-4">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-900 dark:text-amber-250 uppercase tracking-wider text-[9px] mb-1">{isBn ? 'সংশোধন অনুরোধ মন্তব্য:' : 'Revision Requested Comments:'}</p>
              <p>{feedbackNote}</p>
            </div>
          </div>
        )}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "আবেদনকারীর তথ্য বিবরণী" : "Applicant Information"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{isBn ? "নিচের সবগুলো সেকশন সঠিকভাবে পূরণ করুন" : "Please fill out all the sections below accurately."}</p>
        </div>

        {/* 1. Personal Information */}
        <AccordionSection
          sectionKey="personal"
          title={isBn ? "১. ব্যক্তিগত তথ্য" : "1. Personal Information"}
          icon={<User size={18} />}
          fields={personalFields}
          isExpanded={expanded.personal}
          onToggle={() => toggleSection('personal')}
          isBn={isBn}
          category={category}
          flagged={flaggedSections.personal}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পূর্ণ নাম (NID অনুযায়ী)" : "Full Name (as per NID)"}</label>
              <input type="text" {...register("fullName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.fullName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "যেমন: মোঃ রহিম উদ্দিন" : "e.g. Md. Rahim Uddin"} />
              <ErrorText field="fullName" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পিতার নাম" : "Father's Name"}</label>
                <input type="text" {...register("fatherName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.fatherName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "পিতার নাম" : "Father's Name"} />
                <ErrorText field="fatherName" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাতার নাম" : "Mother's Name"}</label>
                <input type="text" {...register("motherName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.motherName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "মাতার নাম" : "Mother's Name"} />
                <ErrorText field="motherName" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আপনার NID নম্বর" : "Your NID Number"}</label>
              <input type="text" {...register("nidNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.nidNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "এনআইডি নম্বর লিখুন" : "Enter NID Number"} />
              <ErrorText field="nidNumber" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "জন্ম তারিখ" : "Date of Birth"}</label>
                <input type="date" {...register("dob")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.dob ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                <ErrorText field="dob" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "লিঙ্গ" : "Gender"}</label>
                <select {...register("gender")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gender ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                  <option>{isBn ? "পুরুষ" : "Male"}</option>
                  <option>{isBn ? "নারী" : "Female"}</option>
                  <option>{isBn ? "অন্যান্য" : "Other"}</option>
                </select>
                <ErrorText field="gender" />
              </div>
            </div>
            {category?.id === 'personal' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ই-টিন (e-TIN)" : "e-TIN Number"}</label>
                    <input type="text" {...register("eTin")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.eTin ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e-TIN" />
                    <ErrorText field="eTin" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রক্তের গ্রুপ" : "Blood Group"}</label>
                    <select {...register("bloodGroup")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.bloodGroup ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                      <option value="">{isBn ? "নির্বাচন করুন" : "Select"}</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                    <ErrorText field="bloodGroup" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বৈবাহিক অবস্থা" : "Marital Status"}</label>
                    <select {...register("maritalStatus")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.maritalStatus ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                      <option value="">{isBn ? "নির্বাচন করুন" : "Select"}</option>
                      <option value="Single">{isBn ? "অবিবাহিত" : "Single"}</option>
                      <option value="Married">{isBn ? "বিবাহিত" : "Married"}</option>
                    </select>
                    <ErrorText field="maritalStatus" />
                  </div>
                  {methods.watch('maritalStatus') === 'Married' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "জীবনসঙ্গীর পেশা" : "Spouse's Profession"}</label>
                        <input type="text" {...register("spouseProfession")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.spouseProfession ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Profession" />
                        <ErrorText field="spouseProfession" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "জীবনসঙ্গীর মাসিক আয়" : "Spouse's Income"}</label>
                        <input type="number" {...register("spouseIncome")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.spouseIncome ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                        <ErrorText field="spouseIncome" />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল নাম্বার" : "Mobile Number"}</label>
                <input type="tel" {...register("mobile")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.mobile ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
                <ErrorText field="mobile" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "হোয়াটসঅ্যাপ (ঐচ্ছিক)" : "WhatsApp (Optional)"}</label>
                <input type="tel" {...register("whatsapp")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.whatsapp ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
                <ErrorText field="whatsapp" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ইমেইল (ঐচ্ছিক)" : "Email (Optional)"}</label>
              <input type="email" {...register("email")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.email ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="example@email.com" />
              <ErrorText field="email" />
            </div>
            <AddressSelector
              label={isBn ? "বর্তমান ঠিকানা" : "Current Address"}
              value={currentAddress}
              onChange={(val) => {
                setCurrentAddress(val);
                methods.setValue('currentAddress', val as any);
                // Clear errors for filled fields
                setAddressErrors(prev => ({
                  ...prev,
                  current: Object.fromEntries(
                    Object.entries(prev.current).filter(([k]) => !val[k as keyof AddressValue])
                  )
                }));
              }}
              isBn={isBn}
              errors={addressErrors.current}
              prefix="current"
              showDetailedFields={category?.id === 'personal'}
              showOwnershipFields={category?.id === 'personal'}
            />
            <AddressSelector
              label={isBn ? "স্থায়ী ঠিকানা (NID অনুযায়ী)" : "Permanent Address (as per NID)"}
              value={permanentAddress}
              onChange={(val) => {
                setPermanentAddress(val);
                methods.setValue('permanentAddress', val as any);
                setAddressErrors(prev => ({
                  ...prev,
                  permanent: Object.fromEntries(
                    Object.entries(prev.permanent).filter(([k]) => !val[k as keyof AddressValue])
                  )
                }));
              }}
              isBn={isBn}
              errors={addressErrors.permanent}
              prefix="permanent"
              showDetailedFields={category?.id === 'personal'}
            />
          </div>
        </AccordionSection>

        {/* 2. Professional Details */}
        <AccordionSection
          sectionKey="professional"
          title={isBn ? "২. পেশাগত তথ্য" : "2. Professional Info"}
          icon={<Briefcase size={18} />}
          fields={profFields}
          isExpanded={expanded.professional}
          onToggle={() => toggleSection('professional')}
          isBn={isBn}
          category={category}
          flagged={flaggedSections.professional}
        >
          <div className="space-y-3 text-xs">
            {category?.id === 'personal' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কর্মস্থলের নাম / কোম্পানির নাম" : "Company / Organization Name"}</label>
                  <input type="text" {...register("companyName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.companyName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "কোম্পানির নাম" : "Company Name"} />
                  <ErrorText field="companyName" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কর্পোরেট কোড (যদি থাকে)" : "Corporate Code (If Any)"}</label>
                    <input type="text" {...register("corporateCode")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.corporateCode ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Code" />
                    <ErrorText field="corporateCode" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পদবী" : "Designation"}</label>
                    <input type="text" {...register("designation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.designation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Designation" />
                    <ErrorText field="designation" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "যোগদানের তারিখ" : "Joining Date"}</label>
                    <input type="date" {...register("joiningDate")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.joiningDate ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                    <ErrorText field="joiningDate" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "চাকরি স্থায়ীকরণের তারিখ" : "Confirmation Date"}</label>
                    <input type="date" {...register("confirmationDate")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.confirmationDate ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                    <ErrorText field="confirmationDate" />
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{isBn ? "এইচআর/অ্যাডমিন এর তথ্য" : "HR/Admin Info"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নাম" : "Name"}</label>
                      <input type="text" {...register("hrName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hrName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "এইচআর এর নাম" : "HR Name"} />
                      <ErrorText field="hrName" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পদবী" : "Designation"}</label>
                      <input type="text" {...register("hrDesignation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hrDesignation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="HR Designation" />
                      <ErrorText field="hrDesignation" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ইমেইল" : "Email"}</label>
                      <input type="email" {...register("hrEmail")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hrEmail ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="hr@company.com" />
                      <ErrorText field="hrEmail" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল" : "Mobile"}</label>
                      <input type="tel" {...register("hrMobile")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hrMobile ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
                      <ErrorText field="hrMobile" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{isBn ? "আর্থিক ও স্যালারি ব্রেকডাউন" : "Financial & Salary Breakdown"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বেসিক স্যালারি" : "Basic Salary"}</label>
                      <input type="number" {...register("basicSalary")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.basicSalary ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="basicSalary" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বাড়ি ভাড়া ভাতা (HRA)" : "House Rent Allowance"}</label>
                      <input type="number" {...register("houseRentAllowance")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.houseRentAllowance ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="houseRentAllowance" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "উৎসব বোনাস" : "Festival Bonus"}</label>
                      <input type="number" {...register("festivalBonus")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.festivalBonus ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="festivalBonus" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "প্রভিডেন্ট ফান্ড কর্তন" : "Provident Fund Deduction"}</label>
                      <input type="number" {...register("providentFundDeduction")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.providentFundDeduction ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="providentFundDeduction" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নেট টেক হোম পে" : "Net Take Home Pay"}</label>
                    <input type="number" {...register("netTakeHomePay")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.netTakeHomePay ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                    <ErrorText field="netTakeHomePay" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{isBn ? "অন্যান্য ঋণ/কার্ডের তথ্য" : "Existing Loan/Card Info"}</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বর্তমান লোন ব্যাংক/আর্থিক প্রতিষ্ঠান" : "Existing Loan Bank"}</label>
                    <input type="text" {...register("existingLoanBank")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.existingLoanBank ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "যেমন: ব্র্যাক ব্যাংক" : "e.g. BRAC Bank"} />
                    <ErrorText field="existingLoanBank" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "লোনের মাসিক কিস্তি (EMI)" : "Loan EMI"}</label>
                      <input type="number" {...register("existingLoanEmi")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.existingLoanEmi ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="existingLoanEmi" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ক্রেডিট কার্ডের বকেয়া (যদি থাকে)" : "Credit Card Outstanding"}</label>
                      <input type="number" {...register("existingCreditCardOutstanding")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.existingCreditCardOutstanding ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="existingCreditCardOutstanding" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {category?.id === 'business' && (
              <>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "কোম্পানির লিগ্যাল প্রোফাইল" : "Company Legal Profile"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্যবসার নিবন্ধিত নাম" : "Registered Business Name"}</label>
                      <input type="text" {...register("businessName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.businessName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Business Name" />
                      <ErrorText field="businessName" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্র্যান্ডের নাম (যদি ভিন্ন হয়)" : "Brand Name (If different)"}</label>
                      <input type="text" {...register("brandName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.brandName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Brand Name" />
                      <ErrorText field="brandName" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ট্রেড লাইসেন্স নম্বর" : "Trade License No"}</label>
                      <input type="text" {...register("tradeLicense")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.tradeLicense ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Tr xxx-xxx" />
                      <ErrorText field="tradeLicense" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ইস্যুর তারিখ" : "Issue Date"}</label>
                      <input type="date" {...register("tradeLicenseIssueDate")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.tradeLicenseIssueDate ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                      <ErrorText field="tradeLicenseIssueDate" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ভ্যাট/বিআইএন (BIN) নম্বর" : "VAT/BIN Number"}</label>
                      <input type="text" {...register("vatBinNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.vatBinNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="BIN Number" />
                      <ErrorText field="vatBinNumber" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আরজেএসসি (RJSC) নম্বর" : "RJSC Reg Number"}</label>
                      <input type="text" {...register("rjscNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.rjscNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Limited Company Only" />
                      <ErrorText field="rjscNumber" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "অপারেশনাল ডিটেইলস" : "Operational Details"}</h4>
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মূল কার্যালয়ের ঠিকানা" : "Main Office Address"}</label>
                      <textarea rows={2} {...register("shopAddress")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.shopAddress ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder="Head Office Address" />
                      <ErrorText field="shopAddress" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ফ্যাক্টরি/ওয়ারহাউজের ঠিকানা" : "Factory/Warehouse Address"}</label>
                      <textarea rows={2} {...register("factoryAddress")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.factoryAddress ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder="Factory/Warehouse Address" />
                      <ErrorText field="factoryAddress" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "শোরুমের সংখ্যা" : "No. of Showrooms"}</label>
                      <input type="number" {...register("showroomCount")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.showroomCount ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. 3" />
                      <ErrorText field="showroomCount" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোট কর্মচারী" : "Total Employees"}</label>
                      <input type="number" {...register("totalEmployees")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.totalEmployees ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Permanent/Temporary" />
                      <ErrorText field="totalEmployees" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্যবসাটি কত বছর ধরে লাভজনক?" : "Years in Profitability"}</label>
                    <input type="text" {...register("yearsInProfit")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.yearsInProfit ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. 5 Years" />
                    <ErrorText field="yearsInProfit" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "আর্থিক ইন-ডেপথ" : "Financial In-Depth"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক গড় বিক্রয়" : "Avg Monthly Sales"}</label>
                      <input type="number" {...register("avgMonthlySales")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.avgMonthlySales ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="avgMonthlySales" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ঋতুভিত্তিক বিক্রয়ের তারতম্য" : "Seasonal Sales Var."}</label>
                      <input type="text" {...register("seasonalSales")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.seasonalSales ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. High in Winter" />
                      <ErrorText field="seasonalSales" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কস্ট অফ গুডস সোল্ড (COGS)" : "COGS"}</label>
                      <input type="number" {...register("cogs")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.cogs ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="cogs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নেট প্রফিট মার্জিন (%)" : "Net Profit Margin (%)"}</label>
                      <input type="number" {...register("netProfitMargin")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.netProfitMargin ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="%" />
                      <ErrorText field="netProfitMargin" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "দেনাদার (Accounts Receivable)" : "Accounts Receivable"}</label>
                      <input type="number" {...register("accountsReceivable")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.accountsReceivable ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="accountsReceivable" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পাওনাদার (Accounts Payable)" : "Accounts Payable"}</label>
                      <input type="number" {...register("accountsPayable")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.accountsPayable ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="accountsPayable" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বর্তমান স্টকের বাজারমূল্য" : "Current Stock Value"}</label>
                      <input type="number" {...register("currentStockValue")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.currentStockValue ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="currentStockValue" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "অন্যান্য আয় (যদি থাকে)" : "Other Income / Monthly"}</label>
                      <input type="number" {...register("monthlyIncome")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.monthlyIncome ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="monthlyIncome" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "লোনের উদ্দেশ্য ও ব্যাংকিং হিস্ট্রি" : "Loan Purpose & Banking"}</h4>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "লোন ইউটিলাইজেশন প্ল্যান" : "Loan Utilization Plan"}</label>
                    <textarea rows={2} {...register("loanPurposeDetails")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.loanPurposeDetails ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder={isBn ? "Working Capital, CapEx, নাকি Expansion?" : "Working Capital, CapEx, or Expansion?"} />
                    <ErrorText field="loanPurposeDetails" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "প্রধান কারেন্ট অ্যাকাউন্ট" : "Main Current Account"}</label>
                      <input type="text" {...register("mainCurrentAccount")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.mainCurrentAccount ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Account Number & Bank" />
                      <ErrorText field="mainCurrentAccount" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "সিসি/ওডি (CC/OD) লিমিট" : "CC/OD Limit Account"}</label>
                      <input type="text" {...register("ccOdLimit")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.ccOdLimit ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="If any" />
                      <ErrorText field="ccOdLimit" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "অন্যান্য সক্রিয় লোন/লিজ" : "Other Active Loans/Leases"}</label>
                    <input type="text" {...register("otherActiveLoans")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.otherActiveLoans ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Details of active loans" />
                    <ErrorText field="otherActiveLoans" />
                  </div>
                </div>
              </>
            )}

            {category?.id === 'women' && (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "উদ্যোক্তার প্রোফাইল ও শেয়ারহোল্ডিং" : "Entrepreneur Profile & Shareholding"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্যবসার নাম" : "Business Name"}</label>
                      <input type="text" {...register("businessName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.businessName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="আপনার স্টোর বা কোম্পানির নাম" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্র্যান্ডের নাম (যদি ভিন্ন হয়)" : "Brand Name"}</label>
                      <input type="text" {...register("brandName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.brandName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. MyBrand" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আপনার শেয়ার বা ইক্যুইটি (%)" : "Your Share/Equity (%)"}</label>
                      <input type="text" {...register("equityPercentage")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.equityPercentage ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. 51%" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আপনার পদবী" : "Applicant Role"}</label>
                      <select {...register("applicantRole")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.applicantRole ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                        <option value="">{isBn ? "নির্বাচন করুন" : "Select"}</option>
                        <option value="Proprietor">{isBn ? "প্রোপরাইটর" : "Proprietor"}</option>
                        <option value="Managing Director">{isBn ? "ম্যানেজিং ডিরেক্টর" : "Managing Director"}</option>
                        <option value="Partner">{isBn ? "পার্টনার" : "Partner"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "ব্যবসায়িক মডেল ও উদ্ভাবন" : "Business Model & Innovation"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পণ্য বা সেবার ধরন" : "Product/Service Type"}</label>
                      <input type="text" {...register("productType")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.productType ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. Boutique, E-commerce" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কাঁচামালের উৎস" : "Raw Material Source"}</label>
                      <input type="text" {...register("rawMaterialSource")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.rawMaterialSource ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Local/Imported" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বিক্রির মূল চ্যানেল" : "Main Sales Channel"}</label>
                    <select {...register("salesChannel")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.salesChannel ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                      <option value="">{isBn ? "নির্বাচন করুন" : "Select"}</option>
                      <option value="Facebook Page">{isBn ? "ফেসবুক পেজ" : "Facebook Page"}</option>
                      <option value="Website">{isBn ? "ওয়েবসাইট" : "Website"}</option>
                      <option value="Physical Showroom">{isBn ? "ফিজিক্যাল শোরুম" : "Physical Showroom"}</option>
                      <option value="Both">{isBn ? "উভয়" : "Both"}</option>
                    </select>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "দোকান / অফিসের ঠিকানা" : "Shop / Office Address"}</label>
                    <textarea rows={1.5} {...register("shopAddress")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.shopAddress ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder={isBn ? "ঠিকানা লিখুন" : "Enter Address"} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "লাইসেন্স ও সরকারি স্কিম" : "Licenses & Govt. Schemes"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ট্রেড লাইসেন্স নম্বর" : "Trade License No"}</label>
                      <input type="text" {...register("tradeLicense")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.tradeLicense ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Tr xxx-xxx" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "লাইসেন্স ইস্যুর তারিখ" : "License Issue Date"}</label>
                      <input type="date" {...register("tradeLicenseIssueDate")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.tradeLicenseIssueDate ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ভ্যাট/বিআইএন (BIN)" : "VAT/BIN No"}</label>
                      <input type="text" {...register("vatBinNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.vatBinNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="If any" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আরজেএসসি (RJSC) রেজিঃ" : "RJSC Reg (Ltd Co)"}</label>
                      <input type="text" {...register("rjscNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.rjscNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="If any" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "সরকারি স্কিম/ফান্ডিং (বাংলাদেশ ব্যাংক/SME)" : "Govt. Scheme / SME Funding"}</label>
                    <select {...register("govtScheme")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.govtScheme ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                      <option value="">{isBn ? "সাধারণ লোন" : "General Loan"}</option>
                      <option value="BB Refinancing">{isBn ? "বাংলাদেশ ব্যাংক রিফাইন্যান্সিং" : "BB Refinancing Scheme"}</option>
                      <option value="SME Foundation">{isBn ? "এসএমই ফাউন্ডেশন" : "SME Foundation"}</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয়/বিক্রি" : "Monthly Income/Sales"}</label>
                    <input type="number" {...register("monthlyIncome")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.monthlyIncome ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                  </div>
                </div>
              </>
            )}

            {category?.id === 'expat' && (
              <>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "আবেদনকারীর আন্তর্জাতিক প্রোফাইল" : "Applicant's International Profile"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কর্মরত দেশের নাম" : "Working Country"}</label>
                      <input type="text" {...register("workingCountry")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.workingCountry ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Dubai / KSA" />
                      <ErrorText field="workingCountry" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ভিসার ধরন" : "Visa Type"}</label>
                      <input type="text" {...register("visaType")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.visaType ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Work Visa" />
                      <ErrorText field="visaType" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পাসপোর্ট নম্বর" : "Passport Number"}</label>
                      <input type="text" {...register("passportNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.passportNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="AXXXXXXXX" />
                      <ErrorText field="passportNumber" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পাসপোর্ট ইস্যুর তারিখ" : "Passport Issue Date"}</label>
                      <input type="date" {...register("passportIssueDate")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.passportIssueDate ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                      <ErrorText field="passportIssueDate" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পাসপোর্টের মেয়াদ" : "Passport Expiry Date"}</label>
                      <input type="date" {...register("passportExpiryDate")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.passportExpiryDate ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} />
                      <ErrorText field="passportExpiryDate" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রেসিডেন্স কার্ড/আকামা (Iqama)" : "Residence Card/Iqama No"}</label>
                      <input type="text" {...register("iqamaNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.iqamaNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Iqama Number" />
                      <ErrorText field="iqamaNumber" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বিদেশে বর্তমান থাকার ঠিকানা" : "Current Foreign Address"}</label>
                    <textarea rows={2} {...register("foreignAddress")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.foreignAddress ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder="Foreign Address" />
                    <ErrorText field="foreignAddress" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বিদেশী মোবাইল নম্বর" : "Foreign Mobile No"}</label>
                      <input type="tel" {...register("foreignMobile")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.foreignMobile ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="+XX..." />
                      <ErrorText field="foreignMobile" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বিদেশী হোয়াটসঅ্যাপ নম্বর" : "Foreign WhatsApp No"}</label>
                      <input type="tel" {...register("foreignWhatsapp")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.foreignWhatsapp ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="+XX..." />
                      <ErrorText field="foreignWhatsapp" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "বৈদেশিক কর্মসংস্থানের ইন-ডেপথ" : "Foreign Employment Details"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বিদেশী কোম্পানির নাম" : "Foreign Company Name"}</label>
                      <input type="text" {...register("foreignCompanyName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.foreignCompanyName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Company Name" />
                      <ErrorText field="foreignCompanyName" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কোম্পানির ল্যান্ডলাইন/ওয়েবসাইট" : "Company Website/Phone"}</label>
                      <input type="text" {...register("foreignCompanyContact")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.foreignCompanyContact ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Contact info" />
                      <ErrorText field="foreignCompanyContact" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "শ্রমিকের ক্যাটাগরি" : "Worker Category"}</label>
                      <select {...register("workerCategory")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.workerCategory ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all cursor-pointer`}>
                        <option value="">{isBn ? "নির্বাচন করুন" : "Select"}</option>
                        <option value="Skilled">{isBn ? "স্কিলড" : "Skilled"}</option>
                        <option value="Unskilled">{isBn ? "আনস্কিলড" : "Unskilled"}</option>
                        <option value="Professional">{isBn ? "প্রফেশনাল" : "Professional"}</option>
                      </select>
                      <ErrorText field="workerCategory" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয় (বিডিটি)" : "Monthly Income (BDT)"}</label>
                      <input type="number" {...register("monthlyIncome")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.monthlyIncome ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="monthlyIncome" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "সুপারভাইজারের নাম ও কন্টাক্ট" : "Supervisor's Name & Contact"}</label>
                    <input type="text" {...register("supervisorNameContact")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.supervisorNameContact ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Name, Phone" />
                    <ErrorText field="supervisorNameContact" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "রেমিট্যান্স ও ব্যাংকিং চ্যানেল" : "Remittance & Banking Channel"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "গড়ে কত টাকা পাঠান" : "Avg Monthly Remittance"}</label>
                      <input type="number" {...register("avgMonthlyRemittance")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.avgMonthlyRemittance ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="avgMonthlyRemittance" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "টাকা পাঠানোর মাধ্যম" : "Remittance Channel"}</label>
                      <input type="text" {...register("remittanceChannel")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.remittanceChannel ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. bKash, Western Union" />
                      <ErrorText field="remittanceChannel" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "দেশে টাকা গ্রহণকারীর ব্যাংক অ্যাকাউন্ট" : "Receiver's Bank Account (BD)"}</label>
                    <input type="text" {...register("receiverBankAccount")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.receiverBankAccount ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Bank, Account Number" />
                    <ErrorText field="receiverBankAccount" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "স্থানীয় অ্যাটর্নি/কো-অ্যার্প্লিকেন্ট (Local Co-Applicant)" : "Local Attorney / Co-Applicant"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কো-অ্যার্প্লিকেন্টের নাম" : "Co-Applicant Name"}</label>
                      <input type="text" {...register("coApplicantName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Full Name" />
                      <ErrorText field="coApplicantName" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "প্রবাসীর সাথে সম্পর্ক" : "Relation with Expat"}</label>
                      <input type="text" {...register("coApplicantRelation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantRelation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Relation" />
                      <ErrorText field="coApplicantRelation" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পেশা" : "Profession"}</label>
                      <input type="text" {...register("coApplicantProfession")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantProfession ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Profession" />
                      <ErrorText field="coApplicantProfession" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                      <input type="number" {...register("coApplicantIncome")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantIncome ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                      <ErrorText field="coApplicantIncome" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "এনআইডি (NID) নম্বর" : "NID Number"}</label>
                    <input type="text" {...register("coApplicantNid")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantNid ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="NID Number" />
                    <ErrorText field="coApplicantNid" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বর্তমান ঠিকানা" : "Current Address"}</label>
                      <textarea rows={2} {...register("coApplicantCurrentAddress")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantCurrentAddress ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder="Current Address" />
                      <ErrorText field="coApplicantCurrentAddress" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "স্থায়ী ঠিকানা" : "Permanent Address"}</label>
                      <textarea rows={2} {...register("coApplicantPermanentAddress")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.coApplicantPermanentAddress ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder="Permanent Address" />
                      <ErrorText field="coApplicantPermanentAddress" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {category?.id === 'student' && (
              <>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "শিক্ষার্থীর একাডেমিক হিস্ট্রি" : "Student's Academic History"}</h4>
                  
                  {/* SSC */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-primary-600 mb-2">SSC / O-Level</h5>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <input type="text" {...register("sscRoll")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sscRoll ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "রোল নম্বর" : "Roll Number"} />
                      </div>
                      <div>
                        <input type="text" {...register("sscReg")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sscReg ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "রেজিস্ট্রেশন নম্বর" : "Registration No"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <input type="text" {...register("sscBoard")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sscBoard ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "বোর্ড" : "Board"} />
                      </div>
                      <div>
                        <input type="text" {...register("sscGpa")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sscGpa ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="GPA" />
                      </div>
                      <div>
                        <input type="text" {...register("sscYear")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sscYear ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "পাসের সন" : "Passing Year"} />
                      </div>
                    </div>
                    <div>
                      <input type="text" {...register("sscInstitution")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sscInstitution ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "প্রতিষ্ঠানের নাম" : "Institution Name"} />
                    </div>
                  </div>

                  {/* HSC */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-primary-600 mb-2">HSC / A-Level / Diploma</h5>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <input type="text" {...register("hscRoll")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hscRoll ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "রোল নম্বর" : "Roll Number"} />
                      </div>
                      <div>
                        <input type="text" {...register("hscReg")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hscReg ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "রেজিস্ট্রেশন নম্বর" : "Registration No"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <input type="text" {...register("hscBoard")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hscBoard ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "বোর্ড" : "Board"} />
                      </div>
                      <div>
                        <input type="text" {...register("hscGpa")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hscGpa ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="GPA" />
                      </div>
                      <div>
                        <input type="text" {...register("hscYear")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hscYear ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "পাসের সন" : "Passing Year"} />
                      </div>
                    </div>
                    <div>
                      <input type="text" {...register("hscInstitution")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hscInstitution ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "প্রতিষ্ঠানের নাম" : "Institution Name"} />
                    </div>
                  </div>

                  {/* Graduation */}
                  <div>
                    <h5 className="text-xs font-bold text-primary-600 mb-2">Graduation / Bachelor (If applicable)</h5>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <input type="text" {...register("gradRoll")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gradRoll ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "রোল নম্বর" : "Roll Number"} />
                      </div>
                      <div>
                        <input type="text" {...register("gradReg")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gradReg ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "রেজিস্ট্রেশন নম্বর" : "Registration No"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <input type="text" {...register("gradBoard")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gradBoard ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "ইউনিভার্সিটি" : "University"} />
                      </div>
                      <div>
                        <input type="text" {...register("gradCgpa")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gradCgpa ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="CGPA" />
                      </div>
                      <div>
                        <input type="text" {...register("gradYear")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gradYear ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "পাসের সন" : "Passing Year"} />
                      </div>
                    </div>
                    <div>
                      <input type="text" {...register("gradInstitution")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.gradInstitution ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "প্রতিষ্ঠানের নাম" : "Institution Name"} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "ভর্তিচ্ছু কোর্স ও গন্তব্য" : "Target Course & Destination"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বিশ্ববিদ্যালয়ের নাম" : "Target University Name"}</label>
                      <input type="text" {...register("targetUniversity")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.targetUniversity ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="University Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ফ্যাকাল্টি/ডিপার্টমেন্ট" : "Faculty/Department"}</label>
                      <input type="text" {...register("targetDepartment")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.targetDepartment ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Department" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কোর্সের গ্লোবাল র্যাংকিং" : "Course Global Ranking"}</label>
                      <input type="text" {...register("courseRanking")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.courseRanking ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. Top 500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ক্রেডিট আওয়ার" : "Credit Hours"}</label>
                      <input type="text" {...register("creditHours")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.creditHours ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Total Credits" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{isBn ? "সেমিস্টার ভিত্তিক খরচ (Breakdown)" : "Semester-wise Cost Breakdown"}</h5>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input type="number" {...register("tuitionFee")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none`} placeholder={isBn ? "টিউশন ফি" : "Tuition Fee"} />
                      <input type="number" {...register("accommodationCost")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none`} placeholder={isBn ? "আবাসন খরচ" : "Accommodation Cost"} />
                      <input type="number" {...register("healthInsurance")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none`} placeholder={isBn ? "হেলথ ইন্সুরেন্স" : "Health Insurance"} />
                      <input type="number" {...register("otherFees")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none`} placeholder={isBn ? "বই ও অন্যান্য ফি" : "Books & Other Fees"} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "কো-অ্যার্প্লিকেন্ট/স্পনসরের আর্থিক প্রোফাইল" : "Sponsor's Financial Profile"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "স্পনসরের নাম" : "Sponsor Name"}</label>
                      <input type="text" {...register("sponsorName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sponsorName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "শিক্ষার্থীর সাথে সম্পর্ক" : "Relation to Student"}</label>
                      <input type="text" {...register("sponsorRelation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sponsorRelation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. Father/Mother" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আয়ের উৎস" : "Income Source"}</label>
                      <input type="text" {...register("sponsorIncomeSource")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sponsorIncomeSource ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Job/Business" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "চাকরি বা ব্যবসার বিস্তারিত" : "Job/Business Details"}</label>
                      <input type="text" {...register("sponsorJobDetails")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sponsorJobDetails ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Company / Position" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "করযোগ্য আয় (Taxable Income)" : "Taxable Income"}</label>
                      <input type="number" {...register("sponsorTaxableIncome")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sponsorTaxableIncome ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নেট ওর্থ (Net Worth)" : "Net Worth"}</label>
                      <input type="text" {...register("sponsorNetWorth")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.sponsorNetWorth ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Property Details" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {category?.id === 'emergency' && (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "আবেদনকারী ও রোগীর সম্পর্ক" : "Applicant & Patient Relation"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পেশা" : "Profession"}</label>
                      <input type="text" {...register("professionName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.professionName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "পেশা" : "Profession"} />
                      <ErrorText field="professionName" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রোগীর নাম" : "Patient Name"}</label>
                      <input type="text" {...register("patientName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.patientName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Full Name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রোগী আবেদনকারীর কে হন" : "Relation with Patient"}</label>
                      <input type="text" {...register("patientRelation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.patientRelation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. Father/Mother" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রোগীর এনআইডি/জন্ম নিবন্ধন" : "Patient NID/Birth Reg."}</label>
                      <input type="text" {...register("patientNid")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.patientNid ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Number" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রোগীর বর্তমান শারীরিক অবস্থা" : "Patient's Current Condition"}</label>
                    <textarea rows={2} {...register("patientCondition")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.patientCondition ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all resize-none`} placeholder="Current Status" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "ক্লিনিকাল ডিটেইলস" : "Clinical Details"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "হাসপাতালের নাম" : "Hospital Name"}</label>
                      <input type="text" {...register("hospitalName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hospitalName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Hospital Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ডিপার্টমেন্ট" : "Department"}</label>
                      <input type="text" {...register("hospitalDepartment")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hospitalDepartment ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. Cardiology" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রেফারিং ডাক্তারের নাম" : "Referring Doctor"}</label>
                      <input type="text" {...register("referringDoctor")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.referringDoctor ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Doctor Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ডাক্তারের বিএমডিসি (BMDC) রেজিঃ" : "Doctor BMDC Reg."}</label>
                      <input type="text" {...register("doctorBmdc")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.doctorBmdc ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Reg. Number" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "চিকিৎসার ধরন" : "Treatment Type"}</label>
                    <input type="text" {...register("treatmentType")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.treatmentType ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="e.g. Surgery, ICU" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "আর্থিক জরুরি অবস্থা" : "Financial Emergency"}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোট এস্টিমেটেড খরচ" : "Total Estimated Cost"}</label>
                      <input type="number" {...register("estimatedCost")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.estimatedCost ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নিজে কত টাকা বহন করছেন" : "Applicant's Contribution"}</label>
                      <input type="number" {...register("applicantContribution")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.applicantContribution ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ইন্সুরেন্স কভারেজ আছে কি?" : "Insurance Coverage?"}</label>
                      <select {...register("insuranceCoverage")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.insuranceCoverage ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`}>
                        <option value="">{isBn ? "নির্বাচন করুন" : "Select"}</option>
                        <option value="yes">{isBn ? "হ্যাঁ" : "Yes"}</option>
                        <option value="no">{isBn ? "না" : "No"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ইন্সুরেন্স কত দিচ্ছে" : "Insurance Amount"}</label>
                      <input type="number" {...register("insuranceAmount")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.insuranceAmount ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ঘাটতি বা লোনের পরিমাণ" : "Shortfall/Loan Amount"}</label>
                    <input type="number" {...register("shortfallAmount")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.shortfallAmount ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="৳" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "এইচআর/কলিগের জরুরি কন্টাক্ট নম্বর" : "HR/Colleague Emergency Contact"}</label>
                    <input type="text" {...register("hrContactNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.hrContactNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXX-XXXXXX" />
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionSection>

        {/* 3. Bank Account Details */}
        <AccordionSection
          sectionKey="bank"
          title={isBn ? "৩. ব্যাংক একাউন্ট তথ্য" : "3. Bank Account Details"}
          icon={<Landmark size={18} />}
          fields={bankFields}
          isExpanded={expanded.bank}
          onToggle={() => toggleSection('bank')}
          isBn={isBn}
          category={category}
          flagged={flaggedSections.bank}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্যাংকের নাম" : "Bank Name"}</label>
              <input type="text" {...register("bankName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.bankName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="DBBL / BRAC Bank / Islami Bank" />
              <ErrorText field="bankName" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "একাউন্টের নাম" : "Account Name"}</label>
              <input type="text" {...register("accountName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.accountName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Account Holder Name" />
              <ErrorText field="accountName" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "একাউন্ট নম্বর" : "Account Number"}</label>
                <input type="text" {...register("accountNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.accountNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Account Number" />
                <ErrorText field="accountNumber" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রাউটিং নাম্বার (ঐচ্ছিক)" : "Routing Number (Optional)"}</label>
                <input type="text" {...register("routingNumber")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.routingNumber ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Routing Number" />
                <ErrorText field="routingNumber" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল ব্যাংকিং নম্বর (বিকাশ/নগদ) (ঐচ্ছিক)" : "Mobile Banking Number (bKash/Nagad) (Optional)"}</label>
              <input type="tel" {...register("mobileBanking")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.mobileBanking ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
              <ErrorText field="mobileBanking" />
            </div>
          </div>
        </AccordionSection>

        {/* 4. Nominee Information */}
        <AccordionSection
          sectionKey="nominee"
          title={isBn ? "৪. নমিনি তথ্য" : "4. Nominee Details"}
          icon={<Users size={18} />}
          fields={nomineeFields}
          isExpanded={expanded.nominee}
          onToggle={() => toggleSection('nominee')}
          isBn={isBn}
          category={category}
          flagged={flaggedSections.nominee}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নমিনির নাম" : "Nominee Name"}</label>
              <input type="text" {...register("nomineeName")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.nomineeName ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Nominee Name" />
              <ErrorText field="nomineeName" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "সম্পর্ক" : "Relationship"}</label>
                <input type="text" {...register("nomineeRelation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.nomineeRelation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder={isBn ? "যেমন: ভাই / স্ত্রী" : "e.g. Brother / Wife"} />
                <ErrorText field="nomineeRelation" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল নাম্বার" : "Mobile Number"}</label>
                <input type="text" {...register("nomineeMobile")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.nomineeMobile ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
                <ErrorText field="nomineeMobile" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "NID নম্বর" : "NID Number"}</label>
              <input type="text" {...register("nomineeNid")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.nomineeNid ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="নমিনির এনআইডি নম্বর" />
              <ErrorText field="nomineeNid" />
            </div>
          </div>
        </AccordionSection>

        {/* 5. Guarantor Information (Personal Loan Only) */}
        {category?.id === 'personal' && (
          <AccordionSection
            sectionKey="guarantor"
            title={isBn ? "৫. গ্যারান্টরের তথ্য" : "5. Guarantor Details"}
            icon={<Users size={18} />}
            fields={['g1Name', 'g1Relation', 'g1Nid', 'g1Mobile', 'g1Address', 'g1Profession', 'g2Name', 'g2Designation', 'g2OfficialId', 'g2Email', 'g2Mobile']}
            isExpanded={expanded.guarantor}
            onToggle={() => toggleSection('guarantor')}
            isBn={isBn}
            category={category}
            flagged={flaggedSections.guarantor}
          >
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "গ্যারান্টর ১ (পরিবারের সদস্য/আত্মীয়)" : "Guarantor 1 (Family/Relative)"}</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নাম" : "Name"}</label>
                      <input type="text" {...register("g1Name")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g1Name ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Name" />
                      <ErrorText field="g1Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "সম্পর্ক" : "Relation"}</label>
                      <input type="text" {...register("g1Relation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g1Relation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Relation" />
                      <ErrorText field="g1Relation" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "এনআইডি" : "NID"}</label>
                      <input type="text" {...register("g1Nid")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g1Nid ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="NID No" />
                      <ErrorText field="g1Nid" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল" : "Mobile"}</label>
                      <input type="tel" {...register("g1Mobile")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g1Mobile ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
                      <ErrorText field="g1Mobile" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ঠিকানা" : "Address"}</label>
                    <input type="text" {...register("g1Address")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g1Address ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Address" />
                    <ErrorText field="g1Address" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পেশা" : "Profession"}</label>
                    <input type="text" {...register("g1Profession")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g1Profession ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Profession" />
                    <ErrorText field="g1Profession" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">{isBn ? "গ্যারান্টর ২ (সহকর্মী/অফিসিয়াল)" : "Guarantor 2 (Colleague/Official)"}</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নাম" : "Name"}</label>
                      <input type="text" {...register("g2Name")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g2Name ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Name" />
                      <ErrorText field="g2Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পদবী" : "Designation"}</label>
                      <input type="text" {...register("g2Designation")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g2Designation ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Designation" />
                      <ErrorText field="g2Designation" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "অফিসিয়াল আইডি" : "Official ID"}</label>
                    <input type="text" {...register("g2OfficialId")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g2OfficialId ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="ID No" />
                    <ErrorText field="g2OfficialId" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "অফিসিয়াল ইমেইল" : "Official Email"}</label>
                      <input type="email" {...register("g2Email")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g2Email ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="Email" />
                      <ErrorText field="g2Email" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল" : "Mobile"}</label>
                      <input type="tel" {...register("g2Mobile")} className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${errors.g2Mobile ? "border-red-500/80 focus:border-red-500/80 ring-2 ring-red-500/10" : "border-transparent focus:border-primary-500/50"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium outline-none transition-all`} placeholder="01XXXXXXXXX" />
                      <ErrorText field="g2Mobile" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>
        )}
      </div>
    );
  };

  const renderFileUploader = (id: string, title: string) => {
    const isUploading = uploadingDoc === id;
    const requirement = getLoanDocumentRequirements(category?.id || 'personal').find(d => d.key === id);
    const displayTitle = requirement?.required
      ? `${title} ${isBn ? '• আবশ্যক' : '• Required'}`
      : title;
    return (
      <div className="relative">
        <input 
          type="file" 
          id={`file-${id}`}
          className="hidden" 
          accept="image/*,.pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingDoc(id);
            try {
              const url = await uploadDocument(file, user.id, id);
              if (url) {
                setDocuments(prev => ({ ...prev, [id]: url }));
              } else {
                toast.error(isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে' : 'File upload failed');
              }
            } catch (error) {
              console.error('Document upload failed:', error);
              toast.error(isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে' : 'File upload failed');
            } finally {
              setUploadingDoc(null);
              e.target.value = '';
            }
          }}
        />
        <label 
          htmlFor={isUploading ? undefined : `file-${id}`}
          className={`w-full transition-all border-2 ${
            documents[id] 
              ? 'border-solid border-green-500 bg-green-50/10 dark:bg-green-950/5' 
              : 'border-dashed border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800 bg-gray-100/10 dark:bg-gray-950/10'
          } rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer text-center block bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
           <div className={`w-10 h-10 ${documents[id] ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 border-slate-200 dark:border-slate-800' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'} transition-colors rounded-full flex items-center justify-center shadow-sm mx-auto`}>
             {isUploading ? (
               <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             ) : documents[id] ? (
               <CheckCircle2 size={18} className="text-white" />
             ) : (
               <UploadCloud size={18} className="text-gray-500 dark:text-gray-400" />
             )}
           </div>
           <span className="text-xs font-bold text-gray-600 dark:text-gray-300 text-center leading-tight block">{displayTitle}</span>
           {documents[id] && (
             <span className="text-[10px] text-green-600 font-bold block">
               {isBn ? 'আপলোড হয়েছে' : 'Uploaded'}
             </span>
           )}
        </label>
      </div>
    );
  };

  const Step4Documents = () => (
    <div className="space-y-5 pb-6 text-xs">
      {flaggedSections.documents && (
        <div className="text-amber-800 dark:text-amber-300 p-4 rounded-2xl border border-amber-500/30 dark:border-amber-900/40 bg-amber-500/5 dark:bg-amber-950/10 text-xs font-semibold leading-relaxed flex gap-3 transition-colors mb-4 animate-pulse">
          <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-900 dark:text-amber-250 uppercase tracking-wider text-[9px] mb-1">{isBn ? 'সংশোধন প্রয়োজন:' : 'Revision Required:'}</p>
            <p>{isBn ? 'অনুগ্রহ করে নির্দেশিত প্রয়োজনীয় কাগজপত্র সংশোধন করে পুনরায় আপলোড করুন।' : 'Please review and re-upload the flagged documents.'}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "প্রয়োজনীয় কাগজপত্র" : "Required Documents"}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{isBn ? "আবেদন রিভিউ ও অনুমোদনের জন্য প্রয়োজনীয় ডকুমেন্টস আপলোড করুন" : "Upload documents for profile verification and approval."}</p>
      </div>

      {/* Uploads Block */}
      <div className={`transition-all rounded-2xl border ${flaggedSections.documents ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800'} p-4 space-y-4 bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm`}>
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-200/50 dark:border-gray-800 transition-colors pb-2">{isBn ? "পরিচয়পত্র ও ছবি" : "Identity Documents & Photos"}</h3>
        
        {/* Upload Slot Grid */}
        <div className="grid grid-cols-2 gap-3">
          {renderFileUploader("nid_front", isBn ? "NID সামনের অংশ" : "NID Front")}
          {renderFileUploader("nid_back", isBn ? "NID পেছনের অংশ" : "NID Back")}
          {renderFileUploader("selfie", isBn ? "সেলফি (NID সহ)" : "Selfie (with NID)")}
          {renderFileUploader("photo", isBn ? "পাসপোর্ট সাইজ ছবি" : "Passport Size Photo")}
        </div>
        <div className="mt-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-3 grid grid-cols-2 gap-3">
          {renderFileUploader("nominee_photo", isBn ? "নমিনির ছবি (ঐচ্ছিক)" : "Nominee Photo (Optional)")}
          {category?.id === 'personal' && renderFileUploader("passport_copy", isBn ? "পাসপোর্ট কপি (যদি থাকে)" : "Passport Copy (If Any)")}
        </div>
      </div>

      {/* Income Proofs Block */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-200/50 dark:border-gray-800 transition-colors pb-2">
          {isBn ? "আয়ের প্রমাণপত্র" : "Income Proof"} ({category?.title})
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {category?.id === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {renderFileUploader("office_id", isBn ? "অফিস আইডি কপি" : "Office ID")}
                {renderFileUploader("hr_noc", isBn ? "HR লেটার/NOC" : "HR Letter/NOC")}
                {renderFileUploader("salary_statement", isBn ? "বেতন স্টেটমেন্ট (৬ মাস)" : "Salary Statement (6 Months)")}
                {renderFileUploader("bank_statement", isBn ? "ব্যাংক স্টেটমেন্ট (৬ মাস)" : "Bank Statement (6 Months)")}
                {renderFileUploader("etin_cert", isBn ? "e-TIN/ট্যাক্স রিটার্ন" : "e-TIN/Tax Return")}
                {renderFileUploader("utility_bill", isBn ? "ইউটিলিটি বিল (বর্তমান বাসা)" : "Utility Bill (Current Home)")}
              </div>

              <div className="border-t border-gray-200/50 dark:border-gray-800 pt-4">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-300 mb-3">{isBn ? "গ্যারান্টর ১ ডকুমেন্টস" : "Guarantor 1 Documents"}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {renderFileUploader("guarantor1_nid", isBn ? "এনআইডি কপি" : "NID Copy")}
                  {renderFileUploader("guarantor1_photo", isBn ? "পাসপোর্ট সাইজ ছবি" : "Photo")}
                  {renderFileUploader("guarantor1_income", isBn ? "ব্যাংক/ইনকাম প্রুফ" : "Income/Bank Proof")}
                </div>
              </div>

              <div className="border-t border-gray-200/50 dark:border-gray-800 pt-4">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-300 mb-3">{isBn ? "গ্যারান্টর ২ ডকুমেন্টস" : "Guarantor 2 Documents"}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {renderFileUploader("guarantor2_nid", isBn ? "এনআইডি কপি" : "NID Copy")}
                  {renderFileUploader("guarantor2_photo", isBn ? "পাসপোর্ট সাইজ ছবি" : "Photo")}
                  {renderFileUploader("guarantor2_income", isBn ? "ব্যাংক/ইনকাম প্রুফ" : "Income/Bank Proof")}
                </div>
              </div>
            </div>
          )}

          {category?.id === 'business' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {renderFileUploader("trade_license_3yrs", isBn ? "ট্রেড লাইসেন্স (বিগত ৩ বছর)" : "Trade License (Last 3 Years)")}
                {renderFileUploader("bank_statement_12m", isBn ? "ব্যাংক স্টেটমেন্ট (১২ মাস)" : "Bank Statement (12 Months)")}
                {renderFileUploader("premise_ownership_docs", isBn ? "জায়গার মালিকানা/ভাড়ার দলিল" : "Ownership Deed/Rent Agreement")}
                {renderFileUploader("supplier_buyer_invoices", isBn ? "সাপ্লায়ার এবং ক্রেতার ইনভয়েস" : "Supplier & Buyer Invoices")}
                {renderFileUploader("company_formation_docs", isBn ? "MOA/AOA/পার্টনারশিপ ডিড" : "MOA/AOA/Partnership Deed")}
                {renderFileUploader("audited_financials", isBn ? "অডিটেড ফাইন্যান্সিয়ালস (৩ বছর)" : "Audited Financials (3 Yrs)")}
              </div>
              <div className="border-t border-gray-200/50 dark:border-gray-800 pt-4">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-300 mb-3">{isBn ? "পার্টনার/ডিরেক্টরদের KYC" : "Partners/Directors KYC"}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {renderFileUploader("director_kyc", isBn ? "NID, ছবি ও e-TIN (একসাথে স্ক্যান)" : "NID, Photo & e-TIN (Combined)")}
                </div>
              </div>
            </div>
          )}

          {category?.id === 'women' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {renderFileUploader("women_trade_license", isBn ? "নারী উদ্যোক্তার নিজস্ব ট্রেড লাইসেন্স" : "Trade License (Self)")}
                {renderFileUploader("rjsc_shareholding", isBn ? "আরজেএসসি (RJSC) শেয়ারহোল্ডিং (লিমিটেড হলে)" : "RJSC Shareholding (If Ltd)")}
                {renderFileUploader("women_bank_statement", isBn ? "ব্যবসার ব্যাংক স্টেটমেন্ট (৬-১২ মাস)" : "Business Bank Statement (6-12m)")}
                {renderFileUploader("ecommerce_proof", isBn ? "ই-কমার্স ডোমেইন/ফেসবুক পেমেন্ট হিস্ট্রি" : "E-commerce/F-commerce Proof")}
                {renderFileUploader("chamber_membership", isBn ? "উইমেন চেম্বার/ই-ক্যাব মেম্বারশিপ (BWCCI/WE)" : "Chamber Membership (BWCCI/e-CAB/WE)")}
              </div>
            </div>
          )}

          {category?.id === 'expat' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {renderFileUploader("passport_scan_pages", isBn ? "পাসপোর্টের কপি (১-৫ পৃষ্ঠা ও সিল)" : "Passport Copy (Pages 1-5 & Seals)")}
                {renderFileUploader("visa_iqama_copy", isBn ? "ওয়ার্ক ভিসা/আকামা কপি" : "Work Visa/Iqama Copy")}
                {renderFileUploader("employment_contract", isBn ? "বর্তমান চাকরির চুক্তিনামা" : "Employment Contract")}
                {renderFileUploader("bmet_card", isBn ? "বিএমইটি (BMET) কার্ড" : "BMET Card")}
                {renderFileUploader("remittance_statement_9m", isBn ? "রেমিট্যান্স স্টেটমেন্ট (৯ মাস)" : "Remittance Statement (9 Months)")}
                {renderFileUploader("power_of_attorney", isBn ? "পাওয়ার অফ অ্যাটর্নি (Power of Attorney)" : "Power of Attorney (Local)")}
              </div>
            </div>
          )}

          {category?.id === 'student' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {renderFileUploader("academic_certificates", isBn ? "একাডেমিক সার্টিফিকেট/মার্কশিট" : "Academic Certificates")}
                {renderFileUploader("admission_letter", isBn ? "অফার লেটার (Offer/Admission Letter)" : "Offer/Admission Letter")}
                {renderFileUploader("i20_cas_letter", isBn ? "আই-২০/সিএএস (I-20/CAS Letter)" : "I-20 / CAS Letter")}
                {renderFileUploader("english_proficiency", isBn ? "ইংরেজি দক্ষতা (IELTS/TOEFL)" : "English Proficiency (IELTS/TOEFL)")}
                {renderFileUploader("sponsor_income_proof", isBn ? "স্পনসরের আয়ের প্রমাণপত্র" : "Sponsor's Income Proof")}
                {renderFileUploader("sponsor_bank_statement_1yr", isBn ? "স্পনসরের ব্যাংক স্টেটমেন্ট (১ বছর)" : "Sponsor's Bank Statement (1 Yr)")}
                {renderFileUploader("lien_property_fdr", isBn ? "লিয়েন/বন্ধকী সম্পত্তির দলিল (যদি থাকে)" : "Lien Property/FDR (If any)")}
              </div>
            </div>
          )}

          {category?.id === 'emergency' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {renderFileUploader("diagnosis_report", isBn ? "অফিশিয়াল ডায়াগনসিস রিপোর্ট ও প্রেসক্রিপশন" : "Diagnosis Report & Prescription")}
                {renderFileUploader("cost_estimation_letter", isBn ? "খরচের বাজেট লেটার (সীল ও স্বাক্ষরসহ)" : "Cost Budget Letter")}
                {renderFileUploader("admission_slip", isBn ? "ভর্তির টিকিট ও রানিং বিল (যদি থাকে)" : "Admission Slip & Running Bill")}
                {renderFileUploader("income_proof_quick", isBn ? "আয়ের দ্রুত প্রমাণ (ইন্টারনেট ব্যাংকিং)" : "Quick Income Proof")}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 rounded-2xl border border-amber-500/40 dark:border-amber-900/40 bg-amber-500/5 dark:bg-amber-950/10 flex items-start gap-3 transition-colors">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-normal font-medium">
          {isBn ? "অতিরিক্ত ডকুমেন্টস (যেমন: TIN Certificate, Utility Bill) এডমিন আপনার প্রোফাইল যাচাই করার পর সাবমিট করতে হতে পারে।" : "Additional documents (e.g. TIN, Utility Bill) may be required after admin reviews your profile."}
        </p>
      </div>

      {/* Review Details Summary Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800 overflow-hidden mt-4 bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="bg-gray-100/40 dark:bg-gray-900/20 p-4 border-b border-gray-200/50 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {category?.icon && <category.icon size={18} className="text-gray-500" />}
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{category?.title} লোন</span>
          </div>
          <span className="text-xs font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full">New</span>
        </div>
        
        <div className="p-4 divide-y divide-gray-200/40 dark:divide-gray-700/50">
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 text-sm">{isBn ? "লোনের পরিমাণ" : "Loan Amount"}</span>
            <span className="font-bold text-gray-900 dark:text-white transition-colors">{formatCurrency(amount, isBn)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 text-sm">{isBn ? "সময়কাল" : "Duration"}</span>
            <span className="font-bold text-gray-900 dark:text-white transition-colors">{convertDigits(tenure, isBn)} {isBn ? 'মাস' : 'Months'}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 text-sm">{isBn ? "মাসিক কিস্তি (EMI)" : "Monthly EMI"}</span>
            <span className="font-bold text-primary-600">{formatCurrency(calculateEMI(), isBn)}</span>
          </div>
        </div>
      </div>

      {/* Terms and Declaration Checkbox */}
      <label htmlFor="acceptedTerms" className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer group mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800">
        <div className="pt-0.5">
          <input 
            id="acceptedTerms"
            type="checkbox" 
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          I declare that all provided information is correct. I agree to the{" "}
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggling the checkbox when clicking the terms link
              setShowTermsModal(true);
            }} 
            className="text-primary-600 font-bold hover:underline bg-transparent border-none p-0 inline cursor-pointer"
          >
            {isBn ? "শর্তাবলীতে" : "Terms & Conditions"}
          </button>
          {isBn ? " সম্মত আছি এবং লোন অনুমোদনের ক্ষেত্রে Authorities এর সিদ্ধান্ত চূড়ান্ত বলে গণ্য হবে।" : " and authority decision will be considered final regarding loan approval."}
        </p>
      </label>
    </div>
  );

  const Step5Success = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-10 px-5 space-y-6"
    >
      <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white transition-colors mb-2">{isBn ? "আবেদন সফল!" : "Application Successful!"}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{isBn ? "আপনার আবেদনটি পর্যালোচনার জন্য পাঠানো হয়েছে।" : "Your application has been submitted for review."}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 dark:border-slate-200 dark:border-slate-800 p-5 text-left max-w-xs mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{isBn ? "ট্র্যাকিং আইডি" : "Tracking ID"}</p>
        <p className="text-lg font-mono font-black text-gray-900 dark:text-white transition-colors mb-4">#LN-{submittedApplicationId ? submittedApplicationId.slice(0, 8).toUpperCase() : "—"}</p>
        
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{isBn ? "বর্তমান স্ট্যাটাস" : "Current Status"}</p>
        <div className="flex items-center gap-2">
           <span className="px-3 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 border-white/25 rounded-full">{isBn ? "রিভিউ চলছে" : "Under Review"}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-amber-500/20 dark:border-amber-900/40 bg-amber-500/5 dark:bg-amber-950/10 text-left mt-6 flex gap-3 transition-colors">
        <AlertCircle size={24} className="text-amber-500 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-amber-800 dark:text-amber-300 transition-colors">
            {isBn ? 'কিস্তি ও প্রসেসিং নীতিমালা' : 'Installment & Processing Policy'}
          </h3>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-1 transition-colors leading-relaxed">
            {isBn 
              ? 'আপনার লোন ফাইলটি চূড়ান্ত সক্রিয় করতে নির্ধারিত প্রসেসিং ফি এবং সমবায় সঞ্চয় আমানত নীতিমালা অনুযায়ী জমা দিন। কিস্তির বিস্তারিত জানতে বা সহায়তা পেতে সরাসরি আমাদের হেল্প সেন্টারে যোগাযোগ করতে পারেন।' 
              : 'To finalize your loan activation, please complete the processing fee and savings deposit as per cooperative policy. For queries regarding EMI or support, contact our help center.'}
          </p>
        </div>
      </div>

      <div className="pt-6 space-y-3">
        <Link 
          to="/deposit" 
          className="w-full block text-center bg-primary-600 hover:bg-primary-700 text-white shadow-sm font-bold py-4 rounded-xl text-sm"
        >
          {isBn ? "প্রসেসিং ফি জমা দিন" : "Deposit Processing Fee"}
        </Link>
        <Link 
          to={`/support?prefill=loan_apply&cat=${category?.id}&amount=${amount}`}
          className="w-full block text-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold py-4 rounded-xl text-sm"
        >
          {isBn ? "লাইভ সাপোর্ট চ্যাট" : "Contact Live Support"}
        </Link>
        <Link 
          to="/transactions" 
          className="w-full block text-center font-bold py-4 rounded-xl text-sm bg-gradient-to-r from-gray-800 to-gray-900 text-white border border-slate-200 dark:border-slate-800 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          {isBn ? "ট্র্যাকিং পেজে যান" : "Go to Tracking Page"}
        </Link>
      </div>
    </motion.div>
  );

  return (
    <FormProvider {...methods}>
    <div className="apply-loan-screen app-apply-theme min-h-full bg-slate-50 dark:bg-[#0b1220] transition-colors flex flex-col relative">
      {/* Easy-style application header — visual language follows the supplied reference screens. */}
      {step < 5 && (
        <div className={`loan-easy-font sticky top-0 z-30 backdrop-blur border-b ${
        step === 1
          ? "bg-[#063d34] dark:bg-[#052f29] border-emerald-900/50 text-white"
          : "bg-slate-50/95 dark:bg-[#0b1220]/95 border-slate-200/60 dark:border-slate-800/60"
      }`}>
          <div className="px-3 pt-2.5 pb-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <div className={`px-3.5 h-8 rounded-full border flex items-center justify-center ${
                    step === 1
                      ? "bg-white/10 border-white/15"
                      : "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50"
                  }`}>
                  <span className={`text-[10px] font-black ${
                    step === 1 ? "text-white" : "text-blue-800 dark:text-blue-200"
                  }`}>
                    {isBn ? `আবেদন • ${step === 2 ? "পরিমাণ ও মেয়াদ" : step === 3 ? "আবেদনকারীর তথ্য" : step === 4 ? "ডকুমেন্ট আপলোড" : "ক্যাটাগরি নির্বাচন"}` : `Apply • ${step === 2 ? "Amount & Tenure" : step === 3 ? "Applicant Details" : step === 4 ? "Documents" : "Loan Category"}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowStepHelp(true)} className={`w-9 h-9 rounded-full border flex items-center justify-center ${
                  step === 1
                    ? "bg-white/10 border-white/15 text-white"
                    : "bg-white dark:bg-[#111c2e] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200"
                }`} aria-label={isBn ? "সহায়তা" : "Help"}>
                  <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black">?</span>
                </button>
                {step === 1 ? (
                  <span className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[10px] font-black">↻</span>
                ) : (
                  <button type="button" onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-blue-800 dark:bg-blue-700 text-white flex items-center justify-center shadow-sm" aria-label={isBn ? "প্রোফাইল" : "Profile"}>
                    <User size={19} />
                  </button>
                )}
              </div>
            </div>
            <div className={`mt-2 h-1 rounded-full overflow-hidden ${step === 1 ? "bg-white/15" : "bg-slate-200 dark:bg-slate-800"}`}>
              <motion.div className={`h-full rounded-full ${step === 1 ? "bg-amber-400" : "bg-gradient-to-r from-blue-700 to-blue-500"}`} initial={{ width: 0 }} animate={{ width: `${Math.min(step / totalSteps, 1) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
            {step >= 2 && category && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-200">{isBn ? `ধাপ ${convertDigits(step, true)} / ${convertDigits(totalSteps, true)} • ${step === 2 ? "পরিমাণ ও মেয়াদ" : step === 3 ? "আবেদনকারীর তথ্য" : "ডকুমেন্ট আপলোড"}` : `Step ${step} / ${totalSteps} • ${step === 2 ? "Amount & Tenure" : step === 3 ? "Applicant Details" : "Documents"}`}</span>
                <span className="shrink-0 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-[10px] font-black text-blue-800 dark:text-blue-200">{category.title} {isBn ? "লোন" : "Loan"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="apply-loan-content pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {step === 1 && Step1Category()}
            {step === 2 && Step2Calculator()}
            {step === 3 && Step3CombinedInfo()}
            {step === 4 && Step4Documents()}
            {step === 5 && Step5Success()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar - Compact */}
      {step > 1 && step < 5 && (
        <div className="fixed left-0 right-0 bottom-[88px] px-4 py-2 z-40 flex justify-between gap-2 pointer-events-none">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="pointer-events-auto flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#152640] border border-[#29415f] shrink-0 text-white shadow-none"
            >
              <ChevronLeft size={16} /> {isBn ? 'পিছনে' : 'Back'}
            </button>
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={(step === 1 && !category) || (step === 4 && !acceptedTerms) || isSubmitting}
            className="pointer-events-auto flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-none shrink-0 disabled:bg-gray-200 dark:disabled:bg-gray-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none ml-auto"
          >
            {isSubmitting
              ? (isBn ? 'অপেক্ষা করুন...' : 'Please wait...')
              : step === 4
              ? (isBn ? 'রিভিউ করুন' : 'Review application')
              : (isBn ? 'পরবর্তী ধাপ' : 'Next Step')
            }
            {!isSubmitting && <ChevronRight size={16} />}
          </button>
        </div>
      )}

      {/* Smart Review System Modal Overlay */}
      {verificationStage !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60  overflow-y-auto overscroll-contain">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            {/* Header */}
            <div className="bg-gray-100/40 dark:bg-gray-900/20 px-6 py-4 border-b border-gray-200/50 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-primary-600 dark:text-primary-400" size={20} />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {isBn ? 'স্মার্ট আবেদন যাচাইকরণ' : 'Smart Application Review'}
                </h3>
              </div>
              {(verificationStage === 'confirm' || verificationStage === 'failed') && (
                <button 
                  onClick={handleCloseVerification}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
              {/* STAGE 1: Confirmation & Warnings checklist */}
              {verificationStage === 'confirm' && (
                <>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                      {isBn ? 'লোন ও আবেদনকারী সারসংক্ষেপ' : 'Loan & Applicant Summary'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'ঋণ ক্যাটাগরি' : 'Category'}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{category?.title}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'ঋণের পরিমাণ' : 'Amount'}</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(amount, isBn)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'সময়কাল' : 'Tenure'}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{convertDigits(tenure, isBn)} {isBn ? 'মাস' : 'Months'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'মাসিক কিস্তি' : 'Monthly EMI'}</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(calculateEMI(), isBn)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Warnings Checklist */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                      {isBn ? 'আইনি ঘোষণা ও সতর্কবার্তা চেকলিস্ট' : 'Legal Declaration & Warnings Checklist'}
                    </h4>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      {isBn 
                        ? 'স্মার্ট রিভিউ শুরু করার আগে প্রতিটি আইনি সতর্কবার্তা মনোযোগ দিয়ে পড়ুন এবং সম্মতি দিন:' 
                        : 'Please review and accept each legal warning before starting smart review:'}
                    </p>

                    <div className="space-y-2.5">
                      {/* Check 1 */}
                      <label htmlFor="checkAntiFraud" className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-slate-200 dark:border-slate-800">
                        <input 
                          id="checkAntiFraud"
                          type="checkbox" 
                          checked={checkAntiFraud}
                          onChange={(e) => setCheckAntiFraud(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {isBn 
                            ? 'আমি ঘোষণা করছি যে আমি কোনো ভুয়া বা ডুপ্লিকেট তথ্য প্রদান করিনি। জালিয়াতি সনাক্ত হলে আইডি আজীবন নিষিদ্ধ (Banned) করা হবে।' 
                            : 'I declare that I have not provided fake or duplicate details. Fraud will lead to a permanent ban.'}
                        </span>
                      </label>

                      {/* Check 2 */}
                      <label htmlFor="checkNoRefund" className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-slate-200 dark:border-slate-800">
                        <input 
                          id="checkNoRefund"
                          type="checkbox" 
                          checked={checkNoRefund}
                          onChange={(e) => setCheckNoRefund(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {isBn 
                            ? 'আমি জানি যে ঋণ ফাইল রিভিউর জন্য নির্ধারিত "প্রসেসিং ফি" বাধ্যতামূলক এবং এটি সম্পূর্ণ অফেরতযোগ্য (Non-Refundable)।' 
                            : 'I acknowledge that the required loan processing fee is mandatory and fully non-refundable.'}
                        </span>
                      </label>

                      {/* Check 3 */}
                      <label htmlFor="checkSavingsRule" className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-slate-200 dark:border-slate-800">
                        <input 
                          id="checkSavingsRule"
                          type="checkbox" 
                          checked={checkSavingsRule}
                          onChange={(e) => setCheckSavingsRule(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {isBn 
                            ? 'আমি জানি লোন অনুমোদনের পর তা উত্তোলনের পূর্বে লোন অংকের ১০% / ৫% সঞ্চয় আমানত ডিপোজিট করতে হবে যা আমার একাউন্টে থাকবে।' 
                            : 'I understand that a 10% / 5% savings deposit is required after loan approval to enable withdrawal permissions.'}
                        </span>
                      </label>

                      {/* Check 4 */}
                      <label htmlFor="checkEmiObligation" className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-slate-200 dark:border-slate-800">
                        <input 
                          id="checkEmiObligation"
                          type="checkbox" 
                          checked={checkEmiObligation}
                          onChange={(e) => setCheckEmiObligation(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {isBn 
                            ? 'আমি প্রতি মাসের নির্ধারিত মেয়াদের মধ্যে ঋণের ইএমআই (EMI) কিস্তি পরিশোধ করতে প্রতিশ্রুতিবদ্ধ।' 
                            : 'I commit to paying all monthly loan EMI installments on or before their due dates.'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button 
                      onClick={handleCloseVerification}
                      className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-300"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button 
                      disabled={!checkAntiFraud || !checkNoRefund || !checkSavingsRule || !checkEmiObligation}
                      onClick={processSmartVerification}
                      className="flex-1 py-3 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none"
                    >
                      {isBn ? 'যাচাইকরণ শুরু করুন' : 'Start Verification'}
                    </button>
                  </div>
                </>
              )}

              {/* STAGE 2: Automated Verification Loader */}
              {verificationStage === 'verifying' && (
                <div className="text-center py-6 space-y-6">
                  {/* Transparent Logo Spinner */}
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    {/* Glowing outer spin */}
                    <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-400 border-b-transparent border-l-transparent animate-spin duration-1000"></div>
                    {/* Glowing inner spin reverse */}
                    <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-500 border-l-blue-400 animate-spin duration-1500" style={{ animationDirection: 'reverse' }}></div>
                    {/* Glass Circle + Gradient SVG "P" Logo */}
                    <div className="w-20 h-20 bg-white/10 dark:bg-gray-900/40  rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-800">
                      <svg className="w-9 h-9 text-emerald-500 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M8 20V4h6a4 4 0 0 1 0 8H8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white">
                      {isBn ? 'স্বয়ংক্রিয় ঋণ যাচাইকরণ চলছে...' : 'Automated Smart Review in Progress...'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">
                      {isBn ? `প্রগতি: ${convertDigits(progressPercent, true)}%` : `Progress: ${progressPercent}%`}
                    </p>
                  </div>

                  {/* Horizontal mini progress bar */}
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-emerald-500 h-full rounded-full"
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

                  {/* Checklist of steps */}
                  <div className="text-left space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {/* Check 1 */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={activeCheck >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}>
                        {isBn ? '১. আবেদনপত্র সম্পূর্ণতা যাচাই (Profile Completeness)' : '1. Profile Completeness Auditing'}
                      </span>
                      {activeCheck >= 1 ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      )}
                    </div>

                    {/* Check 2 */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={activeCheck >= 2 ? 'text-emerald-600 dark:text-emerald-400' : activeCheck === 1 ? 'text-gray-950 dark:text-white' : 'text-gray-400'}>
                        {isBn ? '২. জাল আবেদন ও ডুপ্লিকেট পরীক্ষণ (Anti-Fraud Check)' : '2. Anti-Fraud & Duplicate Scan'}
                      </span>
                      {activeCheck >= 2 ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : activeCheck === 1 ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      ) : (
                        <span className="text-gray-300 font-normal shrink-0">-</span>
                      )}
                    </div>

                    {/* Check 3 */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={activeCheck >= 3 ? 'text-emerald-600 dark:text-emerald-400' : activeCheck === 2 ? 'text-gray-950 dark:text-white' : 'text-gray-400'}>
                        {isBn ? '৩. অ্যাকাউন্ট ও নিষেধাজ্ঞা যাচাই (Integrity Check)' : '3. Account Integrity & Ban Scan'}
                      </span>
                      {activeCheck >= 3 ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : activeCheck === 2 ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      ) : (
                        <span className="text-gray-300 font-normal shrink-0">-</span>
                      )}
                    </div>

                    {/* Check 4 */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={activeCheck >= 4 ? 'text-emerald-600 dark:text-emerald-400' : activeCheck === 3 ? 'text-gray-950 dark:text-white' : 'text-gray-400'}>
                        {isBn ? '৪. লোন ফাইল প্রসেসিং ও ডাটাবেস এন্ট্রি (Submission)' : '4. Final Database Entry & Cryptography'}
                      </span>
                      {activeCheck >= 4 ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : activeCheck === 3 ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      ) : (
                        <span className="text-gray-300 font-normal shrink-0">-</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 3: Success Visuals */}
              {verificationStage === 'success' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                    <CheckCircle2 size={44} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">
                      {isBn ? 'যাচাইকরণ সফল!' : 'Verification Passed!'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {isBn ? 'আপনার ঋণ আবেদন ফাইলটি সফলভাবে প্রস্তুত হয়েছে।' : 'Your loan application profile has been fully prepared.'}
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 4: Failed Visuals */}
              {verificationStage === 'failed' && (
                <div className="text-center py-6 space-y-5">
                  <button 
                    type="button"
                    onClick={handleCloseVerification}
                    className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto text-rose-500 ring-8 ring-rose-50 dark:ring-rose-950/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title={isBn ? 'বন্ধ করুন' : 'Close'}
                  >
                    <X size={40} strokeWidth={2.5} />
                  </button>
                  <div>
                    <h4 className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {isBn ? 'যাচাইকরণ ব্যর্থ!' : 'Verification Failed'}
                    </h4>
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-left mt-4 text-[11px] leading-relaxed font-semibold">
                      <p className="flex items-center gap-1 mb-1 font-black uppercase tracking-wider text-[9px]"><AlertCircle size={12} /> {isBn ? 'ব্যর্থতার কারণ:' : 'Error details:'}</p>
                      {verifyingError}
                    </div>
                  </div>

                  <button 
                    onClick={handleCloseVerification}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 text-white border border-slate-200 dark:border-slate-800 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {isBn ? 'তথ্য সংশোধন করতে ফিরে যান' : 'Go Back to Edit Details'}
                  </button>
                </div>
              )}
            </div>
            </motion.div>
          </div>
        )}
      {/* Contextual help for each application step */}
      {showStepHelp && (
        <div className="apply-loan-help-modal fixed inset-0 z-[75] flex items-center justify-center p-3 bg-slate-950/60 overscroll-contain">
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <div>
                <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300">{isBn ? ("ধাপ " + convertDigits(step, true) + " / " + convertDigits(totalSteps, true)) : ("Step " + step + " of " + totalSteps)}</p>
                <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isBn ? "এই ধাপে কী করবেন" : "Step guide"}</h3>
              </div>
              <button type="button" onClick={() => setShowStepHelp(false)} aria-label={isBn ? "বন্ধ করুন" : "Close help"} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200"><X size={18} /></button>
            </div>
            <div className="px-5 py-5 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {step === 1 ? (
                <><p>{isBn ? "প্রথমে আপনার পেশা বা প্রয়োজন নির্বাচন করুন। এরপর আপনার জন্য প্রযোজ্য লোন ক্যাটাগরি দেখানো হবে।" : "Choose your profession or need first. The app will then show matching loan categories."}</p><p>{isBn ? "ক্যাটাগরির বিস্তারিত দেখে সর্বোচ্চ সীমা, সুদের হার, মেয়াদ ও প্রয়োজনীয় কাগজপত্র মিলিয়ে নিন।" : "Open loan details to review the limit, rate, tenure and required documents."}</p></>
              ) : step === 2 ? (
                <><p>{isBn ? "স্লাইডার বা দ্রুত পরিমাণের বোতাম দিয়ে লোনের পরিমাণ নির্ধারণ করুন। এরপর অনুমোদিত মেয়াদ নির্বাচন করুন।" : "Set your loan amount using the slider or quick amount buttons, then choose an allowed tenure."}</p><p>{isBn ? "মাসিক কিস্তি, মোট পরিশোধ ও প্রাথমিক ফি আনুমানিক হিসাব—চালিয়ে যাওয়ার আগে পুরো হিসাব দেখে নিন।" : "Monthly EMI, total payable and upfront fees are estimates; review the full calculation before continuing."}</p></>
              ) : step === 3 ? (
                <><p>{isBn ? "ব্যক্তিগত, ঠিকানা, পেশাগত, ব্যাংক ও নমিনি তথ্যের প্রতিটি সেকশন খুলে প্রয়োজনীয় তথ্য পূরণ করুন।" : "Open each section and complete the required personal, address, professional, bank and nominee details."}</p><p>{isBn ? "লাল চিহ্নিত ত্রুটি থাকলে সংশোধন করুন। ঠিকানা ও পরিচয়পত্রের তথ্য সঠিকভাবে মিলিয়ে দিন।" : "Correct red validation messages and make sure address and identity information is accurate."}</p></>
              ) : (
                <><p>{isBn ? "যে কাগজপত্রের পাশে ‘আবশ্যক’ লেখা আছে, সেগুলো আপলোড করুন। ছবি পরিষ্কার হতে হবে; ছবি বা PDF দেওয়া যাবে।" : "Upload every document marked Required. Photos must be readable; images and PDFs are accepted."}</p><p>{isBn ? "শর্তাবলী পড়ে সম্মতি দিন, তারপর সাবমিট করুন। পরবর্তী ধাপে চূড়ান্ত সারসংক্ষেপ দেখে আবেদন পাঠানো হবে।" : "Review and accept the terms, then submit. The final review checklist appears before the application is sent."}</p></>
              )}
            </div>
            <div className="px-5 pb-5"><button type="button" onClick={() => setShowStepHelp(false)} className="w-full min-h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm">{isBn ? "বুঝেছি" : "Got it"}</button></div>
          </motion.div>
        </div>
      )}
      {/* Local Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60  overflow-hidden text-gray-800 dark:text-gray-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="bg-gray-100/40 dark:bg-gray-950/20 px-6 py-4 border-b border-gray-200/50 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-600 dark:text-primary-400" size={20} />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {isBn ? 'নীতিমালা ও শর্তাবলী' : 'Policies & Terms'}
                </h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {/* 1. Terms & Conditions */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-200/50 dark:border-gray-800">
                  <FileText className="text-primary-500" size={16} />
                  {isBn ? '১. নিয়ম ও শর্তাবলী' : '1. Terms & Conditions'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5">
                    <p>ক. <b>প্রভাতি সমবায় সমিতি</b> অ্যাপ্লিকেশনের মাধ্যমে ঋণ আবেদনের ক্ষেত্রে আবেদনকারীকে অবশ্যই সমিতির একজন বৈধ সদস্য হতে হবে এবং তার সমস্ত তথ্য সঠিক হতে হবে।</p>
                    <p>খ. Authorities এর সিদ্ধান্ত লোন অনুমোদন, পুনর্নিরীক্ষণ (Revision), অথবা বাতিলের ক্ষেত্রে চূড়ান্ত বলে গণ্য হবে এবং আবেদনকারী তা মেনে নিতে বাধ্য থাকবেন।</p>
                    <p>গ. ভুল তথ্য প্রদান বা জাল প্রমাণপত্র আপলোড করা হলে সমিতি কর্তৃপক্ষ কোনো নোটিশ ছাড়াই ব্যবহারকারীর অ্যাকাউন্ট সাময়িকভাবে বা চিরতরে স্থগিত (Suspended/Banned) করার অধিকার সংরক্ষণ করে।</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p>a. To apply for a loan through <b>Provati Somobay Somiti</b>, the applicant must be a registered member, and all provided details must be accurate.</p>
                    <p>b. The authority's decisions regarding loan approval, rejection, or revision requests are final and binding on all applicants.</p>
                    <p>c. Submission of fraudulent data or forged documents will lead to instant suspension/ban of the user account without prior notice.</p>
                  </div>
                )}
              </section>

              {/* 2. Loan Guidelines */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-200/50 dark:border-gray-800">
                  <ShieldAlert className="text-primary-500" size={16} />
                  {isBn ? '২. ঋণ নির্দেশিকা' : '2. Loan Guidelines'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5">
                    <p>ঋণ পাওয়ার জন্য আবেদনকারীকে তার পেশা অনুযায়ী সঠিক ক্যাটাগরি নির্বাচন করতে হবে। প্রতিটি ক্যাটাগরির জন্য ঋণের সর্বোচ্চ সীমা এবং মাসিক সুদের হার আলাদা হতে পারে:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><b>ব্যক্তিগত লোন (Personal):</b> সর্বোচ্চ {loanLimitLabel('personal', 500000)} টাকা। মাসিক সুদ {monthlyRateLabel('minRatePersonal', 0.0055)}।</li>
                      <li><b>ব্যবসায়িক লোন (Business):</b> সর্বোচ্চ {loanLimitLabel('business', 5000000)} টাকা। মাসিক সুদ {monthlyRateLabel('minRateBusiness', 0.0055)}।</li>
                      <li><b>প্রবাসী লোন (Probashi):</b> সর্বোচ্চ {loanLimitLabel('expat', 1000000)} টাকা। মাসিক সুদ {monthlyRateLabel('minRateExpat', 0.005)}।</li>
                      <li><b>শিক্ষা লোন (Student):</b> সর্বোচ্চ {loanLimitLabel('student', 500000)} টাকা। মাসিক সুদ {monthlyRateLabel('minRateStudent', 0.005)}।</li>
                      <li><b>জরুরি লোন (Emergency):</b> সর্বোচ্চ {loanLimitLabel('emergency', 100000)} টাকা। মাসিক সুদ {monthlyRateLabel('minRateEmergency', 0.006)}।</li>
                      <li><b>মহিলা উদ্যোক্তা লোন (Women):</b> সর্বোচ্চ {loanLimitLabel('women', 2000000)} টাকা। মাসিক সুদ {monthlyRateLabel('minRateWomen', 0.0055)}।</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p>Applicants must select the appropriate category matching their profession. Loan limits and interest rates are defined as follows:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><b>Personal Loan:</b> up to BDT {loanLimitLabel('personal', 500000)}. Monthly rate {monthlyRateLabel('minRatePersonal', 0.0055)}.</li>
                      <li><b>Business Loan:</b> up to BDT {loanLimitLabel('business', 5000000)}. Monthly rate {monthlyRateLabel('minRateBusiness', 0.0055)}.</li>
                      <li><b>Probashi Loan:</b> up to BDT {loanLimitLabel('expat', 1000000)}. Monthly rate {monthlyRateLabel('minRateExpat', 0.005)}.</li>
                      <li><b>Student Loan:</b> up to BDT {loanLimitLabel('student', 500000)}. Monthly rate {monthlyRateLabel('minRateStudent', 0.005)}.</li>
                      <li><b>Emergency Loan:</b> up to BDT {loanLimitLabel('emergency', 100000)}. Monthly rate {monthlyRateLabel('minRateEmergency', 0.006)}.</li>
                      <li><b>Women Entrepreneur Loan:</b> up to BDT {loanLimitLabel('women', 2000000)}. Monthly rate {monthlyRateLabel('minRateWomen', 0.0055)}.</li>
                    </ul>
                  </div>
                )}
              </section>

              {/* 3. Important Notices */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-200/50 dark:border-gray-800">
                  <AlertCircle className="text-amber-500" size={16} />
                  {isBn ? '৩. গুরুত্বপূর্ণ নোটিশ' : '3. Important Notices'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 font-medium">
                    <p className="font-bold">প্রসেসিং ফি বাধ্যতামুলক:</p>
                    <p>ঋণ আবেদন প্রসেস করার জন্য নির্ধারিত "প্রসেসিং ফি" ডিপোজিট করা বাধ্যতামূলক। ফি প্রদান ছাড়া কোনো আবেদন রিভিউর আওতায় নেওয়া হবে না এবং এটি সম্পূর্ণ অফেরতযোগ্য।</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 font-medium">
                    <p className="font-bold">Processing Fee is Mandatory:</p>
                    <p>To begin evaluating your loan profile, the processing fee must be deposited. Unpaid files will not be reviewed. Processing fees are non-refundable.</p>
                  </div>
                )}
              </section>

              {/* 4. Savings & Deposit Policies */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-200/50 dark:border-gray-800">
                  <Landmark className="text-primary-500" size={16} />
                  {isBn ? '৪. সঞ্চয় ও ডিপোজিট নীতিমালা' : '4. Savings & Deposit Policies'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5">
                    <p><b>• প্রসেসিং ফি:</b> ৫০,০০০ থেকে ১০,০০,০০০ টাকা পর্যন্ত লোন আবেদনের ক্ষেত্রে {percentLabel(processingFeeUpTo1m)} প্রসেসিং ফি এবং ১০,০০,০০০ টাকার ওপরে হলে {percentLabel(processingFeeAbove1m)} প্রসেসিং ফি প্রযোজ্য।</p>
                    <p><b>• সঞ্চয় আমানত:</b> সমবায় আমানত সুরক্ষার্থে ৫০,০০০ থেকে ৫,০০,০০০ টাকা ঋণের জন্য {percentLabel(securityDepositUpTo500k)} সঞ্চয় এবং ৫,০০,০০০ টাকার ওপরে হলে {percentLabel(securityDepositAbove500k)} সঞ্চয় ডিপোজিট করা বাধ্যতামূলক।</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p><b>• Processing Fee:</b> BDT 50k to BDT 1M requires {percentLabel(processingFeeUpTo1m)} processing fee. BDT 1M+ requires {percentLabel(processingFeeAbove1m)}.</p>
                    <p><b>• Savings Deposit:</b> BDT 50k to BDT 500k loans require a {percentLabel(securityDepositUpTo500k)} savings deposit. BDT 500k+ loans require a {percentLabel(securityDepositAbove500k)} savings deposit.</p>
                  </div>
                )}
              </section>
            </div>
            <div className="bg-gray-100/40 dark:bg-gray-950/20 px-6 py-4 border-t border-gray-200/50 dark:border-gray-800 flex justify-end shrink-0">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-800 dark:text-white rounded-xl font-bold text-xs"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </FormProvider>
  );
}
