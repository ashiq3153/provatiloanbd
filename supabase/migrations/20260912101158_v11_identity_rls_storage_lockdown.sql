-- v1.1 identity-bound RLS and private storage lockdown. Existing records are preserved.
CREATE OR REPLACE FUNCTION public.current_telegram_chat_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT ti.telegram_chat_id FROM public.telegram_identities ti WHERE ti.auth_user_id = auth.uid() LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.current_telegram_chat_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_telegram_chat_id() TO authenticated;
DO $$ DECLARE t text; p record; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','loan_applications','transactions','support_messages','system_settings','admin_status','success_stories'] LOOP
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',p.policyname,t); END LOOP;
 END LOOP;
END $$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_owner_select ON public.profiles FOR SELECT TO authenticated USING (chat_id=public.current_telegram_chat_id());
CREATE POLICY profiles_owner_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (chat_id=public.current_telegram_chat_id());
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE TO authenticated USING (chat_id=public.current_telegram_chat_id()) WITH CHECK (chat_id=public.current_telegram_chat_id());
CREATE POLICY loans_owner_select ON public.loan_applications FOR SELECT TO authenticated USING (chat_id=public.current_telegram_chat_id());
CREATE POLICY loans_owner_insert ON public.loan_applications FOR INSERT TO authenticated WITH CHECK (chat_id=public.current_telegram_chat_id());
CREATE POLICY loans_owner_update ON public.loan_applications FOR UPDATE TO authenticated USING (chat_id=public.current_telegram_chat_id()) WITH CHECK (chat_id=public.current_telegram_chat_id());
CREATE POLICY transactions_owner_select ON public.transactions FOR SELECT TO authenticated USING (chat_id=public.current_telegram_chat_id());
CREATE POLICY transactions_owner_insert ON public.transactions FOR INSERT TO authenticated WITH CHECK (chat_id=public.current_telegram_chat_id());
CREATE POLICY support_owner_select ON public.support_messages FOR SELECT TO authenticated USING (chat_id=public.current_telegram_chat_id());
CREATE POLICY support_owner_insert ON public.support_messages FOR INSERT TO authenticated WITH CHECK (chat_id=public.current_telegram_chat_id());
CREATE POLICY system_settings_authenticated_read ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY success_stories_public_read ON public.success_stories FOR SELECT TO anon, authenticated USING (true);
UPDATE storage.buckets SET public=false WHERE id IN ('loan_documents','deposit_screenshots');
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects',p.policyname); END LOOP;
END $$;
CREATE POLICY private_loan_docs_owner_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='loan_documents' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text);
CREATE POLICY private_loan_docs_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='loan_documents' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text);
CREATE POLICY private_loan_docs_owner_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='loan_documents' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text) WITH CHECK (bucket_id='loan_documents' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text);
CREATE POLICY private_deposit_owner_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='deposit_screenshots' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text);
CREATE POLICY private_deposit_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='deposit_screenshots' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text);
CREATE POLICY private_deposit_owner_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='deposit_screenshots' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text) WITH CHECK (bucket_id='deposit_screenshots' AND (storage.foldername(name))[1]=public.current_telegram_chat_id()::text);