import { z } from 'zod';

const addressSchema = (isBn: boolean) => z.object({
  division: z.string().min(1, { message: isBn ? "বিভাগ নির্বাচন করুন" : "Select division" }),
  district: z.string().min(1, { message: isBn ? "জেলা নির্বাচন করুন" : "Select district" }),
  upazila: z.string().min(1, { message: isBn ? "উপজেলা নির্বাচন করুন" : "Select upazila" }),
  union: z.string().min(1, { message: isBn ? "ইউনিয়ন/পৌরসভা লিখুন" : "Enter union/municipality" }),
  village: z.string().min(1, { message: isBn ? "গ্রাম/মহল্লার নাম লিখুন" : "Enter village/area" }),
  postOffice: z.string().min(1, { message: isBn ? "পোস্ট অফিসের নাম লিখুন" : "Enter post office" }),
  postCode: z.string().min(4, { message: isBn ? "সঠিক পোস্ট কোড দিন" : "Enter valid post code" }),
});

export const getLoanSchema = (isBn: boolean) => z.object({
  // Step 3
  fullName: z.string().min(3, { message: isBn ? "সঠিক নাম দিন" : "Enter a valid name" }),
  fatherName: z.string().min(3, { message: isBn ? "পিতার নাম দিন" : "Enter father's name" }),
  motherName: z.string().min(3, { message: isBn ? "মাতার নাম দিন" : "Enter mother's name" }),
  dob: z.string().min(1, { message: isBn ? "জন্ম তারিখ দিন" : "Select date of birth" }),
  gender: z.string().min(1, { message: isBn ? "লিঙ্গ নির্বাচন করুন" : "Select gender" }),
  mobile: z.string().regex(/^(01)[3-9][0-9]{8}$/, { message: isBn ? "সঠিক মোবাইল নাম্বার দিন (১১ ডিজিট)" : "Enter valid mobile number" }),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: isBn ? "সঠিক ইমেইল দিন" : "Enter a valid email" }).optional().or(z.literal('')),
  currentAddress: addressSchema(isBn),
  permanentAddress: addressSchema(isBn),
  nidNumber: z.string().min(10, { message: isBn ? "সঠিক NID নাম্বার দিন (অন্তত ১০ ডিজিট)" : "Enter valid NID (min 10 digits)" }),

  // Step 4 - Using min(1) so they fail if empty, but we'll only trigger them conditionally
  companyName: z.string().min(1, { message: isBn ? "কোম্পানির নাম দিন" : "Enter company name" }).optional(),
  designation: z.string().min(1, { message: isBn ? "পদবী দিন" : "Enter designation" }).optional(),
  workDuration: z.string().min(1, { message: isBn ? "কাজের মেয়াদ দিন" : "Enter work duration" }).optional(),
  monthlyIncome: z.string().min(1, { message: isBn ? "মাসিক আয় দিন" : "Enter monthly income" }).optional(),
  businessName: z.string().min(1, { message: isBn ? "ব্যবসার নাম দিন" : "Enter business name" }).optional(),
  shopAddress: z.string().min(1, { message: isBn ? "ঠিকানা দিন" : "Enter address" }).optional(),
  tradeLicense: z.string().min(1, { message: isBn ? "ট্রেড লাইসেন্স দিন" : "Enter trade license" }).optional(),
  workingCountry: z.string().min(1, { message: isBn ? "দেশের নাম দিন" : "Enter working country" }).optional(),
  visaType: z.string().min(1, { message: isBn ? "ভিসার ধরন দিন" : "Enter visa type" }).optional(),
  passportNumber: z.string().min(1, { message: isBn ? "পাসপোর্ট নাম্বার দিন" : "Enter passport NO" }).optional(),
  institutionName: z.string().min(1, { message: isBn ? "প্রতিষ্ঠানের নাম দিন" : "Enter institution name" }).optional(),
  studentId: z.string().min(1, { message: isBn ? "স্টুডেন্ট আইডি দিন" : "Enter student ID" }).optional(),
  guardianIncome: z.string().min(1, { message: isBn ? "আয় দিন" : "Enter income" }).optional(),
  professionName: z.string().min(1, { message: isBn ? "পেশা দিন" : "Enter profession" }).optional(),
  emergencyReason: z.string().min(1, { message: isBn ? "জরুরি কারণ দিন" : "Enter reason" }).optional(),

  // Step 5
  bankName: z.string().min(2, { message: isBn ? "ব্যাংকের নাম দিন" : "Enter bank name" }),
  accountName: z.string().min(2, { message: isBn ? "একাউন্টের নাম দিন" : "Enter account name" }),
  accountNumber: z.string().min(5, { message: isBn ? "সঠিক একাউন্ট নম্বর দিন" : "Enter valid account number" }),
  routingNumber: z.string().optional(),
  mobileBanking: z.string().regex(/^(01)[3-9][0-9]{8}$/, { message: isBn ? "সঠিক নাম্বার দিন (১১ ডিজিট)" : "Enter valid number" }).optional().or(z.literal('')),
  nomineeName: z.string().min(3, { message: isBn ? "নমিনির নাম দিন" : "Enter nominee name" }),
  nomineeRelation: z.string().min(2, { message: isBn ? "সম্পর্ক উল্লেখ করুন" : "Enter relationship" }),
  nomineeMobile: z.string().regex(/^(01)[3-9][0-9]{8}$/, { message: isBn ? "সঠিক মোবাইল নাম্বার দিন" : "Enter valid mobile number" }),
  nomineeNid: z.string().min(10, { message: isBn ? "সঠিক NID নাম্বার দিন (অন্তত ১০ ডিজিট)" : "Enter valid NID (min 10 digits)" })
});

export type LoanFormData = z.infer<ReturnType<typeof getLoanSchema>>;
export type AddressFormData = z.infer<ReturnType<typeof addressSchema>>;
