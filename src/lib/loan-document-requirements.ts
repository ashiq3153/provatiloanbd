export type LoanCategoryId = "personal" | "business" | "women" | "expat" | "student" | "emergency";

export type DocumentRequirement = {
  key: string;
  labelBn: string;
  labelEn: string;
  required: boolean;
  conditional?: boolean;
  mapsTo: string[];
};

// Only documents marked required are shown on a new application.
// Optional documents remain in this catalogue for application-specific admin requests.
const identity: DocumentRequirement[] = [
  { key: "nid_front", labelBn: "জাতীয় পরিচয়পত্রের সামনের অংশ", labelEn: "National ID — front side", required: true, mapsTo: ["fullName", "nidNumber", "dob", "gender"] },
  { key: "nid_back", labelBn: "জাতীয় পরিচয়পত্রের পেছনের অংশ", labelEn: "National ID — back side", required: true, mapsTo: ["nidNumber", "address"] },
  { key: "selfie", labelBn: "জাতীয় পরিচয়পত্র হাতে সেলফি", labelEn: "Selfie holding your National ID", required: true, mapsTo: [] },
  { key: "photo", labelBn: "আবেদনকারীর পাসপোর্ট সাইজ ছবি", labelEn: "Applicant passport-size photo", required: true, mapsTo: [] },
  { key: "nominee_nid_front", labelBn: "নমিনির NID-এর সামনের অংশ", labelEn: "Nominee NID — front side", required: true, mapsTo: ["nomineeNid"] },
  { key: "nominee_nid_back", labelBn: "নমিনির NID-এর পেছনের অংশ", labelEn: "Nominee NID — back side", required: true, mapsTo: ["nomineeNid"] },
  { key: "nominee_photo", labelBn: "নমিনির ছবি", labelEn: "Nominee photo", required: true, mapsTo: [] },
];

const optionalIdentity: DocumentRequirement[] = [
  { key: "passport_copy", labelBn: "পাসপোর্ট কপি (যদি থাকে)", labelEn: "Passport copy (if available)", required: false, conditional: true, mapsTo: ["passportNumber"] },
  { key: "utility_bill", labelBn: "বর্তমান বাসার ইউটিলিটি বিল", labelEn: "Current home utility bill", required: false, conditional: true, mapsTo: ["currentAddress"] },
  { key: "income_proof", labelBn: "আয়ের প্রমাণ (বেতন স্লিপ/আয়ের সনদ/গ্রহণযোগ্য প্রমাণ)", labelEn: "Income proof (payslip, income letter or accepted alternative)", required: false, conditional: true, mapsTo: ["monthlyIncome"] },
  { key: "bank_statement", labelBn: "ব্যাংক স্টেটমেন্ট", labelEn: "Bank statement", required: false, conditional: true, mapsTo: ["bankName", "accountName", "accountNumber", "monthlyIncome"] },
  { key: "etin_cert", labelBn: "ই-টিআইএন সনদ/আয়কর রিটার্ন", labelEn: "e-TIN certificate or tax return", required: false, conditional: true, mapsTo: ["eTin"] },
];

