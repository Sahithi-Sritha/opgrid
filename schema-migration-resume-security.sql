-- Run after schema-migration-resume-engine.sql and schema-migration-auth-rls.sql.
-- Resumes remain private and can only be accessed by their authenticated owner.
ALTER TABLE public.resume_versions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS resume_owner_storage ON storage.objects;
CREATE POLICY resume_owner_storage ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
