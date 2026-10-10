-- Prevent the same payment transaction ID (bKash/Nagad/Rocket trx_id) from being submitted more than once
-- Scoped to non-null, non-rejected/cancelled trx_id so legitimate resubmission after rejection is still possible
CREATE UNIQUE INDEX IF NOT EXISTS transactions_trx_id_unique_active
ON public.transactions (trx_id)
WHERE trx_id IS NOT NULL AND status IN ('pending','completed');