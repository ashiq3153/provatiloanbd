CREATE OR REPLACE FUNCTION public.approve_loan_atomic(p_loan_id uuid, p_feedback text DEFAULT NULL::text)
RETURNS public.loan_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_loan public.loan_applications;
BEGIN
  SELECT * INTO v_loan FROM public.loan_applications WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan application not found'; END IF;
  IF v_loan.status = 'approved' THEN RETURN v_loan; END IF;

  UPDATE public.loan_applications
  SET status = 'approved', admin_feedback = p_feedback, approved_at = COALESCE(approved_at, NOW())
  WHERE id = p_loan_id
  RETURNING * INTO v_loan;

  INSERT INTO public.transactions (chat_id, loan_id, type, amount, payment_method, sender_number, trx_id, status)
  VALUES (v_loan.chat_id, v_loan.id, 'disbursement', v_loan.amount, 'bank', v_loan.account_number,
          'DISB-' || UPPER(SUBSTRING(v_loan.id::text, 1, 8)), 'completed')
  ON CONFLICT DO NOTHING;
  RETURN v_loan;
END;
$function$;