export const LOAN_DOCUMENT_REQUIREMENTS: Record<LoanCategoryId, DocumentRequirement[]> = {
  personal: [
    ...identity,
    { key: "income_proof", labelBn: "আয়ের প্রমাণ (বেতন স্লিপ/আয়ের সনদ/বিকল্প প্রমাণ)", labelEn: "Income proof (payslip, income letter or accepted alternative)", required: true, mapsTo: ["monthlyIncome"] },
    ...optionalIdentity.filter(item => item.key !== "income_proof"),
    { key: "office_id", labelBn: "প্রতিষ্ঠানের পরিচয়পত্র", labelEn: "Work ID card", required: false, conditional: true, mapsTo: ["companyName", "designation"] },
    { key: "hr_noc", labelBn: "নিয়োগকর্তার প্রত্যয়নপত্র বা NOC", labelEn: "Employer letter or No Objection Certificate", required: false, conditional: true, mapsTo: ["companyName", "designation", "hrName", "hrDesignation"] },
    { key: "salary_statement", labelBn: "গত ৬ মাসের বেতন বিবরণী", labelEn: "Salary records for the last 6 months", required: false, conditional: true, mapsTo: ["basicSalary", "netTakeHomePay", "monthlyIncome"] },
    { key: "guarantor1_nid", labelBn: "গ্যারান্টর ১-এর NID", labelEn: "Guarantor 1 NID", required: false, conditional: true, mapsTo: ["g1Name", "g1Nid", "g1Mobile", "g1Address"] },
    { key: "guarantor1_photo", labelBn: "গ্যারান্টর ১-এর ছবি", labelEn: "Guarantor 1 photo", required: false, conditional: true, mapsTo: [] },
    { key: "guarantor1_income", labelBn: "গ্যারান্টর ১-এর আয়/ব্যাংক প্রমাণ", labelEn: "Guarantor 1 income/bank proof", required: false, conditional: true, mapsTo: ["g1Profession"] },
    { key: "guarantor2_nid", labelBn: "গ্যারান্টর ২-এর NID", labelEn: "Guarantor 2 NID", required: false, conditional: true, mapsTo: ["g2OfficialId", "g2Mobile"] },
    { key: "guarantor2_photo", labelBn: "গ্যারান্টর ২-এর ছবি", labelEn: "Guarantor 2 photo", required: false, conditional: true, mapsTo: [] },
    { key: "guarantor2_income", labelBn: "গ্যারান্টর ২-এর আয়/ব্যাংক প্রমাণ", labelEn: "Guarantor 2 income/bank proof", required: false, conditional: true, mapsTo: [] },
  ],
  business: [
    ...identity,
    { key: "business_proof", labelBn: "ব্যবসার প্রমাণ (ট্রেড লাইসেন্স বা গ্রহণযোগ্য বিকল্প)", labelEn: "Business proof (trade licence or accepted alternative)", required: true, mapsTo: ["businessName", "tradeLicense"] },
    ...optionalIdentity,
    { key: "trade_license_3yrs", labelBn: "গত ৩ বছরের ট্রেড লাইসেন্স", labelEn: "Trade licences for the last 3 years", required: false, conditional: true, mapsTo: ["businessName", "tradeLicense", "tradeLicenseIssueDate"] },
    { key: "bank_statement_12m", labelBn: "গত ১২ মাসের ব্যাংক স্টেটমেন্ট", labelEn: "Bank statements for the last 12 months", required: false, conditional: true, mapsTo: ["bankName", "accountName", "accountNumber", "avgMonthlySales"] },
    { key: "premise_ownership_docs", labelBn: "ব্যবসার জায়গার মালিকানা/ভাড়ার দলিল", labelEn: "Business premise ownership deed/rent agreement", required: false, conditional: true, mapsTo: ["shopAddress", "factoryAddress"] },
    { key: "supplier_buyer_invoices", labelBn: "সাপ্লায়ার ও ক্রেতার ইনভয়েস", labelEn: "Supplier and buyer invoices", required: false, conditional: true, mapsTo: ["avgMonthlySales", "productType"] },
    { key: "company_formation_docs", labelBn: "MOA/AOA/পার্টনারশিপ ডিড", labelEn: "MOA/AOA/Partnership deed", required: false, conditional: true, mapsTo: ["rjscNumber", "applicantRole", "equityPercentage"] },
    { key: "audited_financials", labelBn: "অডিটেড ফাইন্যান্সিয়ালস (৩ বছর)", labelEn: "Audited financials (3 years)", required: false, conditional: true, mapsTo: ["cogs", "netProfitMargin", "accountsReceivable", "accountsPayable", "currentStockValue"] },
    { key: "director_kyc", labelBn: "ডিরেক্টর/পার্টনারদের KYC", labelEn: "Director/partner KYC", required: false, conditional: true, mapsTo: ["applicantRole", "eTin"] },
  ],
  women: [
    ...identity,
    { key: "business_proof", labelBn: "ব্যবসার প্রমাণ (ট্রেড লাইসেন্স বা গ্রহণযোগ্য বিকল্প)", labelEn: "Business proof (trade licence or accepted alternative)", required: true, mapsTo: ["businessName", "tradeLicense"] },
    ...optionalIdentity,
    { key: "women_trade_license", labelBn: "নারী উদ্যোক্তার নিজস্ব ট্রেড লাইসেন্স", labelEn: "Trade licence (self)", required: false, conditional: true, mapsTo: ["businessName", "tradeLicense"] },
    { key: "women_bank_statement", labelBn: "ব্যবসার ব্যাংক স্টেটমেন্ট (৬-১২ মাস)", labelEn: "Business bank statement (6-12 months)", required: false, conditional: true, mapsTo: ["bankName", "accountNumber", "avgMonthlySales"] },
    { key: "rjsc_shareholding", labelBn: "RJSC শেয়ারহোল্ডিং (প্রযোজ্য হলে)", labelEn: "RJSC shareholding (if applicable)", required: false, conditional: true, mapsTo: ["rjscNumber", "equityPercentage"] },
    { key: "ecommerce_proof", labelBn: "ই-কমার্স/F-commerce পেমেন্ট হিস্ট্রি", labelEn: "E-commerce/F-commerce proof", required: false, conditional: true, mapsTo: ["salesChannel", "avgMonthlySales"] },
    { key: "chamber_membership", labelBn: "চেম্বার/ই-ক্যাব মেম্বারশিপ (প্রযোজ্য হলে)", labelEn: "Chamber membership (if applicable)", required: false, conditional: true, mapsTo: [] },
  ],
  expat: [
    ...identity,
    { key: "passport_scan_pages", labelBn: "পাসপোর্টের পরিচয় পৃষ্ঠা ও প্রয়োজনীয় সিল", labelEn: "Passport identity page and relevant stamps", required: true, mapsTo: ["fullName", "passportNumber", "passportIssueDate", "passportExpiryDate"] },
    { key: "visa_iqama_copy", labelBn: "ওয়ার্ক ভিসা/ইকামা কপি", labelEn: "Work visa/Iqama copy", required: true, mapsTo: ["visaType", "iqamaNumber", "workingCountry"] },
    { key: "income_proof", labelBn: "আয়/চাকরির প্রমাণ", labelEn: "Income/employment proof", required: true, mapsTo: ["monthlyIncome"] },
    ...optionalIdentity.filter(item => item.key !== "income_proof"),
    { key: "employment_contract", labelBn: "বর্তমান চাকরির চুক্তিনামা", labelEn: "Employment contract", required: false, conditional: true, mapsTo: ["foreignCompanyName", "workerCategory", "monthlyIncome"] },
    { key: "bmet_card", labelBn: "BMET কার্ড", labelEn: "BMET card", required: false, conditional: true, mapsTo: ["workerCategory"] },
    { key: "remittance_statement_9m", labelBn: "রেমিট্যান্স স্টেটমেন্ট (৯ মাস)", labelEn: "Remittance statement (9 months)", required: false, conditional: true, mapsTo: ["avgMonthlyRemittance", "remittanceChannel", "receiverBankAccount"] },
    { key: "power_of_attorney", labelBn: "পাওয়ার অফ অ্যাটর্নি (প্রযোজ্য হলে)", labelEn: "Power of attorney (if applicable)", required: false, conditional: true, mapsTo: ["coApplicantName", "coApplicantRelation"] },
  ],
  student: [
    ...identity,
    { key: "academic_certificates", labelBn: "সর্বশেষ একাডেমিক সার্টিফিকেট/মার্কশিট", labelEn: "Latest academic certificate/mark sheet", required: true, mapsTo: ["sscGpa", "sscYear", "hscGpa", "hscYear", "gradCgpa", "gradYear"] },
    { key: "admission_letter", labelBn: "স্টুডেন্ট আইডি বা ভর্তি/অ্যাডমিশনের প্রমাণ", labelEn: "Student ID or admission proof", required: true, mapsTo: ["targetUniversity", "targetDepartment", "tuitionFee"] },
    { key: "sponsor_income_proof", labelBn: "অভিভাবক/স্পনসরের আয়ের প্রমাণ", labelEn: "Guardian/sponsor income proof", required: true, mapsTo: ["sponsorIncomeSource", "sponsorTaxableIncome"] },
    ...optionalIdentity,
    { key: "i20_cas_letter", labelBn: "I-20/CAS Letter (প্রযোজ্য হলে)", labelEn: "I-20/CAS letter (if applicable)", required: false, conditional: true, mapsTo: ["targetUniversity", "targetDepartment"] },
    { key: "english_proficiency", labelBn: "IELTS/TOEFL বা সমমান (প্রযোজ্য হলে)", labelEn: "English proficiency (if applicable)", required: false, conditional: true, mapsTo: ["courseRanking"] },
    { key: "sponsor_bank_statement_1yr", labelBn: "স্পনসরের ব্যাংক স্টেটমেন্ট (১ বছর)", labelEn: "Sponsor bank statement (1 year)", required: false, conditional: true, mapsTo: ["sponsorNetWorth", "sponsorIncomeSource"] },
    { key: "lien_property_fdr", labelBn: "লিয়েন/সম্পত্তি/FDR (যদি থাকে)", labelEn: "Lien property/FDR (if available)", required: false, conditional: true, mapsTo: ["sponsorNetWorth"] },
  ],
  emergency: [
    ...identity,
    { key: "diagnosis_report", labelBn: "রোগ নির্ণয়ের প্রতিবেদন ও চিকিৎসকের ব্যবস্থাপত্র", labelEn: "Medical diagnosis report and prescription", required: true, mapsTo: ["patientName", "patientCondition", "treatmentType", "hospitalName"] },
    { key: "cost_estimation_letter", labelBn: "জরুরি খরচের প্রাক্কলন/হাসপাতালের খরচের হিসাব", labelEn: "Estimated emergency/medical cost statement", required: true, mapsTo: ["estimatedCost", "shortfallAmount"] },
    ...optionalIdentity,
    { key: "admission_slip", labelBn: "ভর্তির টিকিট/রানিং বিল (যদি থাকে)", labelEn: "Admission slip/running bill (if available)", required: false, conditional: true, mapsTo: ["hospitalName", "estimatedCost"] },
    { key: "income_proof_quick", labelBn: "আয়ের অতিরিক্ত প্রমাণ", labelEn: "Additional income proof", required: false, conditional: true, mapsTo: ["monthlyIncome"] },
  ],
};

export function getLoanDocumentRequirements(category: string): DocumentRequirement[] {
  return LOAN_DOCUMENT_REQUIREMENTS[category as LoanCategoryId] || LOAN_DOCUMENT_REQUIREMENTS.personal;
}

export function getMissingRequiredDocuments(category: string, documents: Record<string, string>): DocumentRequirement[] {
  return getLoanDocumentRequirements(category).filter(doc => doc.required && !documents[doc.key]);
}

export function getDocumentFieldMap(category: string): Record<string, string[]> {
  return Object.fromEntries(getLoanDocumentRequirements(category).map(doc => [doc.key, doc.mapsTo]));
}
