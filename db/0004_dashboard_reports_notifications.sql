-- Fase 6: dashboard, laporan, dan notifikasi.
-- Jalankan setelah migration Fase 5.

DO $$
BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'borrowed', 'returned', 'due_soon', 'overdue', 'reservation_ready', 'fine_created'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  dedupe_key text UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications (user_id, read_at) WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_link text,
  p_dedupe_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, dedupe_key)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_dedupe_key)
  ON CONFLICT (dedupe_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_borrowing_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  SELECT title INTO v_title FROM public.books WHERE id = NEW.book_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.user_id, 'borrowed', 'Peminjaman tercatat',
      format('Buku "%s" berhasil dipinjam.', coalesce(v_title, 'tanpa judul')),
      '/peminjaman/aktif', 'borrowing-borrowed-' || NEW.id::text
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'returned' AND NEW.status = 'returned' THEN
    PERFORM public.create_notification(
      NEW.user_id, 'returned', 'Buku dikembalikan',
      format('Buku "%s" sudah tercatat dikembalikan.', coalesce(v_title, 'tanpa judul')),
      '/peminjaman/riwayat', 'borrowing-returned-' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_borrowing_event_trigger ON public.borrowings;
CREATE TRIGGER notify_borrowing_event_trigger
AFTER INSERT OR UPDATE OF status ON public.borrowings
FOR EACH ROW EXECUTE FUNCTION public.notify_borrowing_event();

CREATE OR REPLACE FUNCTION public.notify_reservation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> 'ready' AND NEW.status = 'ready' THEN
    SELECT title INTO v_title FROM public.books WHERE id = NEW.book_id;
    PERFORM public.create_notification(
      NEW.user_id, 'reservation_ready', 'Reservasi siap diambil',
      format('Buku "%s" sudah tersedia. Silakan ambil sebelum masa siap berakhir.', coalesce(v_title, 'tanpa judul')),
      '/reservasi', 'reservation-ready-' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_reservation_event_trigger ON public.reservations;
CREATE TRIGGER notify_reservation_event_trigger
AFTER UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_event();

CREATE OR REPLACE FUNCTION public.notify_fine_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id, 'fine_created', 'Denda baru tercatat',
    format('Denda sebesar Rp %s tercatat pada akun Anda.', to_char(NEW.amount, 'FM999G999G999')),
    '/denda', 'fine-created-' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_fine_event_trigger ON public.fines;
CREATE TRIGGER notify_fine_event_trigger
AFTER INSERT ON public.fines
FOR EACH ROW EXECUTE FUNCTION public.notify_fine_event();

CREATE OR REPLACE FUNCTION public.generate_due_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_borrowing record;
  v_title text;
  v_type public.notification_type;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sesi pengguna tidak valid.'; END IF;
  FOR v_borrowing IN
    SELECT b.id, b.user_id, b.book_id, b.due_at
    FROM public.borrowings b
    WHERE b.status = 'active' AND b.due_at <= now() + interval '2 days'
  LOOP
    SELECT title INTO v_title FROM public.books WHERE id = v_borrowing.book_id;
    IF v_borrowing.due_at < now() THEN
      v_type := 'overdue';
      PERFORM public.create_notification(
        v_borrowing.user_id, v_type, 'Peminjaman terlambat',
        format('Buku "%s" sudah melewati batas pengembalian.', coalesce(v_title, 'tanpa judul')),
        '/peminjaman/aktif', 'borrowing-overdue-' || v_borrowing.id::text
      );
    ELSE
      v_type := 'due_soon';
      PERFORM public.create_notification(
        v_borrowing.user_id, v_type, 'Jatuh tempo mendekat',
        format('Buku "%s" jatuh tempo pada %s.', coalesce(v_title, 'tanpa judul'), to_char(v_borrowing.due_at, 'DD Mon YYYY')),
        '/peminjaman/aktif', 'borrowing-due-soon-' || v_borrowing.id::text
      );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_due_notifications() TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Hanya staff yang dapat melihat dashboard operasional.'; END IF;
  SELECT jsonb_build_object(
    'stats', jsonb_build_object(
      'total_books', (SELECT count(*) FROM public.books),
      'total_members', (SELECT count(DISTINCT p.id) FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.id WHERE ur.role = 'anggota'),
      'available_copies', (SELECT coalesce(sum(available_copies), 0) FROM public.books),
      'borrowed_copies', (SELECT coalesce(sum(total_copies - available_copies), 0) FROM public.books),
      'active_borrowings', (SELECT count(*) FROM public.borrowings WHERE status = 'active'),
      'overdue_borrowings', (SELECT count(*) FROM public.borrowings WHERE status = 'active' AND due_at < now()),
      'unpaid_fines', (SELECT coalesce(sum(amount), 0) FROM public.fines WHERE status = 'unpaid'),
      'active_reservations', (SELECT count(*) FROM public.reservations WHERE status IN ('waiting', 'ready'))
    ),
    'monthly_borrowings', coalesce((
      SELECT jsonb_agg(jsonb_build_object('month', to_char(month_start, 'YYYY-MM'), 'label', to_char(month_start, 'Mon YY'), 'count', total) ORDER BY month_start)
      FROM (
        SELECT date_trunc('month', gs)::date AS month_start,
               (SELECT count(*) FROM public.borrowings b WHERE date_trunc('month', b.borrowed_at)::date = date_trunc('month', gs)::date) AS total
        FROM generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') gs
      ) monthly
    ), '[]'::jsonb),
    'popular_books', coalesce((
      SELECT jsonb_agg(jsonb_build_object('title', title, 'count', total) ORDER BY total DESC)
      FROM (
        SELECT bk.title, count(*) AS total
        FROM public.borrowings b JOIN public.books bk ON bk.id = b.book_id
        GROUP BY bk.id, bk.title ORDER BY total DESC LIMIT 5
      ) popular
    ), '[]'::jsonb),
    'recent_activity', coalesce((
      SELECT jsonb_agg(jsonb_build_object('type', activity_type, 'title', title, 'user_name', user_name, 'created_at', created_at) ORDER BY created_at DESC)
      FROM (
        SELECT 'borrowed' AS activity_type, bk.title, p.full_name AS user_name, b.created_at
        FROM public.borrowings b JOIN public.books bk ON bk.id = b.book_id JOIN public.profiles p ON p.id = b.user_id
        UNION ALL
        SELECT 'returned' AS activity_type, bk.title, p.full_name AS user_name, b.returned_at AS created_at
        FROM public.borrowings b JOIN public.books bk ON bk.id = b.book_id JOIN public.profiles p ON p.id = b.user_id
        WHERE b.returned_at IS NOT NULL
        UNION ALL
        SELECT 'fine' AS activity_type, 'Denda baru' AS title, p.full_name AS user_name, f.created_at
        FROM public.fines f JOIN public.profiles p ON p.id = f.user_id
        ORDER BY created_at DESC LIMIT 8
      ) recent
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.library_report(
  p_report_type text,
  p_from date DEFAULT (current_date - 30),
  p_to date DEFAULT current_date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Hanya staff yang dapat melihat laporan.'; END IF;
  IF p_report_type = 'borrowings' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.event_at DESC) FROM (
      SELECT b.id, p.full_name AS member, bk.title AS book, b.borrowed_at AS event_at, b.due_at, b.status
      FROM public.borrowings b JOIN public.profiles p ON p.id = b.user_id JOIN public.books bk ON bk.id = b.book_id
      WHERE b.borrowed_at::date BETWEEN p_from AND p_to
    ) q), '[]'::jsonb);
  ELSIF p_report_type = 'returns' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.event_at DESC) FROM (
      SELECT b.id, p.full_name AS member, bk.title AS book, b.returned_at AS event_at, b.fine_amount
      FROM public.borrowings b JOIN public.profiles p ON p.id = b.user_id JOIN public.books bk ON bk.id = b.book_id
      WHERE b.returned_at IS NOT NULL AND b.returned_at::date BETWEEN p_from AND p_to
    ) q), '[]'::jsonb);
  ELSIF p_report_type = 'overdue' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.due_at) FROM (
      SELECT b.id, p.full_name AS member, bk.title AS book, b.due_at, b.returned_at,
        greatest(0, extract(day FROM (coalesce(b.returned_at, now()) - b.due_at))::int) AS late_days
      FROM public.borrowings b JOIN public.profiles p ON p.id = b.user_id JOIN public.books bk ON bk.id = b.book_id
      WHERE b.due_at::date BETWEEN p_from AND p_to AND (b.returned_at IS NULL OR b.returned_at > b.due_at)
    ) q), '[]'::jsonb);
  ELSIF p_report_type = 'fines' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC) FROM (
      SELECT f.id, p.full_name AS member, bk.title AS book, f.amount, f.status, f.created_at
      FROM public.fines f JOIN public.profiles p ON p.id = f.user_id
      JOIN public.borrowings b ON b.id = f.borrowing_id JOIN public.books bk ON bk.id = b.book_id
      WHERE f.created_at::date BETWEEN p_from AND p_to
    ) q), '[]'::jsonb);
  ELSIF p_report_type = 'popular_books' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.borrow_count DESC) FROM (
      SELECT bk.title AS book, count(b.id) AS borrow_count
      FROM public.borrowings b JOIN public.books bk ON bk.id = b.book_id
      WHERE b.borrowed_at::date BETWEEN p_from AND p_to GROUP BY bk.id, bk.title
    ) q), '[]'::jsonb);
  ELSIF p_report_type = 'active_members' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.borrow_count DESC) FROM (
      SELECT p.full_name AS member, p.member_code, count(b.id) AS borrow_count
      FROM public.borrowings b JOIN public.profiles p ON p.id = b.user_id
      WHERE b.borrowed_at::date BETWEEN p_from AND p_to GROUP BY p.id, p.full_name, p.member_code
    ) q), '[]'::jsonb);
  ELSIF p_report_type = 'stock' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.title) FROM (
      SELECT title, total_copies, available_copies, total_copies - available_copies AS borrowed_copies
      FROM public.books
    ) q), '[]'::jsonb);
  END IF;
  RAISE EXCEPTION 'Jenis laporan tidak dikenal.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.library_report(text, date, date) TO authenticated;
