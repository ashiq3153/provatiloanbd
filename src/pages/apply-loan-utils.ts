import {
  Briefcase,
  Store,
  Plane,
  GraduationCap,
  AlertCircle,
  Award
} from "lucide-react";
import { convertDigits } from "../lib/translation";
import personalImg from "../assets/categories/personal.png";
import businessImg from "../assets/categories/business.png";
import expatImg from "../assets/categories/expat.png";
import studentImg from "../assets/categories/student.png";
import emergencyImg from "../assets/categories/emergency.png";
import womenImg from "../assets/categories/women.png";

const getLimitText = (amount: number, isBn: boolean) => {
  if (amount >= 10000000) {
    const crore = amount / 10000000;
    return isBn ? `${convertDigits(crore.toString(), true)} কোটি` : `${crore} Crore`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return isBn ? `${convertDigits(lakhs.toString(), true)} লক্ষ` : `${lakhs} Lac`;
  }
  const thousands = amount / 1000;
  return isBn ? `${convertDigits(thousands.toString(), true)} হাজার` : `${thousands}k`;
};

const getTenureText = (min: number, max: number, isBn: boolean) => {
  return isBn ? `${convertDigits(min.toString(), true)}-${convertDigits(max.toString(), true)} মাস` : `${min}-${max} months`;
};

export const getCategories = (isBn: boolean, settings?: any) => [
  {
    id: "personal",
    title: isBn ? "ব্যক্তিগত" : "Personal",
    icon: Briefcase,
    image: personalImg,
    limit: getLimitText(settings?.categories?.personal?.maxAmount ?? 500000, isBn),
    maxAmount: settings?.categories?.personal?.maxAmount ?? 500000,
    minTenure: settings?.categories?.personal?.minTenure ?? 12,
    maxTenure: settings?.categories?.personal?.maxTenure ?? 60,
    tenureRange: getTenureText(settings?.categories?.personal?.minTenure ?? 12, settings?.categories?.personal?.maxTenure ?? 60, isBn),
    intRates: settings?.minRatePersonal ? convertDigits(`${(settings.minRatePersonal * 100).toFixed(2)}%`, isBn) : (isBn ? "০.৫৫%" : "0.55%"),
    procTime: isBn ? "২-৩ দিন" : "2-3 days",
    color: "blue",
    features: isBn ? ["যেকোনো প্রয়োজনে", "সহজ কিস্তি"] : ["Any purpose", "Easy EMI"],
    minRate: settings?.minRatePersonal ?? 0.0055,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "business",
    title: isBn ? "ব্যবসায়ী" : "Business",
    icon: Store,
    image: businessImg,
    limit: getLimitText(settings?.categories?.business?.maxAmount ?? 5000000, isBn),
    maxAmount: settings?.categories?.business?.maxAmount ?? 5000000,
    minTenure: settings?.categories?.business?.minTenure ?? 12,
    maxTenure: settings?.categories?.business?.maxTenure ?? 120,
    tenureRange: getTenureText(settings?.categories?.business?.minTenure ?? 12, settings?.categories?.business?.maxTenure ?? 120, isBn),
    intRates: settings?.minRateBusiness ? convertDigits(`${(settings.minRateBusiness * 100).toFixed(2)}%`, isBn) : (isBn ? "০.৫৫%" : "0.55%"),
    procTime: isBn ? "৩-৫ দিন" : "3-5 days",
    color: "green",
    features: isBn ? ["ব্যবসা সম্প্রসারণ", "সহজ শর্ত"] : ["Business Expansion", "Easy Terms"],
    minRate: settings?.minRateBusiness ?? 0.0055,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "expat",
    title: isBn ? "প্রবাসী" : "Probashi",
    icon: Plane,
    image: expatImg,
    limit: getLimitText(settings?.categories?.expat?.maxAmount ?? 1000000, isBn),
    maxAmount: settings?.categories?.expat?.maxAmount ?? 1000000,
    minTenure: settings?.categories?.expat?.minTenure ?? 24,
    maxTenure: settings?.categories?.expat?.maxTenure ?? 72,
    tenureRange: getTenureText(settings?.categories?.expat?.minTenure ?? 24, settings?.categories?.expat?.maxTenure ?? 72, isBn),
    intRates: settings?.minRateExpat ? convertDigits(`${(settings.minRateExpat * 100).toFixed(2)}%`, isBn) : (isBn ? "০.৫০%" : "0.50%"),
    procTime: isBn ? "১-২ দিন" : "1-2 days",
    color: "purple",
    features: isBn ? ["দ্রুত অনুমোদন", "অনলাইন আবেদন সুবিধা"] : ["Fast Approval", "Online Apply"],
    minRate: settings?.minRateExpat ?? 0.005,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "student",
    title: isBn ? "শিক্ষার্থী" : "Student",
    icon: GraduationCap,
    image: studentImg,
    limit: getLimitText(settings?.categories?.student?.maxAmount ?? 500000, isBn),
    maxAmount: settings?.categories?.student?.maxAmount ?? 500000,
    minTenure: settings?.categories?.student?.minTenure ?? 12,
    maxTenure: settings?.categories?.student?.maxTenure ?? 48,
    tenureRange: getTenureText(settings?.categories?.student?.minTenure ?? 12, settings?.categories?.student?.maxTenure ?? 48, isBn),
    intRates: settings?.minRateStudent ? convertDigits(`${(settings.minRateStudent * 100).toFixed(2)}%`, isBn) : (isBn ? "০.৫০%" : "0.50%"),
    procTime: isBn ? "২-৩ দিন" : "2-3 days",
    color: "orange",
    features: isBn ? ["শিক্ষা লোন", "সর্বনিম্ন ফি"] : ["Education Loan", "Low Fees"],
    minRate: settings?.minRateStudent ?? 0.005,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "emergency",
    title: isBn ? "জরুরি ঋণ" : "Emergency",
    icon: AlertCircle,
    image: emergencyImg,
    limit: getLimitText(settings?.categories?.emergency?.maxAmount ?? 100000, isBn),
    maxAmount: settings?.categories?.emergency?.maxAmount ?? 100000,
    minTenure: settings?.categories?.emergency?.minTenure ?? 6,
    maxTenure: settings?.categories?.emergency?.maxTenure ?? 24,
    tenureRange: getTenureText(settings?.categories?.emergency?.minTenure ?? 6, settings?.categories?.emergency?.maxTenure ?? 24, isBn),
    intRates: settings?.minRateEmergency ? convertDigits(`${(settings.minRateEmergency * 100).toFixed(2)}%`, isBn) : (isBn ? "০.৬০%" : "0.60%"),
    procTime: isBn ? "২-৬ ঘণ্টা" : "2-6 hours",
    color: "rose",
    features: isBn ? ["তাৎক্ষণিক অনুমোদন", "চিকিৎসা বা জরুরি"] : ["Instant Approval", "Medical/Emergency"],
    minRate: settings?.minRateEmergency ?? 0.006,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  },
  {
    id: "women",
    title: isBn ? "নারী উদ্যোক্তা" : "Women Entrepreneur",
    icon: Award,
    image: womenImg,
    limit: getLimitText(settings?.categories?.women?.maxAmount ?? 2000000, isBn),
    maxAmount: settings?.categories?.women?.maxAmount ?? 2000000,
    minTenure: settings?.categories?.women?.minTenure ?? 12,
    maxTenure: settings?.categories?.women?.maxTenure ?? 84,
    tenureRange: getTenureText(settings?.categories?.women?.minTenure ?? 12, settings?.categories?.women?.maxTenure ?? 84, isBn),
    intRates: settings?.minRateWomen ? convertDigits(`${(settings.minRateWomen * 100).toFixed(2)}%`, isBn) : (isBn ? "০.৫৫%" : "0.55%"),
    procTime: isBn ? "৩-৫ দিন" : "3-5 days",
    color: "pink",
    features: isBn ? ["বিশেষ রেট", "সরকারি সুবিধা"] : ["Special Rate", "Govt Benefits"],
    minRate: settings?.minRateWomen ?? 0.0055,
    procFee: settings?.procFee ?? 0.01,
    secDeposit: settings?.secDeposit ?? 0.1,
  }
];

