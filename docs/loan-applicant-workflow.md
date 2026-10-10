# Loan Applicant Workflow & Database Model (Proposal)

**Status:** Design proposal only. This file does not change the live database. The schema must not be applied until issue #20 reconciles the 28 live migration-history entries with the four SQL files present on `v1.1-phase1`.

## What exists today

The read-only Supabase inventory found 16 public tables. Relevant existing tables are:

- `loan_applications`: submitted applications, applicant contact/address/nominee/banking fields, professional details in `professional_info jsonb`, current documents in `documents jsonb`, financial calculation fields and application status.
- `kyc_reviews`: overall KYC/review workflow.
- `loan_status_history`: loan status transitions.
- `loan_rate_versions`: trusted active rates/calculation method.
- `loan_emi_schedule`: repayment schedule (EMI-specific UI work is deferred at the user's request).
- `profiles`: Telegram-linked member profile.
- `transactions`: deposits/withdrawals and payment submissions.

We should **not** create duplicate tables for review history, rate versions or repayment schedules. The real gap for the applicant experience is resumable pre-submission state, first-class document metadata, and editable document requirements.

## Proposed additional tables

### 1. `loan_application_drafts`

Stores a partially completed application before final submission. A draft is scoped to the verified Telegram chat, remembers the current step and completed steps, and stores only server-validated form fields in `form_data jsonb`. It does **not** create a `pending` loan application until the applicant reaches the final review/submit action.

Important columns: `chat_id`, `loan_category`, `current_step`, `completed_steps`, `form_data`, `draft_status`, `loan_application_id`, timestamps.

### 2. `loan_document_requirements`

Replaces the hard-coded requirement registry in `src/lib/loan-document-requirements.ts` once server/UI integration is ready. It stores bilingual titles/help, scope (common or loan category and optional profession), required/optional/conditional status, field mapping, sort order, permitted MIME types and maximum upload size.

Initial rows in the proposal mirror the current TypeScript requirements. Common rows include only NID front/back, selfie with NID, passport-size photo, and optional nominee photo. Salary/office/job evidence remains specific to the relevant loan category; it is **not** put into the common list.

### 3. `loan_application_documents`

One row per uploaded document/version. It stores a reference to either a draft or a submitted application, the Telegram owner, requirement code, private storage bucket and object path, file metadata, current-version marker, document-specific verification status, reviewer and revision reason.

Only a bucket-qualified internal path is stored; a signed URL or token is never persisted. The current uploader returns `loan_documents/<path>`; integration should normalize this to `bucket_id = 'loan_documents'` and the object path within the bucket. This matches the direction of PR #13.

## Recommended applicant journey: six clear stages

1. **Loan choice** — category selection, category-specific eligibility notes and a plain-language explanation of which information will be needed.
2. **Loan amount & tenure** — amount chips/custom amount, years/months selector, monthly interest basis, EMI estimate, processing fee and required savings/deposit preview.
3. **Identity & contact** — full legal name, NID number, date of birth, gender, phone/WhatsApp and email.
4. **Address & family** — current/permanent address, nominee information and any category-relevant guardian/co-applicant details.
5. **Profession, income & banking** — conditional business/student/expatriate/women-entrepreneur/emergency fields; income evidence; bank account and repayment destination; guarantors only if required for that category.
6. **Documents, review & submit** — category-specific file upload first, then a review summary of all key details and exact financial values, declaration/consent, and one final Submit action. Missing items link back to the relevant step.

The six labels should be shown as a compact stepper, with a single clear current step and completed indicators. Save/resume should work without turning a draft into a live loan application. On narrow Telegram screens, use one column, full-width fields and a sticky bottom action area that respects safe-area insets. The final summary is a dedicated review state even if it shares the final stage with documents via an in-stage substep.

## Submission lifecycle

1. Telegram WebApp `initData` is verified by the server; never accept applicant `chat_id` from client payload.
2. Every step is validated on the server with a field allowlist. Uploads use private storage and a category/profession requirement ID.
3. Draft progress and file paths are saved; the applicant can leave Telegram and resume.
4. Final submit validates all required requirements, re-checks the active rate/config, recalculates all monetary fields server-side, and creates the submitted `loan_applications` row with `pending` status.
5. In the same trusted server/database transaction where practical, document rows move from the draft to the created application and the draft becomes `submitted`. Do not create the application if validation or financial calculation fails.
6. Admin review updates each document independently, with a clear reason for rejected/needs-revision documents. A replacement creates a new version; old versions remain auditable.
7. During rollout, `loan_applications.documents jsonb` remains a legacy read fallback. After the new table is integrated and records are backfilled, the normalized table becomes the canonical document source.

## Security controls (required)

- All three proposed tables enable RLS.
- No direct `anon` or `authenticated` privileges are granted. No user-facing RLS write policy is needed while all access goes through the Telegram-verified server gateway/service role.
- The server must still enforce owner checks, category/requirement compatibility, file ownership and allowed role before each read/write. RLS alone is not sufficient.
- File records store paths only. Mint short-lived signed URLs when an authorized applicant/admin opens one file.
- Restrict file MIME types and size server-side; the upload endpoint must not trust the browser's file name, path or claimed owner.
- Never place full identity documents, NID values or bank account numbers into general activity logs.
- Existing table grants/RLS are addressed separately in PR #14 after migration history is reconciled.

## Migration/release constraint

The live database reports 28 applied migration entries, while the checked-in branch has four migration SQL files. Do not place this SQL under `supabase/migrations` or apply it until that history/source-of-truth mismatch has been resolved. When that happens, generate the actual migration with the Supabase CLI and test it on a non-production database matching the reconciled schema.

## Manual acceptance checklist (no paid TestSprite)

- [ ] Start a draft and verify the database does not show a submitted/pending loan yet.
- [ ] Leave the app, reopen in Telegram and resume the same draft at its current step.
- [ ] Switch loan category and profession; required/optional documents update correctly.
- [ ] Upload NID front and back separately; file validation errors are understandable.
- [ ] Replace a rejected file and confirm the older version remains in history.
- [ ] Submit with a missing required document: submission is blocked and the exact missing item is named.
- [ ] Submit a valid test draft: one pending loan application is created and the document rows link to it.
- [ ] Ensure only the correct Telegram owner/admin role can read private document metadata or mint a signed URL.
- [ ] Test Bengali/English, light/dark, narrow 320–360px viewport, keyboard, Telegram safe areas and bottom navigation.

Related tracking: issues #20, #21, #22; existing security/document PRs #12–#14.
