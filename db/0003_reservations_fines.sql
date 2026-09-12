-- Fase 5: Reservasi & denda.
-- Jalankan setelah 0002_borrowings.sql di SQL Editor Supabase.

DO $$
BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('waiting', 'ready', 'completed', 'cancelled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.fine_status AS ENUM ('unpaid', 'paid', 'waived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status public.reservation_status NOT NULL DEFAULT 'waiting',
  reserved_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  expires_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_book_queue_idx
  ON public.reservations (book_id, status, reserved_at);
CREATE INDEX IF NOT EXISTS reservations_user_status_idx
  ON public.reservations (user_id, status, reserved_at);
CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_open_per_user_book_idx
  ON public.reservations (user_id, book_id)
  WHERE status IN ('waiting', 'ready');

GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own reservations" ON public.reservations;
CREATE POLICY "Members can read own reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can read all reservations" ON public.reservations;
CREATE POLICY "Staff can read all reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Members can insert own reservations" ON public.reservations;
CREATE POLICY "Members can insert own reservations"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Members can cancel own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON public.reservations;
CREATE POLICY "Staff can update reservations"
  ON public.reservations FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrowing_id uuid NOT NULL UNIQUE REFERENCES public.borrowings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  status public.fine_status NOT NULL DEFAULT 'unpaid',
  paid_at timestamptz,
  waived_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fines_user_status_idx
  ON public.fines (user_id, status, created_at DESC);

INSERT INTO public.fines (borrowing_id, user_id, amount)
SELECT b.id, b.user_id, b.fine_amount
FROM public.borrowings b
WHERE b.fine_amount > 0
ON CONFLICT (borrowing_id) DO NOTHING;

GRANT SELECT, UPDATE ON public.fines TO authenticated;
GRANT ALL ON public.fines TO service_role;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own fines" ON public.fines;
CREATE POLICY "Members can read own fines"
  ON public.fines FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can read all fines" ON public.fines;
CREATE POLICY "Staff can read all fines"
  ON public.fines FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update fines" ON public.fines;
CREATE POLICY "Staff can update fines"
  ON public.fines FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_fine_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    NEW.paid_at = COALESCE(NEW.paid_at, now());
    NEW.waived_at = NULL;
  ELSIF NEW.status = 'waived' AND OLD.status <> 'waived' THEN
    NEW.waived_at = COALESCE(NEW.waived_at, now());
    NEW.paid_at = NULL;
  ELSIF NEW.status = 'unpaid' AND OLD.status <> 'unpaid' THEN
    NEW.paid_at = NULL;
    NEW.waived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_public_fines_updated_at ON public.fines;
CREATE TRIGGER set_public_fines_updated_at
BEFORE UPDATE ON public.fines
FOR EACH ROW EXECUTE FUNCTION public.set_fine_timestamps();

DROP TRIGGER IF EXISTS set_public_reservations_updated_at ON public.reservations;
CREATE TRIGGER set_public_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_reservation_queue(p_book_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book_id uuid;
  v_reservation public.reservations;
BEGIN
  IF NOT public.is_staff(auth.uid()) AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesi pengguna tidak valid.';
  END IF;

  FOR v_book_id IN
    SELECT DISTINCT r.book_id
    FROM public.reservations r
    WHERE p_book_id IS NULL OR r.book_id = p_book_id
  LOOP
    UPDATE public.reservations
    SET status = 'expired', updated_at = now()
    WHERE book_id = v_book_id
      AND status = 'ready'
      AND expires_at IS NOT NULL
      AND expires_at < now();

    IF EXISTS (
      SELECT 1 FROM public.books
      WHERE id = v_book_id AND available_copies > 0
    ) AND NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE book_id = v_book_id AND status = 'ready'
    ) THEN
      SELECT * INTO v_reservation
      FROM public.reservations
      WHERE book_id = v_book_id
        AND status = 'waiting'
      ORDER BY reserved_at, id
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF v_reservation.id IS NOT NULL THEN
        UPDATE public.reservations
        SET status = 'ready', ready_at = now(), expires_at = now() + interval '2 days', updated_at = now()
        WHERE id = v_reservation.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_reservation_queues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_reservation_queue(NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_reservation_queue(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_reservation_queues() TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_book(p_book_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book public.books;
  v_profile public.profiles;
  v_record public.reservations;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid() AND is_active = true;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Akun anggota tidak ditemukan atau tidak aktif.';
  END IF;
  IF public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Reservasi hanya tersedia untuk anggota.';
  END IF;

  PERFORM public.refresh_reservation_queue(p_book_id);
  SELECT * INTO v_book FROM public.books WHERE id = p_book_id FOR UPDATE;
  IF v_book.id IS NULL THEN RAISE EXCEPTION 'Buku tidak ditemukan.'; END IF;
  IF v_book.available_copies > 0 THEN RAISE EXCEPTION 'Buku masih tersedia untuk dipinjam.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE user_id = auth.uid() AND book_id = p_book_id AND status IN ('waiting', 'ready')
  ) THEN
    RAISE EXCEPTION 'Anda sudah memiliki reservasi aktif untuk buku ini.';
  END IF;

  INSERT INTO public.reservations (user_id, book_id)
  VALUES (auth.uid(), p_book_id)
  RETURNING * INTO v_record;
  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_book(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.reservations;
BEGIN
  SELECT * INTO v_record
  FROM public.reservations
  WHERE id = p_reservation_id
    AND user_id = auth.uid()
    AND status IN ('waiting', 'ready')
  FOR UPDATE;
  IF v_record.id IS NULL THEN RAISE EXCEPTION 'Reservasi aktif tidak ditemukan.'; END IF;

  UPDATE public.reservations
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE id = p_reservation_id
  RETURNING * INTO v_record;
  PERFORM public.refresh_reservation_queue(v_record.book_id);
  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_reservation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_reservation(p_reservation_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.reservations;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Hanya petugas/admin yang dapat menyelesaikan reservasi.'; END IF;
  UPDATE public.reservations
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_reservation_id AND status = 'ready'
  RETURNING * INTO v_record;
  IF v_record.id IS NULL THEN RAISE EXCEPTION 'Reservasi ready tidak ditemukan.'; END IF;
  PERFORM public.refresh_reservation_queue(v_record.book_id);
  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_reservation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_fine_status(p_fine_id uuid, p_status public.fine_status)
RETURNS public.fines
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.fines;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Hanya petugas/admin yang dapat mengubah status denda.'; END IF;
  UPDATE public.fines SET status = p_status WHERE id = p_fine_id RETURNING * INTO v_record;
  IF v_record.id IS NULL THEN RAISE EXCEPTION 'Denda tidak ditemukan.'; END IF;
  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_fine_status(uuid, public.fine_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.return_book(p_borrowing_id uuid)
RETURNS public.borrowings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_borrowing public.borrowings;
  v_book public.books;
  v_late_days integer;
  v_fine_amount numeric(10,2);
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Hanya petugas/admin yang dapat memproses pengembalian.';
  END IF;
  SELECT * INTO v_borrowing FROM public.borrowings WHERE id = p_borrowing_id FOR UPDATE;
  IF v_borrowing.id IS NULL THEN RAISE EXCEPTION 'Transaksi peminjaman tidak ditemukan.'; END IF;
  IF v_borrowing.status = 'returned' THEN RAISE EXCEPTION 'Buku ini sudah dikembalikan.'; END IF;

  SELECT * INTO v_book FROM public.books WHERE id = v_borrowing.book_id FOR UPDATE;
  v_late_days := greatest(0, extract(day from (now() - v_borrowing.due_at))::int);
  v_fine_amount := v_late_days * 2000.00;

  UPDATE public.borrowings
  SET returned_at = now(), status = 'returned', fine_amount = v_fine_amount, updated_at = now()
  WHERE id = p_borrowing_id;
  UPDATE public.books
  SET available_copies = available_copies + 1, updated_at = now()
  WHERE id = v_borrowing.book_id;

  IF v_fine_amount > 0 THEN
    INSERT INTO public.fines (borrowing_id, user_id, amount)
    VALUES (v_borrowing.id, v_borrowing.user_id, v_fine_amount)
    ON CONFLICT (borrowing_id) DO UPDATE SET amount = EXCLUDED.amount, updated_at = now();
  END IF;

  PERFORM public.refresh_reservation_queue(v_borrowing.book_id);
  SELECT * INTO v_borrowing FROM public.borrowings WHERE id = p_borrowing_id;
  RETURN v_borrowing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO authenticated;
