-- Approval is not a payout. Approved loan amounts are calculated from
-- loan_applications by the secure withdrawal-balance endpoint. A payout is
-- finalized only when an administrator completes the separate withdrawal.
CREATE OR REPLACE FUNCTION public.approve_loan_atomic(
  p_loan_id uuid,
  p_feedback text DEFAULT NULL
)
RETURNS public.loan_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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

  -- Keep retries idempotent. Do not turn active/paid/rejected loans back into
  -- approved applications.
  IF v_loan.status = 'active' THEN
    RETURN v_loan;
  END IF;

  IF v_loan.status NOT IN ('pending', 'under_review', 'approved') THEN
    RAISE EXCEPTION 'Loan application cannot be approved from status %', v_loan.status;
  END IF;

  UPDATE public.loan_applications
  SET status = 'approved',
      admin_feedback = COALESCE(p_feedback, admin_feedback),
      approved_at = COALESCE(approved_at, NOW())
  WHERE id = p_loan_id
  RETURNING * INTO v_loan;

  -- Intentionally do not create a completed 'disbursement' transaction here.
  -- Approval makes the approved amount available to request; actual payout is
  -- represented by the member's withdrawal transaction after the admin pays it.
  RETURN v_loan;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.approve_loan_atomic(uuid, text) FROM PUBLIC, anon, authenticated;

-- When a paid withdrawal belongs to a single approved loan, move the loan
-- lifecycle to Active. This is the disbursement point; it is not repayment.
CREATE OR REPLACE FUNCTION public.finalize_completed_transaction(p_transaction_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_tx public.transactions;
BEGIN
  SELECT * INTO v_tx
  FROM public.transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND OR v_tx.status <> 'completed' THEN
    RETURN false;
  END IF;

  IF v_tx.type = 'emi_payment' THEN
    PERFORM public.apply_completed_emi_to_schedule(v_tx.id);
  ELSIF v_tx.type = 'withdraw' AND v_tx.loan_id IS NOT NULL THEN
    UPDATE public.loan_applications
    SET status = 'active',
        approved_at = COALESCE(approved_at, NOW())
    WHERE id = v_tx.loan_id
      AND status = 'approved';
  END IF;

  RETURN true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.finalize_completed_transaction(uuid) FROM PUBLIC, anon, authenticated;
