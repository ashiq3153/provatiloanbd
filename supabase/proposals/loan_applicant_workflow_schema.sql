-- DESIGN PROPOSAL ONLY — NOT A SUPABASE MIGRATION.
-- Do not execute this file against production. See issue #20:
-- https://github.com/ashiq3153/provatiloanbd/issues/20
-- Reconcile the 28 live migration history entries with source control first.
-- When approved, create a proper file with: supabase migration new loan_applicant_workflow
-- Review the generated migration and validate it on a non-production database before deployment.

begin;

create table public.loan_document_requirements (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[a-z][a-z0-9_]{1,63}$'),
  loan_category text null check (
    loan_category is null or loan_category in ('personal','business','women','expat','student','emergency')
  ),
  profession_code text null check (
    profession_code is null or profession_code ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  label_bn text not null check (length(btrim(label_bn)) > 0),
  label_en text not null check (length(btrim(label_en)) > 0),
  help_text_bn text null,
  help_text_en text null,
  is_required boolean not null default true,
  is_conditional boolean not null default false,
  maps_to_fields text[] not null default '{}'::text[],
  allowed_mime_types text[] not null default array[
    'image/jpeg','image/png','image/webp','application/pdf'
  ]::text[] check (
    allowed_mime_types <@ array['image/jpeg','image/png','image/webp','application/pdf']::text[]
  ),
  max_file_size_bytes bigint not null default 10485760
    check (max_file_size_bytes between 1 and 10485760),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index loan_document_requirements_scope_code_uidx
  on public.loan_document_requirements (
    code,
    coalesce(loan_category, '*'),
    coalesce(profession_code, '*')
  );
create index loan_document_requirements_display_idx
  on public.loan_document_requirements (loan_category, profession_code, is_enabled, sort_order);

create table public.loan_application_drafts (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null references public.profiles(chat_id) on delete cascade,
  loan_category text not null check (
    loan_category in ('personal','business','women','expat','student','emergency')
  ),
  current_step smallint not null default 1 check (current_step between 1 and 6),
  completed_steps smallint[] not null default '{}'::smallint[]
    check (completed_steps <@ array[1,2,3,4,5,6]::smallint[]),
  form_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(form_data) = 'object'),
  draft_status text not null default 'draft'
    check (draft_status in ('draft','submitted','abandoned','expired')),
  loan_application_id uuid null references public.loan_applications(id) on delete cascade,
  expires_at timestamptz null,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_application_drafts_submitted_link_check check (
    draft_status <> 'submitted'
    or (loan_application_id is not null and submitted_at is not null)
  )
);

create index loan_application_drafts_owner_updated_idx
  on public.loan_application_drafts (chat_id, updated_at desc);
create index loan_application_drafts_status_expiry_idx
  on public.loan_application_drafts (draft_status, expires_at)
  where draft_status in ('draft','expired');

create table public.loan_application_documents (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid null references public.loan_application_drafts(id) on delete cascade,
  loan_application_id uuid null references public.loan_applications(id) on delete cascade,
  chat_id bigint not null references public.profiles(chat_id) on delete cascade,
  requirement_id uuid not null references public.loan_document_requirements(id) on delete restrict,
  document_code text not null check (document_code ~ '^[a-z][a-z0-9_]{1,63}$'),
  bucket_id text not null default 'loan_documents' check (bucket_id = 'loan_documents'),
  object_path text not null check (
    length(btrim(object_path)) > 0
    and object_path !~ '(^/|(^|/)\.\.?(/|$)|[?]|://)'
  ),
  original_filename text not null check (
    length(btrim(original_filename)) > 0 and length(original_filename) <= 255
  ),
  mime_type text not null check (
    mime_type in ('image/jpeg','image/png','image/webp','application/pdf')
  ),
  file_size_bytes bigint not null check (file_size_bytes between 1 and 10485760),
  version_number integer not null default 1 check (version_number >= 1),
  is_current boolean not null default true,
  review_status text not null default 'pending'
    check (review_status in ('pending','verified','rejected','needs_revision')),
  reviewed_by_chat_id bigint null references public.profiles(chat_id) on delete set null,
  review_note text null,
  reviewed_at timestamptz null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_application_documents_one_parent_check check (
    num_nonnulls(draft_id, loan_application_id) = 1
  ),
  constraint loan_application_documents_review_reason_check check (
    review_status not in ('rejected','needs_revision')
    or nullif(btrim(review_note), '') is not null
  ),
  constraint loan_application_documents_review_actor_check check (
    review_status = 'pending'
    or (reviewed_by_chat_id is not null and reviewed_at is not null)
  )
);

create index loan_application_documents_owner_status_idx
  on public.loan_application_documents (chat_id, review_status);
create index loan_application_documents_application_idx
  on public.loan_application_documents (loan_application_id, uploaded_at desc)
  where loan_application_id is not null;
create index loan_application_documents_draft_idx
  on public.loan_application_documents (draft_id, uploaded_at desc)
  where draft_id is not null;
create unique index loan_application_documents_current_draft_uidx
  on public.loan_application_documents (draft_id, requirement_id)
  where draft_id is not null and is_current;
create unique index loan_application_documents_current_application_uidx
  on public.loan_application_documents (loan_application_id, requirement_id)
  where loan_application_id is not null and is_current;
create unique index loan_application_documents_draft_version_uidx
  on public.loan_application_documents (draft_id, requirement_id, version_number)
  where draft_id is not null;
create unique index loan_application_documents_application_version_uidx
  on public.loan_application_documents (loan_application_id, requirement_id, version_number)
  where loan_application_id is not null;

-- Existing hard-coded requirements copied into rows. Common records contain no
-- employment/salary requirements; those remain specific to the applicable loan type.
insert into public.loan_document_requirements (
  code, loan_category, profession_code, label_bn, label_en,
  is_required, is_conditional, maps_to_fields, sort_order
) values
  ('nid_front', NULL, NULL, 'NID সামনের অংশ', 'NID Front', true, false, ARRAY['fullName', 'nidNumber', 'dob', 'gender']::text[], 1),
  ('nid_back', NULL, NULL, 'NID পেছনের অংশ', 'NID Back', true, false, ARRAY['nidNumber', 'address']::text[], 2),
  ('selfie', NULL, NULL, 'সেলফি (NID সহ)', 'Selfie (with NID)', true, false, ARRAY[]::text[], 3),
  ('photo', NULL, NULL, 'পাসপোর্ট সাইজ ছবি', 'Passport Size Photo', true, false, ARRAY[]::text[], 4),
  ('nominee_photo', NULL, NULL, 'নমিনির ছবি', 'Nominee Photo', false, true, ARRAY[]::text[], 5),
  ('passport_copy', 'personal', NULL, 'পাসপোর্ট কপি (যদি থাকে)', 'Passport Copy (if available)', false, true, ARRAY['passportNumber']::text[], 6),
  ('office_id', 'personal', NULL, 'অফিস আইডি কপি', 'Office ID', true, false, ARRAY['companyName', 'designation']::text[], 7),
  ('hr_noc', 'personal', NULL, 'HR লেটার/NOC', 'HR Letter/NOC', true, false, ARRAY['companyName', 'designation', 'hrName', 'hrDesignation']::text[], 8),
  ('salary_statement', 'personal', NULL, 'বেতন স্টেটমেন্ট (৬ মাস)', 'Salary Statement (6 Months)', true, false, ARRAY['basicSalary', 'netTakeHomePay', 'monthlyIncome']::text[], 9),
  ('bank_statement', 'personal', NULL, 'ব্যাংক স্টেটমেন্ট (৬ মাস)', 'Bank Statement (6 Months)', true, false, ARRAY['bankName', 'accountName', 'accountNumber', 'monthlyIncome']::text[], 10),
  ('etin_cert', 'personal', NULL, 'e-TIN/ট্যাক্স রিটার্ন', 'e-TIN/Tax Return', true, false, ARRAY['eTin']::text[], 11),
  ('utility_bill', 'personal', NULL, 'ইউটিলিটি বিল (বর্তমান বাসা)', 'Utility Bill (Current Home)', false, true, ARRAY['currentAddress']::text[], 12),
  ('guarantor1_nid', 'personal', NULL, 'গ্যারান্টর ১ NID', 'Guarantor 1 NID', true, false, ARRAY['g1Name', 'g1Nid', 'g1Mobile', 'g1Address']::text[], 13),
  ('guarantor1_photo', 'personal', NULL, 'গ্যারান্টর ১ ছবি', 'Guarantor 1 Photo', true, false, ARRAY[]::text[], 14),
  ('guarantor1_income', 'personal', NULL, 'গ্যারান্টর ১ আয়/ব্যাংক প্রমাণ', 'Guarantor 1 Income/Bank Proof', true, false, ARRAY['g1Profession']::text[], 15),
  ('guarantor2_nid', 'personal', NULL, 'গ্যারান্টর ২ NID', 'Guarantor 2 NID', true, false, ARRAY['g2OfficialId', 'g2Mobile']::text[], 16),
  ('guarantor2_photo', 'personal', NULL, 'গ্যারান্টর ২ ছবি', 'Guarantor 2 Photo', true, false, ARRAY[]::text[], 17),
  ('guarantor2_income', 'personal', NULL, 'গ্যারান্টর ২ আয়/ব্যাংক প্রমাণ', 'Guarantor 2 Income/Bank Proof', true, false, ARRAY[]::text[], 18),
  ('trade_license_3yrs', 'business', NULL, 'ট্রেড লাইসেন্স (বিগত ৩ বছর)', 'Trade License (Last 3 Years)', true, false, ARRAY['businessName', 'tradeLicense', 'tradeLicenseIssueDate']::text[], 19),
  ('bank_statement_12m', 'business', NULL, 'ব্যাংক স্টেটমেন্ট (১২ মাস)', 'Bank Statement (12 Months)', true, false, ARRAY['bankName', 'accountName', 'accountNumber', 'avgMonthlySales']::text[], 20),
  ('premise_ownership_docs', 'business', NULL, 'জায়গার মালিকানা/ভাড়ার দলিল', 'Ownership Deed/Rent Agreement', true, false, ARRAY['shopAddress', 'factoryAddress']::text[], 21),
  ('supplier_buyer_invoices', 'business', NULL, 'সাপ্লায়ার ও ক্রেতার ইনভয়েস', 'Supplier & Buyer Invoices', true, false, ARRAY['avgMonthlySales', 'productType']::text[], 22),
  ('company_formation_docs', 'business', NULL, 'MOA/AOA/পার্টনারশিপ ডিড', 'MOA/AOA/Partnership Deed', true, false, ARRAY['rjscNumber', 'applicantRole', 'equityPercentage']::text[], 23),
  ('audited_financials', 'business', NULL, 'অডিটেড ফাইন্যান্সিয়ালস (৩ বছর)', 'Audited Financials (3 Years)', true, false, ARRAY['cogs', 'netProfitMargin', 'accountsReceivable', 'accountsPayable', 'currentStockValue']::text[], 24),
  ('director_kyc', 'business', NULL, 'ডিরেক্টর/পার্টনার NID, ছবি ও e-TIN', 'Director/Partner KYC', true, false, ARRAY['applicantRole', 'eTin']::text[], 25),
  ('women_trade_license', 'women', NULL, 'নারী উদ্যোক্তার ট্রেড লাইসেন্স', 'Trade License (Self)', true, false, ARRAY['businessName', 'tradeLicense']::text[], 26),
  ('rjsc_shareholding', 'women', NULL, 'RJSC শেয়ারহোল্ডিং (প্রযোজ্য হলে)', 'RJSC Shareholding (if applicable)', false, true, ARRAY['rjscNumber', 'equityPercentage']::text[], 27),
  ('women_bank_statement', 'women', NULL, 'ব্যবসার ব্যাংক স্টেটমেন্ট (৬-১২ মাস)', 'Business Bank Statement (6-12 Months)', true, false, ARRAY['bankName', 'accountNumber', 'avgMonthlySales']::text[], 28),
  ('ecommerce_proof', 'women', NULL, 'ই-কমার্স/F-commerce পেমেন্ট হিস্ট্রি', 'E-commerce/F-commerce Proof', false, true, ARRAY['salesChannel', 'avgMonthlySales']::text[], 29),
  ('chamber_membership', 'women', NULL, 'চেম্বার/ই-ক্যাব মেম্বারশিপ', 'Chamber Membership', false, true, ARRAY[]::text[], 30),
  ('passport_scan_pages', 'expat', NULL, 'পাসপোর্টের কপি ও সিল', 'Passport Copy & Seals', true, false, ARRAY['fullName', 'passportNumber', 'passportIssueDate', 'passportExpiryDate']::text[], 31),
  ('visa_iqama_copy', 'expat', NULL, 'ওয়ার্ক ভিসা/আকামা কপি', 'Work Visa/Iqama Copy', true, false, ARRAY['visaType', 'iqamaNumber', 'workingCountry']::text[], 32),
  ('employment_contract', 'expat', NULL, 'বর্তমান চাকরির চুক্তিনামা', 'Employment Contract', true, false, ARRAY['foreignCompanyName', 'workerCategory', 'monthlyIncome']::text[], 33),
  ('bmet_card', 'expat', NULL, 'BMET কার্ড', 'BMET Card', true, false, ARRAY['workerCategory']::text[], 34),
  ('remittance_statement_9m', 'expat', NULL, 'রেমিট্যান্স স্টেটমেন্ট (৯ মাস)', 'Remittance Statement (9 Months)', true, false, ARRAY['avgMonthlyRemittance', 'remittanceChannel', 'receiverBankAccount']::text[], 35),
  ('power_of_attorney', 'expat', NULL, 'পাওয়ার অফ অ্যাটর্নি (প্রযোজ্য হলে)', 'Power of Attorney (if applicable)', false, true, ARRAY['coApplicantName', 'coApplicantRelation']::text[], 36),
  ('academic_certificates', 'student', NULL, 'একাডেমিক সার্টিফিকেট/মার্কশিট', 'Academic Certificates', true, false, ARRAY['sscGpa', 'sscYear', 'hscGpa', 'hscYear', 'gradCgpa', 'gradYear']::text[], 37),
  ('admission_letter', 'student', NULL, 'অফার/অ্যাডমিশন লেটার', 'Offer/Admission Letter', true, false, ARRAY['targetUniversity', 'targetDepartment', 'tuitionFee']::text[], 38),
  ('i20_cas_letter', 'student', NULL, 'I-20/CAS Letter (প্রযোজ্য হলে)', 'I-20/CAS Letter (if applicable)', false, true, ARRAY['targetUniversity', 'targetDepartment']::text[], 39),
  ('english_proficiency', 'student', NULL, 'IELTS/TOEFL বা সমমান', 'English Proficiency', false, true, ARRAY['courseRanking']::text[], 40),
  ('sponsor_income_proof', 'student', NULL, 'স্পনসরের আয়ের প্রমাণ', 'Sponsor Income Proof', true, false, ARRAY['sponsorIncomeSource', 'sponsorTaxableIncome']::text[], 41),
  ('sponsor_bank_statement_1yr', 'student', NULL, 'স্পনসরের ব্যাংক স্টেটমেন্ট (১ বছর)', 'Sponsor Bank Statement (1 Year)', true, false, ARRAY['sponsorNetWorth', 'sponsorIncomeSource']::text[], 42),
  ('lien_property_fdr', 'student', NULL, 'লিয়েন/সম্পত্তি/FDR (যদি থাকে)', 'Lien Property/FDR (if available)', false, true, ARRAY['sponsorNetWorth']::text[], 43),
  ('diagnosis_report', 'emergency', NULL, 'ডায়াগনসিস রিপোর্ট ও প্রেসক্রিপশন', 'Diagnosis Report & Prescription', true, false, ARRAY['patientName', 'patientCondition', 'treatmentType', 'hospitalName']::text[], 44),
  ('cost_estimation_letter', 'emergency', NULL, 'খরচের বাজেট লেটার', 'Cost Budget Letter', true, false, ARRAY['estimatedCost', 'shortfallAmount']::text[], 45),
  ('admission_slip', 'emergency', NULL, 'ভর্তির টিকিট/রানিং বিল', 'Admission Slip/Running Bill', false, true, ARRAY['hospitalName', 'estimatedCost']::text[], 46),
  ('income_proof_quick', 'emergency', NULL, 'আয়ের দ্রুত প্রমাণ', 'Quick Income Proof', true, false, ARRAY['monthlyIncome']::text[], 47);

-- These tables are private server-side workflow state. The verified gateway uses
-- service_role; browser roles must not read or mutate raw drafts/files directly.
alter table public.loan_document_requirements enable row level security;
alter table public.loan_application_drafts enable row level security;
alter table public.loan_application_documents enable row level security;

revoke all privileges on table public.loan_document_requirements from public, anon, authenticated;
revoke all privileges on table public.loan_application_drafts from public, anon, authenticated;
revoke all privileges on table public.loan_application_documents from public, anon, authenticated;

grant select, insert, update, delete on table public.loan_document_requirements to service_role;
grant select, insert, update, delete on table public.loan_application_drafts to service_role;
grant select, insert, update, delete on table public.loan_application_documents to service_role;

comment on table public.loan_document_requirements is
  'Private server-managed bilingual loan-document requirements, scoped to common/category/profession.';
comment on table public.loan_application_drafts is
  'Private resumable applicant drafts; created/updated only by the Telegram-verified server workflow.';
comment on table public.loan_application_documents is
  'Private applicant document metadata and version/review history; stores storage paths only, never signed URLs.';

commit;