export const snapPoints = [12, 24, 36, 48, 60, 72, 84, 96, 120, 144, 180];
export const amountPackages = [
  50000, 100000, 150000, 200000, 300000, 500000, 700000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000
];

export const formatAmount = (num: number, isBn: boolean) => {
  if (num >= 100000) return isBn ? `৳ ${convertDigits((num / 100000).toString(), true)} লাখ` : `৳ ${(num / 100000).toString()} Lac`;
  return isBn ? `৳ ${convertDigits((num / 1000).toString(), true)} হাজার` : `৳ ${(num / 1000).toString()}k`;
};

export const getAllowedTenure = (amount: number) => {
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

export const getColorStyles = (color: string, isActive: boolean) => {
  const base = "transition-all duration-200 border-2 ";
  if (!isActive) return base + "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600";
  switch (color) {
    case "blue": return base + "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md shadow-blue-500/20";
    case "green": return base + "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/20";
    case "purple": return base + "border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 shadow-md shadow-purple-500/20";
    case "orange": return base + "border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-md shadow-orange-500/20";
    case "rose": return base + "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 shadow-md shadow-rose-500/20";
    case "pink": return base + "border-pink-500 bg-pink-50/50 dark:bg-pink-900/20 shadow-md shadow-pink-500/20";
    default: return base + "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-md shadow-primary-500/20";
  }
};

export const getIconColor = (color: string) => {
  switch (color) {
    case "blue": return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
    case "green": return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";
    case "purple": return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
    case "orange": return "text-orange-500 bg-orange-100 dark:bg-orange-900/30";
    case "rose": return "text-rose-500 bg-rose-100 dark:bg-rose-900/30";
    case "pink": return "text-pink-500 bg-pink-100 dark:bg-pink-900/30";
    default: return "text-primary-500 bg-primary-100 dark:bg-primary-900/30";
  }
};
