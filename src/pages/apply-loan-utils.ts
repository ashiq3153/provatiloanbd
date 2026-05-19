import {
  Briefcase,
  Store,
  Plane,
  GraduationCap,
  AlertCircle,
  Award
} from "lucide-react";
import { convertDigits } from "../lib/translation";

export const getCategories = (isBn: boolean, settings?: any) => [
  {
    id: "personal",
    title: isBn ? "চাকরিজীবী" : "Salaried",
    icon: Briefcase,
    limit: isBn ? "৫ লক্ষ" : "5 Lac",
    maxAmount: 500000,
    tenureRange: isBn ? "১২-৬০ মাস" : "12-60 months",
    intRates: settings?.minRatePersonal ? convertDigits(`${(settings.minRatePersonal * 100).toFixed(1)}% - ${(settings.minRatePersonal * 100 + 0.8).toFixed(1)}%`, isBn) : (isBn ? "১.২% - ২.০%" : "1.2% - 2.0%"),
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
    intRates: settings?.minRateBusiness ? convertDigits(`${(settings.minRateBusiness * 100).toFixed(1)}% - ${(settings.minRateBusiness * 100 + 1.0).toFixed(1)}%`, isBn) : (isBn ? "১.৫% - ২.৫%" : "1.5% - 2.5%"),
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
    intRates: settings?.minRateExpat ? convertDigits(`${(settings.minRateExpat * 100).toFixed(1)}% - ${(settings.minRateExpat * 100 + 0.8).toFixed(1)}%`, isBn) : (isBn ? "১.০% - ১.৮%" : "1.0% - 1.8%"),
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
    intRates: settings?.minRateStudent ? convertDigits(`${(settings.minRateStudent * 100).toFixed(1)}% - ${(settings.minRateStudent * 100 + 0.4).toFixed(1)}%`, isBn) : (isBn ? "০.৮% - ১.২%" : "0.8% - 1.2%"),
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
    intRates: settings?.minRateEmergency ? convertDigits(`${(settings.minRateEmergency * 100).toFixed(1)}% - ${(settings.minRateEmergency * 100 + 1.0).toFixed(1)}%`, isBn) : (isBn ? "২.০% - ৩.০%" : "2.0% - 3.0%"),
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
    intRates: settings?.minRateWomen ? convertDigits(`${(settings.minRateWomen * 100).toFixed(1)}% - ${(settings.minRateWomen * 100 + 0.7).toFixed(1)}%`, isBn) : (isBn ? "০.৮% - ১.৫%" : "0.8% - 1.5%"),
    procTime: isBn ? "৩-৫ দিন" : "3-5 days",
    color: "pink",
    features: isBn ? ["বিশেষ রেট", "সরকারি সুবিধা"] : ["Special Rate", "Govt Benefits"],
    minRate: settings?.minRateWomen ?? 0.008,
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
