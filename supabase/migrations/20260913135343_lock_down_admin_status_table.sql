-- Remove write access for anon/authenticated; only service_role (backend) should update admin online status
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.admin_status FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.admin_status FROM authenticated;

-- Add explicit RLS policy: anyone can read admin online status (low-sensitivity, used for "support online" indicator)
CREATE POLICY admin_status_public_read ON public.admin_status
  FOR SELECT
  TO anon, authenticated
  USING (true);