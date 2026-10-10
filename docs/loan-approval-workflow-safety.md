# Loan approval workflow safety review

**Status:** Proposal only. No runtime code or database was changed by this document. Do not merge/apply the SQL until PR #25 / issue #20 resolves the live migration-history mismatch and the change is validated against a non-production database.

## Finding

The recovered definition of `public.approve_loan_atomic(uuid, text)` marks a loan application as `approved` and also inserts a `disbursement` transaction with status `completed` in the same operation. Approval is a decision; it is not evidence that funds were actually transferred. This can create a false financial record and may trigger ledger reconciliation as if the money moved.

The function also accepts any status other than `approved` as an approval source, including terminal states such as `rejected` or `cancelled`.

## Proposed approval behavior

- Lock the application row and read its current status.
- Treat an already-approved request as an idempotent retry.
- Allow approval only from `pending`, `under_review`, or `action_required`.
- Reject approval attempts from `rejected`, `cancelled`, `completed`, or other unsupported states.
- Set `approved_at` once and keep the review note.
- Do **not** create any transaction or ledger entry as a side effect of approval.
- Restrict the privileged function to `service_role`; applicant/browser roles must not call it.

## Separate disbursement stage

Disbursement should be an explicit, authorized operation after the real transfer has been confirmed. It should record the reference, actor, timestamp, amount, and reconciliation outcome, and be idempotent so a retry cannot create a duplicate transfer record. Do not automatically mark funds as completed merely because an admin clicked Approve.

## Required follow-up before implementation

1. Reconcile and validate migration history in PR #25 / issue #20.
2. Generate the actual migration with Supabase CLI; do not copy this proposal directly into the active migration folder.
3. Validate on a non-production database that matches the reconciled schema.
4. Add free tests for allowed/blocked status transitions and approval retries.
5. Verify admin UI messaging distinguishes **Approved** from **Disbursed**.
6. Keep EMI-related changes deferred, per user direction.

## Acceptance checks

- [ ] Pending → approved updates the application once and creates no transaction.
- [ ] Under review → approved updates the application once and creates no transaction.
- [ ] Action required → approved is permitted only after applicant resubmission/review policy is agreed.
- [ ] Repeating approval is idempotent.
- [ ] Rejected/cancelled/completed → approved is rejected.
- [ ] Applicant/anon roles cannot execute the privileged RPC.
- [ ] Disbursement is only recorded by a separate authorized workflow after actual transfer confirmation.
