-- Fase 7: terapkan aturan Settings pada business logic.
-- Jalankan setelah 0005_settings.sql dan 0003_reservations_fines.sql.

CREATE OR REPLACE FUNCTION public.borrow_book(
  p_user_id uuid,
  p_book_id uuid,
  p_due_days integer DEFAULT NULL
)
RETURNS public.borrowings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member public.profiles;
  v_book public.books;
  v_settings public.library_settings;
  v_active_count integer;
  v_due_at timestamptz;
  v_record public.borrowings;
  v_due_days integer;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Hanya petugas/admin yang dapat memproses peminjaman.'; END IF;
  SELECT * INTO v_settings FROM public.library_settings WHERE id = true;
  v_due_days := COALESCE(p_due_days, v_settings.loan_duration_days, 14);
  IF v_due_days <= 0 THEN RAISE EXCEPTION 'Durasi pinjam tidak valid.'; END IF;

  SELECT * INTO v_member FROM public.profiles WHERE id = p_user_id AND is_active = true;
  IF v_member.id IS NULL THEN RAISE EXCEPTION 'Anggota tidak ditemukan atau akun sedang tidak aktif.'; END IF;
  SELECT * INTO v_book FROM public.books WHERE id = p_book_id FOR UPDATE;
  IF v_book.id IS NULL THEN RAISE EXCEPTION 'Buku tidak ditemukan.'; END IF;
  IF v_book.available_copies <= 0 THEN RAISE EXCEPTION 'Buku tidak tersedia saat ini.'; END IF;

  SELECT count(*) INTO v_active_count FROM public.borrowings WHERE user_id = p_user_id AND status = 'active';
  IF v_active_count >= COALESCE(v_settings.max_active_borrowings, 3) THEN
    RAISE EXCEPTION 'Anggota sudah mencapai batas maksimal peminjaman aktif.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.borrowings WHERE user_id = p_user_id AND status = 'active' AND due_at < now()) THEN
    RAISE EXCEPTION 'Anggota masih memiliki peminjaman yang terlambat.';
  END IF;

  v_due_at := now() + make_interval(days => v_due_days);
  UPDATE public.books SET available_copies = available_copies - 1, updated_at = now() WHERE id = p_book_id AND available_copies > 0;
  INSERT INTO public.borrowings (user_id, book_id, due_at, status, fine_amount, notes)
  VALUES (p_user_id, p_book_id, v_due_at, 'active', 0, NULL)
  RETURNING * INTO v_record;
  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.borrow_book(uuid, uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_book(p_book_id uuid)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book public.books;
  v_profile public.profiles;
  v_settings public.library_settings;
  v_active_count integer;
  v_record public.reservations;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid() AND is_active = true;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'Akun anggota tidak ditemukan atau tidak aktif.'; END IF;
  IF public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Reservasi hanya tersedia untuk anggota.'; END IF;
  SELECT * INTO v_settings FROM public.library_settings WHERE id = true;
  PERFORM public.refresh_reservation_queue(p_book_id);
  SELECT * INTO v_book FROM public.books WHERE id = p_book_id FOR UPDATE;
  IF v_book.id IS NULL THEN RAISE EXCEPTION 'Buku tidak ditemukan.'; END IF;
  IF v_book.available_copies > 0 THEN RAISE EXCEPTION 'Buku masih tersedia untuk dipinjam.'; END IF;

  SELECT count(*) INTO v_active_count FROM public.reservations WHERE user_id = auth.uid() AND status IN ('waiting', 'ready');
  IF v_active_count >= COALESCE(v_settings.max_active_reservations, 2) THEN
    RAISE EXCEPTION 'Anda sudah mencapai batas maksimal reservasi aktif.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.reservations WHERE user_id = auth.uid() AND book_id = p_book_id AND status IN ('waiting', 'ready')) THEN
    RAISE EXCEPTION 'Anda sudah memiliki reservasi aktif untuk buku ini.';
  END IF;

  INSERT INTO public.reservations (user_id, book_id) VALUES (auth.uid(), p_book_id) RETURNING * INTO v_record;
  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_book(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.return_book(p_borrowing_id uuid)
RETURNS public.borrowings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_borrowing public.borrowings;
  v_book public.books;
  v_settings public.library_settings;
  v_late_days integer;
  v_fine_amount numeric(10,2);
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Hanya petugas/admin yang dapat memproses pengembalian.'; END IF;
  SELECT * INTO v_borrowing FROM public.borrowings WHERE id = p_borrowing_id FOR UPDATE;
  IF v_borrowing.id IS NULL THEN RAISE EXCEPTION 'Transaksi peminjaman tidak ditemukan.'; END IF;
  IF v_borrowing.status = 'returned' THEN RAISE EXCEPTION 'Buku ini sudah dikembalikan.'; END IF;
  SELECT * INTO v_book FROM public.books WHERE id = v_borrowing.book_id FOR UPDATE;
  SELECT * INTO v_settings FROM public.library_settings WHERE id = true;
  v_late_days := greatest(0, extract(day FROM (now() - v_borrowing.due_at))::int);
  v_fine_amount := v_late_days * COALESCE(v_settings.fine_per_day, 2000.00);

  UPDATE public.borrowings SET returned_at = now(), status = 'returned', fine_amount = v_fine_amount, updated_at = now() WHERE id = p_borrowing_id;
  UPDATE public.books SET available_copies = available_copies + 1, updated_at = now() WHERE id = v_borrowing.book_id;
  IF v_fine_amount > 0 THEN
    INSERT INTO public.fines (borrowing_id, user_id, amount) VALUES (v_borrowing.id, v_borrowing.user_id, v_fine_amount)
    ON CONFLICT (borrowing_id) DO UPDATE SET amount = EXCLUDED.amount, updated_at = now();
  END IF;
  PERFORM public.refresh_reservation_queue(v_borrowing.book_id);
  SELECT * INTO v_borrowing FROM public.borrowings WHERE id = p_borrowing_id;
  RETURN v_borrowing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO authenticated;
