-- Provatiloanbd v1.1 Phase 1 — Security & data-integrity migration source
-- IMPORTANT: v1.0 main remains unchanged. Apply only on v1.1 development branch.

-- Data integrity guardrails
ALTER TABLE public.loan_applications
  ADD CONSTRAINT loan_applications_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT loan_applications_tenure_positive CHECK (tenure_months > 0),
  ADD CONSTRAINT loan_applications_status_valid CHECK (status IN ('pending','approved','rejected','cancelled','completed'));

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT transactions_type_valid CHECK (type IN ('deposit','withdraw','emi_payment','disbursement')),
  ADD CONSTRAINT transactions_status_valid CHECK (status IN ('pending','completed','rejected','cancelled','failed'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_one_disbursement_per_loan
  ON public.transactions(loan_id)
  WHERE type = 'disbursement' AND loan_id IS NOT NULL;

-- Atomic loan approval + disbursement.
CREATE OR REPLACE FUNCTION public.approve_loan_atomic(
  p_loan_id uuid,
  p_feedback text DEFAULT NULL
)
RETURNS public.loan_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan public.loan_applications;
BEGIN
  SELECT * INTO v_loan
  FROM public.loan_applications
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan application not found';
  END IF;

  IF v_loan.status <> 'approved' THEN
    UPDATE public.loan_applications
    SET status = 'approved',
        admin_feedback = COALESCE(p_feedback, admin_feedback),
        approved_at = COALESCE(approved_at, now())
    WHERE id = p_loan_id
    RETURNING * INTO v_loan;
  END IF;

  INSERT INTO public.transactions (chat_id, loan_id, type, amount, status)
  VALUES (v_loan.chat_id, v_loan.id, 'disbursement', v_loan.amount, 'completed')
  ON CONFLICT DO NOTHING;

  RETURN v_loan;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_loan_atomic(uuid, text) FROM PUBLIC, anon, authenticated;

-- Prevent anonymous/authenticated clients from invoking the SECURITY DEFINER helper
-- used by the legacy RLS bootstrap mechanism.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
