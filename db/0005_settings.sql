-- Fase 7: pengaturan perpustakaan.
-- Jalankan setelah migration Fase 6.

CREATE TABLE IF NOT EXISTS public.library_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  library_name text NOT NULL DEFAULT 'Perpustakaan',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  max_active_borrowings integer NOT NULL DEFAULT 3 CHECK (max_active_borrowings BETWEEN 1 AND 50),
  loan_duration_days integer NOT NULL DEFAULT 14 CHECK (loan_duration_days BETWEEN 1 AND 365),
  fine_per_day numeric(10,2) NOT NULL DEFAULT 2000 CHECK (fine_per_day >= 0),
  max_active_reservations integer NOT NULL DEFAULT 2 CHECK (max_active_reservations BETWEEN 1 AND 20),
  default_theme text NOT NULL DEFAULT 'system' CHECK (default_theme IN ('light', 'dark', 'system')),
  compact_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.library_settings (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.library_settings TO authenticated;
GRANT ALL ON public.library_settings TO service_role;
ALTER TABLE public.library_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read library settings" ON public.library_settings;
CREATE POLICY "Admins can read library settings"
  ON public.library_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert library settings" ON public.library_settings;
CREATE POLICY "Admins can insert library settings"
  ON public.library_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update library settings" ON public.library_settings;
CREATE POLICY "Admins can update library settings"
  ON public.library_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_library_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_library_settings_updated_at ON public.library_settings;
CREATE TRIGGER set_library_settings_updated_at
BEFORE UPDATE ON public.library_settings
FOR EACH ROW EXECUTE FUNCTION public.set_library_settings_updated_at();
