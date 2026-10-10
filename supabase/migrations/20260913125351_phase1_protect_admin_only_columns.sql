
-- Block applicants/members from writing admin-only columns on their own rows.
-- Row-level ownership policies (chat_id = current_telegram_chat_id()) only restrict
-- *which rows* a user can touch, not *which columns* — this closes that gap.

CREATE OR REPLACE FUNCTION public.protect_loan_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'Loan application can no longer be modified by the applicant';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback
     OR NEW.interest_rate IS DISTINCT FROM OLD.interest_rate
     OR NEW.emi_amount IS DISTINCT FROM OLD.emi_amount
     OR NEW.processing_fee IS DISTINCT FROM OLD.processing_fee
     OR NEW.security_deposit IS DISTINCT FROM OLD.security_deposit
     OR NEW.chat_id IS DISTINCT FROM OLD.chat_id
  THEN
    RAISE EXCEPTION 'Applicants cannot modify administrative loan fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_loan_admin_fields ON public.loan_applications;
CREATE TRIGGER trg_protect_loan_admin_fields
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_loan_admin_fields();

CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned
     OR NEW.is_locked IS DISTINCT FROM OLD.is_locked
     OR NEW.lock_reason IS DISTINCT FROM OLD.lock_reason
     OR NEW.chat_id IS DISTINCT FROM OLD.chat_id
  THEN
    RAISE EXCEPTION 'Applicants cannot modify protected profile fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_admin_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- Also tighten the earlier advisor warning: the RPC is safe by design (only ever
-- returns the caller's own mapped chat_id) but should not be reachable by anon.
REVOKE EXECUTE ON FUNCTION public.current_telegram_chat_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_telegram_chat_id() TO authenticated;
