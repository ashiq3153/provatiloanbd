export type LoanCategoryId = "personal" | "business" | "women" | "expat" | "student" | "emergency";

export type DocumentRequirement = {
  key: string;
  labelBn: string;
  labelEn: string;
  required: boolean;
  conditional?: boolean;
  mapsTo: string[];
};

const identity: DocumentRequirement[] = [
  { key:"nid_front", labelBn:"NID সামনের অংশ", labelEn:"NID Front", required:true, mapsTo:["fullName","nidNumber","dob","gender"] },
  { key:"nid_back", labelBn:"NID পেছনের অংশ", labelEn:"NID Back", required:true, mapsTo:["nidNumber","address"] },
  { key:"selfie", labelBn:"সেলফি (NID সহ)", labelEn:"Selfie (with NID)", required:true, mapsTo:[] },
  { key:"photo", labelBn:"পাসপোর্ট সাইজ ছবি", labelEn:"Passport Size Photo", required:true, mapsTo:[] },
  { key:"nominee_photo", labelBn:"নমিনির ছবি", labelEn:"Nominee Photo", required:false, conditional:true, mapsTo:[] },
];

export const LOAN_DOCUMENT_REQUIREMENTS: Record<LoanCategoryId, DocumentRequirement[]> = {
  personal: [
    ...identity,
    {key:"passport_copy",labelBn:"পাসপোর্ট কপি (যদি থাকে)",labelEn:"Passport Copy (if available)",required:false,conditional:true,mapsTo:["passportNumber"]},
    {key:"office_id",labelBn:"অফিস আইডি কপি",labelEn:"Office ID",required:true,mapsTo:["companyName","designation"]},
    {key:"hr_noc",labelBn:"HR লেটার/NOC",labelEn:"HR Letter/NOC",required:true,mapsTo:["companyName","designation","hrName","hrDesignation"]},
    {key:"salary_statement",labelBn:"বেতন স্টেটমেন্ট (৬ মাস)",labelEn:"Salary Statement (6 Months)",required:true,mapsTo:["basicSalary","netTakeHomePay","monthlyIncome"]},
    {key:"bank_statement",labelBn:"ব্যাংক স্টেটমেন্ট (৬ মাস)",labelEn:"Bank Statement (6 Months)",required:true,mapsTo:["bankName","accountName","accountNumber","monthlyIncome"]},
    {key:"etin_cert",labelBn:"e-TIN/ট্যাক্স রিটার্ন",labelEn:"e-TIN/Tax Return",required:true,mapsTo:["eTin"]},
    {key:"utility_bill",labelBn:"ইউটিলিটি বিল (বর্তমান বাসা)",labelEn:"Utility Bill (Current Home)",required:false,conditional:true,mapsTo:["currentAddress"]},
    {key:"guarantor1_nid",labelBn:"গ্যারান্টর ১ NID",labelEn:"Guarantor 1 NID",required:true,mapsTo:["g1Name","g1Nid","g1Mobile","g1Address"]},
    {key:"guarantor1_photo",labelBn:"গ্যারান্টর ১ ছবি",labelEn:"Guarantor 1 Photo",required:true,mapsTo:[]},
    {key:"guarantor1_income",labelBn:"গ্যারান্টর ১ আয়/ব্যাংক প্রমাণ",labelEn:"Guarantor 1 Income/Bank Proof",required:true,mapsTo:["g1Profession"]},
    {key:"guarantor2_nid",labelBn:"গ্যারান্টর ২ NID",labelEn:"Guarantor 2 NID",required:true,mapsTo:["g2OfficialId","g2Mobile"]},
    {key:"guarantor2_photo",labelBn:"গ্যারান্টর ২ ছবি",labelEn:"Guarantor 2 Photo",required:true,mapsTo:[]},
    {key:"guarantor2_income",labelBn:"গ্যারান্টর ২ আয়/ব্যাংক প্রমাণ",labelEn:"Guarantor 2 Income/Bank Proof",required:true,mapsTo:[]},
  ],
  business: [
    ...identity,
    {key:"trade_license_3yrs",labelBn:"ট্রেড লাইসেন্স (বিগত ৩ বছর)",labelEn:"Trade License (Last 3 Years)",required:true,mapsTo:["businessName","tradeLicense","tradeLicenseIssueDate"]},
    {key:"bank_statement_12m",labelBn:"ব্যাংক স্টেটমেন্ট (১২ মাস)",labelEn:"Bank Statement (12 Months)",required:true,mapsTo:["bankName","accountName","accountNumber","avgMonthlySales"]},
    {key:"premise_ownership_docs",labelBn:"জায়গার মালিকানা/ভাড়ার দলিল",labelEn:"Ownership Deed/Rent Agreement",required:true,mapsTo:["shopAddress","factoryAddress"]},
    {key:"supplier_buyer_invoices",labelBn:"সাপ্লায়ার ও ক্রেতার ইনভয়েস",labelEn:"Supplier & Buyer Invoices",required:true,mapsTo:["avgMonthlySales","productType"]},
    {key:"company_formation_docs",labelBn:"MOA/AOA/পার্টনারশিপ ডিড",labelEn:"MOA/AOA/Partnership Deed",required:true,mapsTo:["rjscNumber","applicantRole","equityPercentage"]},
    {key:"audited_financials",labelBn:"অডিটেড ফাইন্যান্সিয়ালস (৩ বছর)",labelEn:"Audited Financials (3 Years)",required:true,mapsTo:["cogs","netProfitMargin","accountsReceivable","accountsPayable","currentStockValue"]},
    {key:"director_kyc",labelBn:"ডিরেক্টর/পার্টনার NID, ছবি ও e-TIN",labelEn:"Director/Partner KYC",required:true,mapsTo:["applicantRole","eTin"]},
  ],
  women: [
    ...identity,
    {key:"women_trade_license",labelBn:"নারী উদ্যোক্তার ট্রেড লাইসেন্স",labelEn:"Trade License (Self)",required:true,mapsTo:["businessName","tradeLicense"]},
    {key:"rjsc_shareholding",labelBn:"RJSC শেয়ারহোল্ডিং (প্রযোজ্য হলে)",labelEn:"RJSC Shareholding (if applicable)",required:false,conditional:true,mapsTo:["rjscNumber","equityPercentage"]},
    {key:"women_bank_statement",labelBn:"ব্যবসার ব্যাংক স্টেটমেন্ট (৬-১২ মাস)",labelEn:"Business Bank Statement (6-12 Months)",required:true,mapsTo:["bankName","accountNumber","avgMonthlySales"]},
    {key:"ecommerce_proof",labelBn:"ই-কমার্স/F-commerce পেমেন্ট হিস্ট্রি",labelEn:"E-commerce/F-commerce Proof",required:false,conditional:true,mapsTo:["salesChannel","avgMonthlySales"]},
    {key:"chamber_membership",labelBn:"চেম্বার/ই-ক্যাব মেম্বারশিপ",labelEn:"Chamber Membership",required:false,conditional:true,mapsTo:[]},
  ],
  expat: [
    ...identity,
    {key:"passport_scan_pages",labelBn:"পাসপোর্টের কপি ও সিল",labelEn:"Passport Copy & Seals",required:true,mapsTo:["fullName","passportNumber","passportIssueDate","passportExpiryDate"]},
    {key:"visa_iqama_copy",labelBn:"ওয়ার্ক ভিসা/আকামা কপি",labelEn:"Work Visa/Iqama Copy",required:true,mapsTo:["visaType","iqamaNumber","workingCountry"]},
    {key:"employment_contract",labelBn:"বর্তমান চাকরির চুক্তিনামা",labelEn:"Employment Contract",required:true,mapsTo:["foreignCompanyName","workerCategory","monthlyIncome"]},
    {key:"bmet_card",labelBn:"BMET কার্ড",labelEn:"BMET Card",required:true,mapsTo:["workerCategory"]},
    {key:"remittance_statement_9m",labelBn:"রেমিট্যান্স স্টেটমেন্ট (৯ মাস)",labelEn:"Remittance Statement (9 Months)",required:true,mapsTo:["avgMonthlyRemittance","remittanceChannel","receiverBankAccount"]},
    {key:"power_of_attorney",labelBn:"পাওয়ার অফ অ্যাটর্নি (প্রযোজ্য হলে)",labelEn:"Power of Attorney (if applicable)",required:false,conditional:true,mapsTo:["coApplicantName","coApplicantRelation"]},
  ],
  student: [
    ...identity,
    {key:"academic_certificates",labelBn:"একাডেমিক সার্টিফিকেট/মার্কশিট",labelEn:"Academic Certificates",required:true,mapsTo:["sscGpa","sscYear","hscGpa","hscYear","gradCgpa","gradYear"]},
    {key:"admission_letter",labelBn:"অফার/অ্যাডমিশন লেটার",labelEn:"Offer/Admission Letter",required:true,mapsTo:["targetUniversity","targetDepartment","tuitionFee"]},
    {key:"i20_cas_letter",labelBn:"I-20/CAS Letter (প্রযোজ্য হলে)",labelEn:"I-20/CAS Letter (if applicable)",required:false,conditional:true,mapsTo:["targetUniversity","targetDepartment"]},
    {key:"english_proficiency",labelBn:"IELTS/TOEFL বা সমমান",labelEn:"English Proficiency",required:false,conditional:true,mapsTo:["courseRanking"]},
    {key:"sponsor_income_proof",labelBn:"স্পনসরের আয়ের প্রমাণ",labelEn:"Sponsor Income Proof",required:true,mapsTo:["sponsorIncomeSource","sponsorTaxableIncome"]},
    {key:"sponsor_bank_statement_1yr",labelBn:"স্পনসরের ব্যাংক স্টেটমেন্ট (১ বছর)",labelEn:"Sponsor Bank Statement (1 Year)",required:true,mapsTo:["sponsorNetWorth","sponsorIncomeSource"]},
    {key:"lien_property_fdr",labelBn:"লিয়েন/সম্পত্তি/FDR (যদি থাকে)",labelEn:"Lien Property/FDR (if available)",required:false,conditional:true,mapsTo:["sponsorNetWorth"]},
  ],
  emergency: [
    ...identity,
    {key:"diagnosis_report",labelBn:"ডায়াগনসিস রিপোর্ট ও প্রেসক্রিপশন",labelEn:"Diagnosis Report & Prescription",required:true,mapsTo:["patientName","patientCondition","treatmentType","hospitalName"]},
    {key:"cost_estimation_letter",labelBn:"খরচের বাজেট লেটার",labelEn:"Cost Budget Letter",required:true,mapsTo:["estimatedCost","shortfallAmount"]},
    {key:"admission_slip",labelBn:"ভর্তির টিকিট/রানিং বিল",labelEn:"Admission Slip/Running Bill",required:false,conditional:true,mapsTo:["hospitalName","estimatedCost"]},
    {key:"income_proof_quick",labelBn:"আয়ের দ্রুত প্রমাণ",labelEn:"Quick Income Proof",required:true,mapsTo:["monthlyIncome"]},
  ],
};

export function getLoanDocumentRequirements(category: string): DocumentRequirement[] {
  return LOAN_DOCUMENT_REQUIREMENTS[category as LoanCategoryId] || LOAN_DOCUMENT_REQUIREMENTS.personal;
}

export function getMissingRequiredDocuments(category: string, documents: Record<string,string>): DocumentRequirement[] {
  return getLoanDocumentRequirements(category).filter(d => d.required && !documents[d.key]);
}

export function getDocumentFieldMap(category: string): Record<string,string[]> {
  return Object.fromEntries(getLoanDocumentRequirements(category).map(d => [d.key, d.mapsTo]));
}
