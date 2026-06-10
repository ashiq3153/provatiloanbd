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
  ShieldAlert
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'sonner';
import { useAppStore } from "../lib/store";
import { convertDigits, formatCurrency } from "../lib/translation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLoanSchema, LoanFormData } from "./ApplyLoanSchema";

import { getCategories, snapPoints, amountPackages, formatAmount, getAllowedTenure, getColorStyles, getIconColor } from "./apply-loan-utils";

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
    <div id={`accordion-section-${sectionKey}`} className="space-y-2 scroll-mt-20">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4.5 border transition-all text-left font-bold text-sm select-none cursor-pointer ${
          isExpanded
            ? flagged
              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 text-amber-900 dark:text-amber-100 shadow-sm rounded-t-2xl rounded-b-none ring-2 ring-amber-500/20"
              : "bg-primary-50/50 dark:bg-primary-950/20 border-primary-500 text-primary-900 dark:text-primary-100 shadow-sm rounded-t-2xl rounded-b-none"
            : flagged
            ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-400 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 rounded-2xl ring-2 ring-amber-500/10 animate-pulse"
            : hasError
            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-455 rounded-2xl"
            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-200 rounded-2xl"
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
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
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
            <span className="flex items-center gap-1 text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-455 px-2 py-1 rounded-full font-black animate-pulse">
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
            <div className="p-5 pt-3 bg-white dark:bg-gray-800 border border-t-0 border-gray-100 dark:border-gray-700 rounded-b-2xl space-y-4 shadow-sm">
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
  const categories = React.useMemo(() => {
    const allCats = getCategories(isBn, systemSettings);
    return allCats.filter(cat => systemSettings?.categories?.[cat.id]?.enabled !== false);
  }, [isBn, systemSettings]);

  const methods = useForm<LoanFormData>({
    resolver: zodResolver(getLoanSchema(isBn)),
    mode: "onChange",
  });
  const { register, trigger, formState: { errors } } = methods;


  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [category, setCategory] = useState<ReturnType<typeof getCategories>[0] | null>(null);
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(24);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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
    nominee: false
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [flaggedSections, setFlaggedSections] = useState<Record<string, boolean>>({
    personal: false,
    professional: false,
    bank: false,
    nominee: false,
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

          const defaultFields = {
            fullName: loan.full_name,
            fatherName: loan.father_name,
            motherName: loan.mother_name,
            dob: loan.dob || '',
            gender: loan.gender || 'Male',
            mobile: loan.mobile,
            whatsapp: loan.whatsapp || '',
            email: loan.email || '',
            currentAddress: loan.current_address,
            permanentAddress: loan.permanent_address,
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
              nominee: flagged.nominee
            });

            // Auto navigate step
            if (flagged.personal || flagged.professional || flagged.bank || flagged.nominee) {
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
      const draftStr = localStorage.getItem('loan_draft_v1');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          // Only restore if user was past step 1 (mid-application)
          if (draft.step && draft.step > 1 && draft.step < 5) {
            setStep(draft.step);
            if (draft.categoryId) {
              const matched = categories.find(cat => cat.id === draft.categoryId);
              if (matched) setCategory(matched);
            }
            if (draft.amount) setAmount(draft.amount);
            if (draft.tenure) setTenure(draft.tenure);
            if (draft.formData) {
              methods.reset(draft.formData);
            }
          } else {
            localStorage.removeItem('loan_draft_v1');
          }
        } catch(e) {
          localStorage.removeItem('loan_draft_v1');
        }
      }
    }
  }, [location.search, categories]);

  // Save draft without causing re-renders (subscription-based)
  useEffect(() => {
    if (editId || step >= 5) return;
    const subscription = methods.watch((formData) => {
      const draft = {
        step,
        categoryId: category?.id,
        amount,
        tenure,
        formData
      };
      localStorage.setItem('loan_draft_v1', JSON.stringify(draft));
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

  const calculateEMI = () => {
    if (!category) return 0;
    const r = category.minRate;
    const n = tenure;
    if (r === 0) return amount / n;
    const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };



  const nextStep = async () => {
    if (step < totalSteps) {
      if (step === 1 && !category) return;
      if (step === 2 && (!amount || !tenure)) return;
      
      if (step === 3) {
        const personalFields: (keyof LoanFormData)[] = ['fullName', 'fatherName', 'motherName', 'dob', 'gender', 'mobile', 'whatsapp', 'email', 'currentAddress', 'permanentAddress', 'nidNumber'];
        
        let profFields: (keyof LoanFormData)[] = [];
        if (category?.id === 'personal') profFields = ['companyName', 'designation', 'workDuration', 'monthlyIncome'];
        else if (category?.id === 'business' || category?.id === 'women') profFields = ['businessName', 'shopAddress', 'tradeLicense', 'monthlyIncome'];
        else if (category?.id === 'expat') profFields = ['workingCountry', 'visaType', 'passportNumber', 'monthlyIncome'];
        else if (category?.id === 'student') profFields = ['institutionName', 'studentId', 'guardianIncome'];
        else if (category?.id === 'emergency') profFields = ['professionName', 'emergencyReason', 'monthlyIncome'];
        
        const bankFields: (keyof LoanFormData)[] = ['bankName', 'accountName', 'accountNumber', 'routingNumber', 'mobileBanking'];
        const nomineeFields: (keyof LoanFormData)[] = ['nomineeName', 'nomineeRelation', 'nomineeMobile', 'nomineeNid'];
        
        const allFields = [...personalFields, ...profFields, ...bankFields, ...nomineeFields];
        const isValid = await trigger(allFields);
        
        if (!isValid) {
          // Auto-expand sections that have validation errors
          const newExpanded = { ...expanded };
          const hasPersonalError = personalFields.some(f => errors[f]);
          const hasProfError = profFields.some(f => errors[f]);
          const hasBankError = bankFields.some(f => errors[f]);
          const hasNomineeError = nomineeFields.some(f => errors[f]);
          
          if (hasPersonalError) newExpanded.personal = true;
          if (hasProfError) newExpanded.professional = true;
          if (hasBankError) newExpanded.bank = true;
          if (hasNomineeError) newExpanded.nominee = true;
          
          setExpanded(newExpanded);
          toast.error(isBn ? 'অনুগ্রহ করে লাল চিহ্নিত ত্রুটিযুক্ত তথ্যগুলো সঠিকভাবে পূরণ করুন।' : 'Please correct the errors marked in red.');
          return;
        }
      }

      if (step === 4) {
        if (!documents.nid_front || !documents.nid_back) {
          toast.error(isBn ? 'অনুগ্রহ করে NID এর উভয় পিঠ আপলোড করুন' : 'Please upload both sides of NID');
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
      
      const draftStr = localStorage.getItem('loan_draft_v1');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          draft.step = newStep;
          localStorage.setItem('loan_draft_v1', JSON.stringify(draft));
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
      } else if (category?.id === 'business' || category?.id === 'women') {
        professionalInfo.businessName = formData.businessName || '';
        professionalInfo.shopAddress = formData.shopAddress || '';
        professionalInfo.tradeLicense = formData.tradeLicense || '';
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
        professionalInfo.emergencyReason = formData.emergencyReason || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
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
        processing_fee: amount * (systemSettings?.procFee || 0.01),
        security_deposit: amount * (systemSettings?.secDeposit || 0.1),
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
        toast.success(isBn ? 'আপনার আবেদন সফলভাবে জমা হয়েছে!' : 'Application successfully submitted!', { id: loadingId });
        localStorage.removeItem('loan_draft_v1');
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
      
      const draftStr = localStorage.getItem('loan_draft_v1');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          draft.step = newStep;
          localStorage.setItem('loan_draft_v1', JSON.stringify(draft));
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
      } else if (category?.id === 'business' || category?.id === 'women') {
        professionalInfo.businessName = formData.businessName || '';
        professionalInfo.shopAddress = formData.shopAddress || '';
        professionalInfo.tradeLicense = formData.tradeLicense || '';
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
        professionalInfo.emergencyReason = formData.emergencyReason || '';
        professionalInfo.monthlyIncome = formData.monthlyIncome || '';
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
        processing_fee: amount * (systemSettings?.procFee || 0.01),
        security_deposit: amount * (systemSettings?.secDeposit || 0.1),
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
        setProgressPercent(100);
        setActiveCheck(4);
        setVerificationStage('success');
        await sleep(650);

        localStorage.removeItem('loan_draft_v1');
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

  const Step1Category = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{isBn ? "লোনের ধরন নির্বাচন করুন" : "Select Loan Type"}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{isBn ? "আপনার পেশা অনুযায়ী সঠিক লোন নির্বাচন করুন" : "Select the right loan based on your profession"}</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat) => {
          const isActive = category?.id === cat.id;
          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                const rawAllowed = getAllowedTenure(amount);
                const minAllowed = Math.max(rawAllowed[0], cat.minTenure ?? 12);
                setCategory(cat);
                setTenure(minAllowed);
                setStep(2);
              }}
              className={`group w-full rounded-[24px] text-left relative overflow-hidden transition-all duration-300 border-2 cursor-pointer ${
                isActive 
                  ? "border-primary-500 bg-gradient-to-br from-white to-primary-50/20 dark:from-gray-800 dark:to-primary-950/10 shadow-lg shadow-primary-500/10"
                  : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-650 hover:shadow-md"
              }`}
            >
              <div className="flex flex-col sm:flex-row min-h-[160px]">
                {/* Text Content */}
                <div className="flex-1 p-5 relative z-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(cat.color)}`}>
                        <cat.icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-lg transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {cat.title}
                        </h3>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {isBn ? "সর্বোচ্চঃ" : "Up to"} {cat.limit} {isBn ? "টাকা" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 dark:border-gray-700/60 my-3">
                    <div>
                      <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">{isBn ? "মেয়াদ" : "Tenure"}</p>
                      <p className="text-xs font-extrabold text-gray-800 dark:text-gray-250">{cat.tenureRange}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">{isBn ? "সুদ" : "Int. Rate"}</p>
                      <p className="text-xs font-extrabold text-gray-800 dark:text-gray-250">{cat.intRates}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">{isBn ? "প্রসেস" : "Processing"}</p>
                      <p className="text-xs font-extrabold text-gray-800 dark:text-gray-250">{cat.procTime}</p>
                    </div>
                  </div>

                  {/* Features Tag */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {cat.features.map((feature, i) => (
                      <span key={i} className={`px-2 py-0.5 text-[10px] rounded-[6px] border font-bold ${
                        isActive 
                          ? 'bg-primary-500/10 border-primary-500/20 text-primary-600 dark:text-primary-400' 
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side Image wrapper with fade mask */}
                <div className="relative w-full sm:w-[190px] h-[160px] sm:h-auto overflow-hidden shrink-0 self-stretch">
                  {/* Fade Gradient Overlay (Left for desktop, bottom for mobile) */}
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-white dark:from-gray-800 via-white/40 dark:via-gray-800/40 to-transparent z-10 pointer-events-none" />
                  
                  {/* Category Image */}
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
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
              const rawAllowed = getAllowedTenure(amount);
              const minAllowed = Math.max(rawAllowed[0], category?.minTenure ?? 12);
              const maxAllowed = Math.min(rawAllowed[1], category?.maxTenure ?? 60);
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
                  {convertDigits(months, isBn)}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium text-center">
            {formatCurrency(amount, isBn)} {isBn ? "টাকার জন্য" : "Taka allows"} {convertDigits(getAllowedTenure(amount)[0], isBn)} - {convertDigits(getAllowedTenure(amount)[1], isBn)} {isBn ? "মাস অনুমোদিত" : "months"}
          </p>
        </div>

        {/* Breakdown */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-gray-800 transition-colors/5 rounded-bl-[100px] -mr-8 -mt-8"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
               <div>
                 <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{isBn ? "মাসিক কিস্তি" : "Monthly EMI"}</p>
                 <p className="text-3xl font-black">{formatCurrency(calculateEMI(), isBn)}</p>
               </div>
               <div className="text-right">
                 <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{isBn ? "মোট পরিশোধ" : "Total Payable"}</p>
                 <p className="text-xl font-bold text-emerald-400">{formatCurrency(calculateEMI() * tenure, isBn)}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{isBn ? "সুদ হার" : "Interest Rate"}</p>
                <p className="font-semibold text-sm">{convertDigits(category.intRates, isBn)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{isBn ? "প্রসেসিং ফি (১%)" : "Processing Fee (1%)"}</p>
                <p className="font-semibold text-sm">{formatCurrency(amount * category.procFee, isBn)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{isBn ? "সিকিউরিটি মানি (১০%)" : "Security Deposit (10%)"}</p>
                <p className="font-semibold text-sm">{formatCurrency(amount * category.secDeposit, isBn)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const Step3CombinedInfo = () => {
    const personalFields: (keyof LoanFormData)[] = ['fullName', 'fatherName', 'motherName', 'dob', 'gender', 'mobile', 'whatsapp', 'email', 'currentAddress', 'permanentAddress', 'nidNumber'];
    
    let profFields: (keyof LoanFormData)[] = [];
    if (category?.id === 'personal') profFields = ['companyName', 'designation', 'workDuration', 'monthlyIncome'];
    else if (category?.id === 'business' || category?.id === 'women') profFields = ['businessName', 'shopAddress', 'tradeLicense', 'monthlyIncome'];
    else if (category?.id === 'expat') profFields = ['workingCountry', 'visaType', 'passportNumber', 'monthlyIncome'];
    else if (category?.id === 'student') profFields = ['institutionName', 'studentId', 'guardianIncome'];
    else if (category?.id === 'emergency') profFields = ['professionName', 'emergencyReason', 'monthlyIncome'];
    
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
          <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-850 dark:text-amber-300 p-4.5 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs font-semibold leading-relaxed flex gap-3 transition-colors mb-4">
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
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পূর্ণ নাম (NID অনুযায়ী)" : "Full Name (as per NID)"}</label>
              <input type="text" {...register("fullName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.fullName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder={isBn ? "যেমন: মোঃ রহিম উদ্দিন" : "e.g. Md. Rahim Uddin"} />
              <ErrorText field="fullName" />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পিতার নাম" : "Father's Name"}</label>
                <input type="text" {...register("fatherName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.fatherName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder={isBn ? "পিতার নাম" : "Father's Name"} />
                <ErrorText field="fatherName" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাতার নাম" : "Mother's Name"}</label>
                <input type="text" {...register("motherName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.motherName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder={isBn ? "মাতার নাম" : "Mother's Name"} />
                <ErrorText field="motherName" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "আপনার NID নম্বর" : "Your NID Number"}</label>
              <input type="text" {...register("nidNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nidNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder={isBn ? "এনআইডি নম্বর লিখুন" : "Enter NID Number"} />
              <ErrorText field="nidNumber" />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "জন্ম তারিখ" : "Date of Birth"}</label>
                <input type="date" {...register("dob")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.dob ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-750 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} />
                <ErrorText field="dob" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "লিঙ্গ" : "Gender"}</label>
                <select {...register("gender")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.gender ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`}>
                  <option>{isBn ? "পুরুষ" : "Male"}</option>
                  <option>{isBn ? "নারী" : "Female"}</option>
                  <option>{isBn ? "অন্যান্য" : "Other"}</option>
                </select>
                <ErrorText field="gender" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল নাম্বার" : "Mobile Number"}</label>
                <input type="tel" {...register("mobile")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.mobile ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="01XXXXXXXXX" />
                <ErrorText field="mobile" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "হোয়াটসঅ্যাপ (ঐচ্ছিক)" : "WhatsApp (Optional)"}</label>
                <input type="tel" {...register("whatsapp")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.whatsapp ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="01XXXXXXXXX" />
                <ErrorText field="whatsapp" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ইমেইল (ঐচ্ছিক)" : "Email (Optional)"}</label>
              <input type="email" {...register("email")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="example@email.com" />
              <ErrorText field="email" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "বর্তমান ঠিকানা" : "Current Address"}</label>
              <textarea rows={1.5} {...register("currentAddress")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.currentAddress ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all resize-none`} placeholder={isBn ? "বাসা, রাস্তা, এলাকা..." : "House, Road, Area..."} />
              <ErrorText field="currentAddress" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "স্থায়ী ঠিকানা" : "Permanent Address"}</label>
              <textarea rows={1.5} {...register("permanentAddress")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.permanentAddress ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all resize-none`} placeholder={isBn ? "এনআইডি অনুযায়ী সম্পূর্ণ ঠিকানা..." : "Complete address as per NID..."} />
              <ErrorText field="permanentAddress" />
            </div>
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
          <div className="space-y-3.5 text-xs">
            {category?.id === 'personal' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কোম্পানির নাম / পেশা" : "Company/Profession Name"}</label>
                  <input type="text" {...register("companyName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.companyName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder={isBn ? "কোম্পানি বা পেশার নাম" : "Company or Profession name"} />
                  <ErrorText field="companyName" />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পদবী" : "Designation"}</label>
                    <input type="text" {...register("designation")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.designation ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Manager/Worker" />
                    <ErrorText field="designation" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কাজের মেয়াদ" : "Work Duration"}</label>
                    <input type="text" {...register("workDuration")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.workDuration ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="যেমন: ৩ বছর" />
                    <ErrorText field="workDuration" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                  <input type="number" {...register("monthlyIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.monthlyIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="৳" />
                  <ErrorText field="monthlyIncome" />
                </div>
              </>
            )}

            {(category?.id === 'business' || category?.id === 'women') && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্যবসার নাম" : "Business Name"}</label>
                  <input type="text" {...register("businessName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.businessName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="আপনার স্টোর বা কোম্পানির নাম" />
                  <ErrorText field="businessName" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "দোকান / অফিসের ঠিকানা" : "Shop / Office Address"}</label>
                  <textarea rows={1.5} {...register("shopAddress")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.shopAddress ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all resize-none`} placeholder={isBn ? "ঠিকানা লিখুন" : "Enter Address"} />
                  <ErrorText field="shopAddress" />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ট্রেড লাইসেন্স নম্বর" : "Trade License No"}</label>
                    <input type="text" {...register("tradeLicense")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.tradeLicense ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Tr xxx-xxx" />
                    <ErrorText field="tradeLicense" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                    <input type="number" {...register("monthlyIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.monthlyIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="৳" />
                    <ErrorText field="monthlyIncome" />
                  </div>
                </div>
              </>
            )}

            {category?.id === 'expat' && (
              <>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "কর্মরত দেশের নাম" : "Working Country"}</label>
                    <input type="text" {...register("workingCountry")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.workingCountry ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Dubai / KSA" />
                    <ErrorText field="workingCountry" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ভিসার ধরন" : "Visa Type"}</label>
                    <input type="text" {...register("visaType")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.visaType ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Work Visa" />
                    <ErrorText field="visaType" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পাসপোর্ট নম্বর" : "Passport Number"}</label>
                    <input type="text" {...register("passportNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.passportNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="AXXXXXXXX" />
                    <ErrorText field="passportNumber" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                    <input type="number" {...register("monthlyIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.monthlyIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="৳" />
                    <ErrorText field="monthlyIncome" />
                  </div>
                </div>
              </>
            )}

            {category?.id === 'student' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "প্রতিষ্ঠানের নাম" : "Institution Name"}</label>
                  <input type="text" {...register("institutionName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.institutionName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="University Name" />
                  <ErrorText field="institutionName" />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "স্টুডেন্ট আইডি" : "Student ID"}</label>
                    <input type="text" {...register("studentId")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.studentId ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="201-xx-xx" />
                    <ErrorText field="studentId" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "অভিভাবকের আয়" : "Guardian's Income"}</label>
                    <input type="number" {...register("guardianIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.guardianIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="৳" />
                    <ErrorText field="guardianIncome" />
                  </div>
                </div>
              </>
            )}

            {category?.id === 'emergency' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "পেশা" : "Profession"}</label>
                  <input type="text" {...register("professionName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.professionName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-855 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder={isBn ? "পেশা" : "Profession"} />
                  <ErrorText field="professionName" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "জরুরি কারণ" : "Emergency Reason"}</label>
                  <textarea rows={1.5} {...register("emergencyReason")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.emergencyReason ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all resize-none`} placeholder="জরুরি লোন কেন প্রয়োজন?" />
                  <ErrorText field="emergencyReason" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মাসিক আয়" : "Monthly Income"}</label>
                  <input type="number" {...register("monthlyIncome")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.monthlyIncome ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="৳" />
                  <ErrorText field="monthlyIncome" />
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
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "ব্যাংকের নাম" : "Bank Name"}</label>
              <input type="text" {...register("bankName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.bankName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="DBBL / BRAC Bank / Islami Bank" />
              <ErrorText field="bankName" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "একাউন্টের নাম" : "Account Name"}</label>
              <input type="text" {...register("accountName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.accountName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Account Holder Name" />
              <ErrorText field="accountName" />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "একাউন্ট নম্বর" : "Account Number"}</label>
                <input type="text" {...register("accountNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.accountNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-855 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Account Number" />
                <ErrorText field="accountNumber" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "রাউটিং নাম্বার (ঐচ্ছিক)" : "Routing Number (Optional)"}</label>
                <input type="text" {...register("routingNumber")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.routingNumber ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Routing Number" />
                <ErrorText field="routingNumber" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল ব্যাংকিং নম্বর (বিকাশ/নগদ) (ঐচ্ছিক)" : "Mobile Banking Number (bKash/Nagad) (Optional)"}</label>
              <input type="tel" {...register("mobileBanking")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.mobileBanking ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="01XXXXXXXXX" />
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
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "নমিনির নাম" : "Nominee Name"}</label>
              <input type="text" {...register("nomineeName")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeName ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="Nominee Name" />
              <ErrorText field="nomineeName" />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "সম্পর্ক" : "Relationship"}</label>
                <input type="text" {...register("nomineeRelation")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeRelation ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="যেমন: ভাই / স্ত্রী" />
                <ErrorText field="nomineeRelation" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "মোবাইল নাম্বার" : "Mobile Number"}</label>
                <input type="text" {...register("nomineeMobile")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeMobile ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="01XXXXXXXXX" />
                <ErrorText field="nomineeMobile" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{isBn ? "NID নম্বর" : "NID Number"}</label>
              <input type="text" {...register("nomineeNid")} className={`w-full bg-gray-50 dark:bg-gray-900 border ${errors.nomineeNid ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-primary-500"} rounded-xl px-4 py-2.5 text-xs text-gray-850 dark:text-white font-medium focus:ring-2 outline-none transition-all`} placeholder="নমিনির এনআইডি নম্বর" />
              <ErrorText field="nomineeNid" />
            </div>
          </div>
        </AccordionSection>
      </div>
    );
  };

  const renderFileUploader = (id: string, title: string) => {
    const isUploading = uploadingDoc === id;
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
            const url = await uploadDocument(file, user.id, id);
            if (url) {
              setDocuments(prev => ({ ...prev, [id]: url }));
            } else {
              toast.error(isBn ? 'ফাইল আপলোড ব্যর্থ হয়েছে' : 'File upload failed');
            }
            setUploadingDoc(null);
          }}
        />
        <label 
          htmlFor={isUploading ? undefined : `file-${id}`}
          className={`w-full bg-gray-50 dark:bg-gray-900 transition-colors border-2 ${documents[id] ? 'border-solid border-green-500' : 'border-dashed border-gray-200 dark:border-gray-700'} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-colors cursor-pointer text-center block ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
           <div className={`w-10 h-10 ${documents[id] ? 'bg-green-100 dark:bg-green-900' : 'bg-white dark:bg-gray-800'} transition-colors rounded-full flex items-center justify-center shadow-sm mx-auto`}>
             {isUploading ? (
               <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
             ) : documents[id] ? (
               <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
             ) : (
               <UploadCloud size={18} className="text-gray-500 dark:text-gray-400" />
             )}
           </div>
           <span className="text-xs font-bold text-gray-600 dark:text-gray-300 text-center leading-tight block">{title}</span>
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
        <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-850 dark:text-amber-300 p-4.5 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs font-semibold leading-relaxed flex gap-3 transition-colors mb-4 animate-pulse">
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
      <div className={`bg-white dark:bg-gray-800 transition-colors rounded-2xl border ${flaggedSections.documents ? 'border-amber-400 ring-2 ring-amber-500/20 shadow-md' : 'border-gray-100 dark:border-gray-700'} p-4.5 shadow-sm space-y-4`}>
        <h3 className="font-bold text-gray-805 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2">{isBn ? "পরিচয়পত্র ও ছবি" : "Identity Documents & Photos"}</h3>
        
        {/* Upload Slot Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {renderFileUploader("nid_front", isBn ? "NID সামনের অংশ" : "NID Front")}
          {renderFileUploader("nid_back", isBn ? "NID পেছনের অংশ" : "NID Back")}
          {renderFileUploader("selfie", isBn ? "সেলফি (NID সহ)" : "Selfie (with NID)")}
          {renderFileUploader("photo", isBn ? "পাসপোর্ট সাইজ ছবি" : "Passport Size Photo")}
        </div>
        <div className="mt-3.5 border-t border-gray-100 dark:border-gray-700/50 pt-3.5">
          {renderFileUploader("nominee_photo", isBn ? "নমিনির ছবি (ঐচ্ছিক)" : "Nominee Photo (Optional)")}
        </div>
      </div>

      {/* Income Proofs Block */}
      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors p-4.5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-805 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-gray-700 transition-colors pb-2">
          {isBn ? "আয়ের প্রমাণপত্র" : "Income Proof"} ({category?.title})
        </h3>
        <div className="grid grid-cols-1 gap-3.5">
          {category?.id === 'personal' && (
            <>
              {renderFileUploader("office_id", isBn ? "অফিস আইডি কার্ড (Job ID)" : "Office ID Card")}
              {renderFileUploader("salary_cert", isBn ? "বেতনের প্রমাণপত্র (Salary Certificate)" : "Salary Certificate")}
              {renderFileUploader("appointment_letter", isBn ? "অ্যাপয়েন্টমেন্ট লেটার (Appointment Letter)" : "Appointment Letter")}
            </>
          )}

          {(category?.id === 'business' || category?.id === 'women') && (
            <>
              {renderFileUploader("trade_license", isBn ? "ট্রেড লাইসেন্স কপি (Trade License Copy)" : "Trade License Copy")}
              {renderFileUploader("shop_photo", isBn ? "দোকান/প্রতিষ্ঠানের ছবি" : "Shop/Institution Photo")}
              {renderFileUploader("business_docs", isBn ? "ব্যবসায়িক অন্যান্য ডকুমেন্টস" : "Business Documents")}
            </>
          )}

          {category?.id === 'expat' && (
            <>
              {renderFileUploader("passport_copy", isBn ? "পাসপোর্ট কপি (Passport Copy)" : "Passport Copy")}
              {renderFileUploader("visa_copy", isBn ? "ভিসা কপি (Visa Copy)" : "Visa Copy")}
              {renderFileUploader("work_permit", isBn ? "ওয়ার্ক পারমিট / ওভারসিস আইডি" : "Work Permit / Overseas ID")}
            </>
          )}

          {category?.id === 'student' && (
            <>
              {renderFileUploader("student_id", isBn ? "স্টুডেন্ট আইডি কার্ড" : "Student ID Card")}
              {renderFileUploader("guardian_nid", isBn ? "অভিভাবকের NID কপি" : "Guardian's NID Copy")}
              {renderFileUploader("guardian_income", isBn ? "অভিভাবকের আয়ের প্রমাণপত্র" : "Guardian's Income Proof")}
            </>
          )}

          {category?.id === 'emergency' && (
            <>
              {renderFileUploader("income_proof", isBn ? "আয়ের প্রমাণপত্র / ব্যাংক স্টেটমেন্ট" : "Income Proof / Bank Statement")}
              {renderFileUploader("emergency_docs", isBn ? "মেডিকেল বা জরুরি ডকুমেন্টস (যদি থাকে)" : "Medical or Emergency Documents (if any)")}
            </>
          )}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/40 flex items-start gap-3 transition-colors">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-normal font-medium">
          {isBn ? "অতিরিক্ত ডকুমেন্টস (যেমন: TIN Certificate, Utility Bill) এডমিন আপনার প্রোফাইল যাচাই করার পর সাবমিট করতে হতে পারে।" : "Additional documents (e.g. TIN, Utility Bill) may be required after admin reviews your profile."}
        </p>
      </div>

      {/* Review Details Summary Card */}
      <div className="bg-white dark:bg-gray-800 transition-colors rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors shadow-sm overflow-hidden mt-4">
        <div className="bg-gray-50 dark:bg-gray-900 transition-colors p-4 border-b border-gray-100 dark:border-gray-700 transition-colors flex justify-between items-center">
          <div className="flex items-center gap-2">
            {category?.icon && <category.icon size={18} className="text-gray-500" />}
            <span className="font-bold text-sm text-gray-850 dark:text-gray-200">{category?.title} লোন</span>
          </div>
          <span className="text-xs font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full">New</span>
        </div>
        
        <div className="p-4 divide-y divide-gray-50 dark:divide-gray-700/50">
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
      <label htmlFor="acceptedTerms" className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 transition-colors rounded-2xl border border-gray-200 dark:border-gray-750 cursor-pointer group mt-4">
        <div className="pt-0.5">
          <input 
            id="acceptedTerms"
            type="checkbox" 
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-650 dark:text-gray-400 font-medium leading-relaxed">
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
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 dark:text-green-400 ring-8 ring-green-50/50 dark:ring-green-950/20">
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white transition-colors mb-2">{isBn ? "আবেদন সফল!" : "Application Successful!"}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{isBn ? "আপনার আবেদনটি পর্যালোচনার জন্য পাঠানো হয়েছে।" : "Your application has been submitted for review."}</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 transition-colors rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-left max-w-xs mx-auto">
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{isBn ? "ট্র্যাকিং আইডি" : "Tracking ID"}</p>
        <p className="text-lg font-mono font-black text-gray-900 dark:text-white transition-colors mb-4">#LN-{(Math.random()*100000).toFixed(0).padStart(6,'0')}</p>
        
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{isBn ? "বর্তমান স্ট্যাটাস" : "Current Status"}</p>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
           <p className="font-bold text-amber-600 text-sm">{isBn ? "রিভিউ চলছে" : "Under Review"}</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-left mt-6 flex gap-3 transition-colors">
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
          className="w-full block bg-primary-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 hover:-translate-y-0.5 active:scale-95 transition-all text-sm"
        >
          {isBn ? "প্রসেসিং ফি জমা দিন" : "Deposit Processing Fee"}
        </Link>
        <Link 
          to={`/support?prefill=loan_apply&cat=${category?.id}&amount=${amount}`}
          className="w-full block bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-750 font-bold py-4 rounded-xl active:scale-95 transition-all text-sm"
        >
          {isBn ? "লাইভ সাপোর্ট চ্যাট" : "Contact Live Support"}
        </Link>
        <Link 
          to="/transactions" 
          className="w-full block bg-gray-900 dark:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-900/20 active:scale-95 transition-all text-sm"
        >
          {isBn ? "ট্র্যাকিং পেজে যান" : "Go to Tracking Page"}
        </Link>
      </div>
    </motion.div>
  );

  return (
    <FormProvider {...methods}>
    <div className="min-h-full bg-white dark:bg-gray-800 transition-colors flex flex-col relative">
      {/* Dynamic Header */}
      {step < 5 && (
        <div className="bg-white dark:bg-gray-800 transition-colors px-5 pt-6 pb-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
           {step > 1 ? (
             <button onClick={prevStep} className="p-2 -ml-2 rounded-full bg-gray-50 dark:bg-gray-900 transition-colors hover:bg-gray-100 text-gray-700 transition-colors">
               <ChevronLeft size={20} />
             </button>
           ) : (
             <div className="w-8"></div>
           )}
           
           <div className="flex flex-col items-center">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Step {step} of 4</p>
             <div className="flex gap-1 h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 className="bg-primary-500 h-full rounded-full"
                 initial={{ width: 0 }}
                 animate={{ width: `${(step / 4) * 100}%` }}
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
      {step < 5 && (
        <div className="sticky bottom-0 left-0 right-0 px-4 py-3 bg-white dark:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700 z-40 flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95 transition-all shrink-0"
            >
              <ChevronLeft size={16} /> {isBn ? 'পিছনে' : 'Back'}
            </button>
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={(step === 1 && !category) || (step === 4 && !acceptedTerms) || isSubmitting}
            className="flex-1 bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            {isSubmitting
              ? (isBn ? 'অপেক্ষা করুন...' : 'Please wait...')
              : step === 4
              ? (isBn ? 'সাবমিট করুন' : 'Submit')
              : (isBn ? 'পরবর্তী ধাপ' : 'Next Step')
            }
            {!isSubmitting && <ChevronRight size={16} />}
          </button>
        </div>
      )}

      {/* Smart Review System Modal Overlay */}
      {verificationStage !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl border border-gray-150 dark:border-gray-700 overflow-hidden my-8"
          >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4.5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-primary-600 dark:text-primary-400" size={20} />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {isBn ? 'স্মার্ট আবেদন যাচাইকরণ' : 'Smart Application Review'}
                </h3>
              </div>
              {(verificationStage === 'confirm' || verificationStage === 'failed') && (
                <button 
                  onClick={handleCloseVerification}
                  className="text-gray-400 hover:text-gray-650 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
              {/* STAGE 1: Confirmation & Warnings checklist */}
              {verificationStage === 'confirm' && (
                <>
                  <div className="bg-primary-50/50 dark:bg-primary-950/10 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-900/30 space-y-2.5">
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                      {isBn ? 'লোন ও আবেদনকারী সারসংক্ষেপ' : 'Loan & Applicant Summary'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'ঋণ ক্যাটাগরি' : 'Category'}</span>
                        <span className="font-bold text-gray-805 dark:text-gray-200 capitalize">{category?.title}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'ঋণের পরিমাণ' : 'Amount'}</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(amount, isBn)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">{isBn ? 'সময়কাল' : 'Tenure'}</span>
                        <span className="font-bold text-gray-805 dark:text-gray-200">{convertDigits(tenure, isBn)} {isBn ? 'মাস' : 'Months'}</span>
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
                      <label htmlFor="checkAntiFraud" className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700 cursor-pointer group">
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
                      <label htmlFor="checkNoRefund" className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700 cursor-pointer group">
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
                      <label htmlFor="checkSavingsRule" className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700 cursor-pointer group">
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
                      <label htmlFor="checkEmiObligation" className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700 cursor-pointer group">
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
                      className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button 
                      disabled={!checkAntiFraud || !checkNoRefund || !checkSavingsRule || !checkEmiObligation}
                      onClick={processSmartVerification}
                      className="flex-1 py-3 rounded-xl font-bold bg-primary-600 disabled:bg-gray-200 disabled:text-gray-400 text-white hover:bg-primary-700 transition-colors shadow shadow-primary-500/10 cursor-pointer"
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
                    <div className="w-20 h-20 bg-white/10 dark:bg-gray-900/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20">
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
                  <div className="text-left space-y-3.5 bg-gray-50 dark:bg-gray-900/50 p-4.5 rounded-2xl border border-gray-150 dark:border-gray-750">
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
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-500 ring-8 ring-green-50 dark:ring-green-950/20">
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
                    <h4 className="text-lg font-black text-rose-600 dark:text-rose-450">
                      {isBn ? 'যাচাইকরণ ব্যর্থ!' : 'Verification Failed'}
                    </h4>
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-left mt-4 text-[11px] leading-relaxed font-semibold">
                      <p className="flex items-center gap-1 mb-1 font-black uppercase tracking-wider text-[9px]"><AlertCircle size={12} /> {isBn ? 'ব্যর্থতার কারণ:' : 'Error details:'}</p>
                      {verifyingError}
                    </div>
                  </div>

                  <button 
                    onClick={handleCloseVerification}
                    className="w-full py-3.5 rounded-xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 transition-colors shadow cursor-pointer"
                  >
                    {isBn ? 'তথ্য সংশোধন করতে ফিরে যান' : 'Go Back to Edit Details'}
                  </button>
                </div>
              )}
            </div>
            </motion.div>
          </div>
        )}
      {/* Local Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden text-gray-800 dark:text-gray-250">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-gray-150 dark:border-gray-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-gray-50 dark:bg-gray-950 px-6 py-4.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-600 dark:text-primary-400" size={20} />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {isBn ? 'নীতিমালা ও শর্তাবলী' : 'Policies & Terms'}
                </h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-650 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-650 dark:text-gray-300 leading-relaxed">
              {/* 1. Terms & Conditions */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-100 dark:border-gray-800">
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
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-100 dark:border-gray-800">
                  <ShieldAlert className="text-primary-500" size={16} />
                  {isBn ? '২. ঋণ নির্দেশিকা' : '2. Loan Guidelines'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5">
                    <p>ঋণ পাওয়ার জন্য আবেদনকারীকে তার পেশা অনুযায়ী সঠিক ক্যাটাগরি নির্বাচন করতে হবে। প্রতিটি ক্যাটাগরির জন্য ঋণের সর্বোচ্চ সীমা এবং মাসিক সুদের হার আলাদা হতে পারে:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><b>ব্যক্তিগত লোন (Personal):</b> সর্বোচ্চ ৫,০০,০০০ টাকা। মাসিক সুদ ১.২%।</li>
                      <li><b>ব্যবসায়িক লোন (Business):</b> সর্বোচ্চ ৫০,০০,০০০ টাকা। মাসিক সুদ ১.৫%।</li>
                      <li><b>প্রবাসী লোন (Expat):</b> সর্বোচ্চ ১০,০০,০০০ টাকা। মাসিক সুদ ১.০%।</li>
                      <li><b>শিক্ষা লোন (Student):</b> সর্বোচ্চ ৫,০০,০০০ টাকা। মাসিক সুদ ০.৮%।</li>
                      <li><b>জরুরি লোন (Emergency):</b> সর্বোচ্চ ১,০০,০০০ টাকা। মাসিক সুদ ২.০%।</li>
                      <li><b>মহিলা উদ্যোক্তা লোন (Women):</b> সর্বোচ্চ ২০,০০,০০০ টাকা। মাসিক সুদ ০.৮%।</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p>Applicants must select the appropriate category matching their profession. Loan limits and interest rates are defined as follows:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><b>Personal Loan:</b> up to BDT 500,000. Monthly rate 1.2%.</li>
                      <li><b>Business Loan:</b> up to BDT 5,000,000. Monthly rate 1.5%.</li>
                      <li><b>Expat Loan:</b> up to BDT 1,000,000. Monthly rate 1.0%.</li>
                      <li><b>Student Loan:</b> up to BDT 500,000. Monthly rate 0.8%.</li>
                      <li><b>Emergency Loan:</b> up to BDT 100,000. Monthly rate 2.0%.</li>
                      <li><b>Women Entrepreneur Loan:</b> up to BDT 2,000,000. Monthly rate 0.8%.</li>
                    </ul>
                  </div>
                )}
              </section>

              {/* 3. Important Notices */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-100 dark:border-gray-800">
                  <AlertCircle className="text-amber-500" size={16} />
                  {isBn ? '৩. গুরুত্বপূর্ণ নোটিশ' : '3. Important Notices'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-amber-850 dark:text-amber-300 font-medium">
                    <p className="font-bold">প্রসেসিং ফি বাধ্যতামুলক:</p>
                    <p>ঋণ আবেদন প্রসেস করার জন্য নির্ধারিত "প্রসেসিং ফি" ডিপোজিট করা বাধ্যতামূলক। ফি প্রদান ছাড়া কোনো আবেদন রিভিউর আওতায় নেওয়া হবে না এবং এটি সম্পূর্ণ অফেরতযোগ্য।</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-amber-850 dark:text-amber-300 font-medium">
                    <p className="font-bold">Processing Fee is Mandatory:</p>
                    <p>To begin evaluating your loan profile, the processing fee must be deposited. Unpaid files will not be reviewed. Processing fees are non-refundable.</p>
                  </div>
                )}
              </section>

              {/* 4. Savings & Deposit Policies */}
              <section className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm border-b pb-1 border-gray-100 dark:border-gray-800">
                  <Landmark className="text-primary-500" size={16} />
                  {isBn ? '৪. সঞ্চয় ও ডিপোজিট নীতিমালা' : '4. Savings & Deposit Policies'}
                </h4>
                {isBn ? (
                  <div className="space-y-1.5">
                    <p><b>• প্রসেসিং ফি:</b> ৫০,০০০ থেকে ১০,০০,০০০ টাকা পর্যন্ত লোন আবেদনের ক্ষেত্রে ১% প্রসেসিং ফি এবং ১০,০০,০০০ টাকার ওপরে হলে ০.৫% প্রসেসিং ফি প্রযোজ্য।</p>
                    <p><b>• সঞ্চয় আমানত:</b> সমবায় আমানত সুরক্ষার্থে ৫০,০০০ থেকে ৫,০০,০০০ টাকা ঋণের জন্য ১০% সঞ্চয় এবং ৫,০০,০০০ টাকার ওপরে হলে ৫% সঞ্চয় ডিপোজিট করা বাধ্যতামূলক।</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p><b>• Processing Fee:</b> BDT 50k to BDT 1M requires 1% processing fee. BDT 1M+ requires 0.5% processing fee.</p>
                    <p><b>• Savings Deposit:</b> BDT 50k to BDT 500k loans require a 10% savings deposit. BDT 500k+ loans require a 5% savings deposit.</p>
                  </div>
                )}
              </section>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end shrink-0">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow cursor-pointer text-xs"
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
