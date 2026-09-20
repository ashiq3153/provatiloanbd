export type DocumentOcrField = {
  value: string;
  confidence: number;
  sourceDocument: string;
};

export type DocumentOcrResult = {
  fields: Record<string, DocumentOcrField>;
  confidence: number;
};

declare global {
  interface Window {
    Tesseract?: any;
  }
}

let tesseractLoader: Promise<any> | null = null;

async function loadTesseract() {
  if (typeof window === "undefined") throw new Error("OCR is browser-only");
  if (window.Tesseract) return window.Tesseract;
  if (!tesseractLoader) {
    tesseractLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-provati-ocr="tesseract"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Tesseract));
        existing.addEventListener("error", () => reject(new Error("OCR engine failed to load")));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.async = true;
      script.dataset.provatiOcr = "tesseract";
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error("OCR engine failed to load"));
      document.head.appendChild(script);
    });
  }
  return tesseractLoader;
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[:\-\s]+|[:\-\s]+$/g, "").trim();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return "";
}

function normalizeDigits(value: string) {
  const map: Record<string,string> = { "০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9" };
  return value.replace(/[০-৯]/g, d => map[d] || d);
}

function parseFields(text: string, docKey: string, confidence: number): Record<string, DocumentOcrField> {
  const normalized = normalizeDigits(text);
  const fields: Record<string, DocumentOcrField> = {};
  const put = (key: string, value: string, minConfidence = 55) => {
    const v = clean(value);
    if (v && confidence >= minConfidence) fields[key] = { value: v, confidence, sourceDocument: docKey };
  };

  if (docKey === "nid_front" || docKey === "nid_back") {
    put("fullName", firstMatch(normalized, [
      /(?:Name|নাম)\s*[:：\-]?\s*([^\n]+)/i
    ]));
    const nid = normalized.match(/\b(?:\d{10}|\d{13}|\d{17})\b/);
    if (nid) put("nidNumber", nid[0], 45);
    put("dob", firstMatch(normalized, [
      /(?:Date of Birth|DOB|জন্ম তারিখ)\s*[:：\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i
    ]));
    put("gender", firstMatch(normalized, [/(?:Gender|লিঙ্গ)\s*[:：\-]?\s*([^\n]+)/i]));
    put("fatherName", firstMatch(normalized, [/(?:Father|পিতা)\s*(?:Name|নাম)?\s*[:：\-]?\s*([^\n]+)/i]));
    put("motherName", firstMatch(normalized, [/(?:Mother|মাতা)\s*(?:Name|নাম)?\s*[:：\-]?\s*([^\n]+)/i]));
  }

  if (docKey === "passport_copy" || docKey === "passport_scan_pages") {
    put("passportNumber", firstMatch(normalized, [
      /(?:Passport\s*(?:No|Number)|পাসপোর্ট\s*(?:নং|নম্বর))\s*[:：\-]?\s*([A-Z0-9]{6,12})/i
    ]));
    put("fullName", firstMatch(normalized, [/(?:Surname|Given Names|Name)\s*[:：\-]?\s*([^\n]+)/i]));
    put("passportIssueDate", firstMatch(normalized, [/(?:Date of Issue|Issue Date)\s*[:：\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i]));
    put("passportExpiryDate", firstMatch(normalized, [/(?:Date of Expiry|Expiry Date)\s*[:：\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i]));
  }

  if (docKey.includes("trade_license")) {
    put("businessName", firstMatch(normalized, [/(?:Business Name|Name of Business|প্রতিষ্ঠানের নাম|ব্যবসার নাম)\s*[:：\-]?\s*([^\n]+)/i]));
    put("tradeLicense", firstMatch(normalized, [/(?:Trade License(?: No| Number)?|ট্রেড লাইসেন্স(?: নং| নম্বর)?)\s*[:：\-]?\s*([A-Z0-9\-\/]+)/i]));
    put("tradeLicenseIssueDate", firstMatch(normalized, [/(?:Issue Date|তারিখ)\s*[:：\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i]));
  }

  if (docKey === "etin_cert") {
    put("eTin", firstMatch(normalized, [/(?:e-?TIN|TIN)\s*(?:No|Number)?\s*[:：\-]?\s*(\d{10,14})/i]));
  }

  if (docKey.includes("bank_statement")) {
    put("bankName", firstMatch(normalized, [/(?:Bank Name|Bank)\s*[:：\-]?\s*([^\n]+)/i]));
    put("accountName", firstMatch(normalized, [/(?:Account Name|A\/C Name)\s*[:：\-]?\s*([^\n]+)/i]));
    put("accountNumber", firstMatch(normalized, [/(?:Account Number|A\/C No|Account No)\s*[:：\-]?\s*([0-9\-]+)/i]));
  }

  if (docKey === "salary_statement") {
    put("basicSalary", firstMatch(normalized, [/(?:Basic Salary|Basic)\s*[:：\-]?\s*([0-9,\.]+)/i]));
    put("netTakeHomePay", firstMatch(normalized, [/(?:Net Take Home|Net Salary|Net Pay)\s*[:：\-]?\s*([0-9,\.]+)/i]));
    put("monthlyIncome", firstMatch(normalized, [/(?:Gross Salary|Monthly Salary|Monthly Income)\s*[:：\-]?\s*([0-9,\.]+)/i]));
    put("companyName", firstMatch(normalized, [/(?:Company Name|Employer|Organization)\s*[:：\-]?\s*([^\n]+)/i]));
    put("designation", firstMatch(normalized, [/(?:Designation|Position)\s*[:：\-]?\s*([^\n]+)/i]));
  }

  if (docKey === "employment_contract") {
    put("foreignCompanyName", firstMatch(normalized, [/(?:Employer|Company Name|Company)\s*[:：\-]?\s*([^\n]+)/i]));
    put("workerCategory", firstMatch(normalized, [/(?:Job Title|Occupation|Position)\s*[:：\-]?\s*([^\n]+)/i]));
  }

  if (docKey === "visa_iqama_copy") {
    put("visaType", firstMatch(normalized, [/(?:Visa Type|Type of Visa)\s*[:：\-]?\s*([^\n]+)/i]));
    put("iqamaNumber", firstMatch(normalized, [/(?:Iqama|ID Number|Residence No)\s*[:：-]?\s*([A-Z0-9\-]+)/i]));
    put("workingCountry", firstMatch(normalized, [/(?:Country|State)\s*[:：\-]?\s*([^\n]+)/i]));
  }

  if (docKey === "remittance_statement_9m") {
    put("avgMonthlyRemittance", firstMatch(normalized, [/(?:Average|Monthly Remittance|Remittance)\s*[:：\-]?\s*([0-9,\.]+)/i]));
    put("receiverBankAccount", firstMatch(normalized, [/(?:Beneficiary Account|Receiver Account|Account No)\s*[:：\-]?\s*([0-9\-]+)/i]));
  }

  if (docKey === "academic_certificates") {
    put("sscGpa", firstMatch(normalized, [/(?:SSC|S\.S\.C).*?(?:GPA|Grade)\s*[:：\-]?\s*([0-9\.]+)/i]));
    put("sscYear", firstMatch(normalized, [/(?:SSC|S\.S\.C).*?(?:Year|Passing Year)\s*[:：\-]?\s*(\d{4})/i]));
    put("hscGpa", firstMatch(normalized, [/(?:HSC|H\.S\.C).*?(?:GPA|Grade)\s*[:：\-]?\s*([0-9\.]+)/i]));
    put("hscYear", firstMatch(normalized, [/(?:HSC|H\.S\.C).*?(?:Year|Passing Year)\s*[:：\-]?\s*(\d{4})/i]));
    put("gradCgpa", firstMatch(normalized, [/(?:CGPA|GPA)\s*[:：\-]?\s*([0-9\.]+)/i]));
    put("gradYear", firstMatch(normalized, [/(?:Passing Year|Year)\s*[:：\-]?\s*(\d{4})/i]));
  }

  if (docKey === "admission_letter") {
    put("targetUniversity", firstMatch(normalized, [/(?:University|Institution|College)\s*[:：\-]?\s*([^\n]+)/i]));
    put("targetDepartment", firstMatch(normalized, [/(?:Program|Department|Course)\s*[:：\-]?\s*([^\n]+)/i]));
    put("tuitionFee", firstMatch(normalized, [/(?:Tuition Fee|Tuition)\s*[:：\-]?\s*([0-9,\.]+)/i]));
  }

  if (docKey === "sponsor_income_proof") {
    put("sponsorName", firstMatch(normalized, [/(?:Sponsor Name|Name)\s*[:：\-]?\s*([^\n]+)/i]));
    put("sponsorIncomeSource", firstMatch(normalized, [/(?:Occupation|Income Source|Profession)\s*[:：\-]?\s*([^\n]+)/i]));
    put("sponsorTaxableIncome", firstMatch(normalized, [/(?:Taxable Income|Annual Income|Income)\s*[:：\-]?\s*([0-9,\.]+)/i]));
  }

  if (docKey === "diagnosis_report") {
    put("patientName", firstMatch(normalized, [/(?:Patient Name|Patient|রোগীর নাম)\s*[:：\-]?\s*([^\n]+)/i]));
    put("patientCondition", firstMatch(normalized, [/(?:Diagnosis|Condition|রোগ নির্ণয়)\s*[:：\-]?\s*([^\n]+)/i]));
    put("hospitalName", firstMatch(normalized, [/(?:Hospital|Clinic|হাসপাতাল)\s*[:：\-]?\s*([^\n]+)/i]));
    put("treatmentType", firstMatch(normalized, [/(?:Treatment|Procedure|চিকিৎসা)\s*[:：\-]?\s*([^\n]+)/i]));
  }

  if (docKey === "cost_estimation_letter") {
    put("estimatedCost", firstMatch(normalized, [/(?:Estimated Cost|Total Cost|খরচ)\s*[:：\-]?\s*([0-9,\.]+)/i]));
    put("shortfallAmount", firstMatch(normalized, [/(?:Shortfall|Required Amount|ঘাটতি)\s*[:：\-]?\s*([0-9,\.]+)/i]));
  }

  if (docKey === "income_proof_quick") {
    put("monthlyIncome", firstMatch(normalized, [/(?:Monthly Income|Salary|Income)\s*[:：\-]?\s*([0-9,\.]+)/i]));
  }

  return fields;
}

export async function extractDocumentFields(file: File, docKey: string, onProgress?: (value: number) => void): Promise<DocumentOcrResult | null> {
  if (!file.type.startsWith("image/")) return null;
  const Tesseract = await loadTesseract();
  const worker = await Tesseract.createWorker("eng+ben");
  try {
    const result = await worker.recognize(file, {}, { progress: (p: any) => onProgress?.(Math.round((p?.progress || 0) * 100)) });
    const confidence = Math.max(0, Math.min(100, Number(result?.data?.confidence || 0)));
    const fields = parseFields(String(result?.data?.text || ""), docKey, confidence);
    return { fields, confidence };
  } finally {
    await worker.terminate();
  }
}
