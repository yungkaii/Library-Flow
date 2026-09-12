-- Fase 7: seed data realistis.
-- Jalankan setelah seluruh migration Fase 1-5. Aman dijalankan ulang untuk katalog.
-- Data transaksi memakai akun anggota yang sudah ada di public.profiles.

INSERT INTO public.categories (name, description) VALUES
  ('Fiksi', 'Novel, cerpen, dan karya sastra.'),
  ('Teknologi', 'Pemrograman, data, dan teknologi informasi.'),
  ('Sains', 'Pengetahuan alam dan ilmu terapan.'),
  ('Sejarah', 'Sejarah Indonesia dan dunia.'),
  ('Bisnis', 'Manajemen, kewirausahaan, dan ekonomi.'),
  ('Anak', 'Bacaan edukatif dan cerita anak.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.publishers (name, address, website, contact)
SELECT source.name, source.address, source.website, source.contact
FROM (VALUES
  ('Gramedia Pustaka Utama', 'Jakarta', 'https://www.gramedia.com', '+62 21 53650110'),
  ('Mizan Publishing', 'Bandung', 'https://mizan.com', '+62 22 7831456'),
  ('Elex Media Komputindo', 'Jakarta', 'https://elexmedia.id', '+62 21 53650110'),
  ('Bentang Pustaka', 'Yogyakarta', 'https://bentangpustaka.com', '+62 274 889456'),
  ('Penerbit Buku Kompas', 'Jakarta', 'https://kompas.id', '+62 21 5347710')
) AS source(name, address, website, contact)
WHERE NOT EXISTS (SELECT 1 FROM public.publishers p WHERE p.name = source.name);

INSERT INTO public.authors (name, biography)
SELECT source.name, source.biography
FROM (VALUES
  ('Andrea Hirata', 'Penulis novel Indonesia.'),
  ('Dee Lestari', 'Penulis dan penyanyi Indonesia.'),
  ('Tere Liye', 'Penulis novel populer Indonesia.'),
  ('B.J. Habibie', 'Tokoh teknologi dan presiden Indonesia.'),
  ('Andrew Hunt', 'Penulis buku pengembangan perangkat lunak.'),
  ('David Thomas', 'Penulis dan praktisi rekayasa perangkat lunak.'),
  ('Yuval Noah Harari', 'Sejarawan dan penulis.'),
  ('Pramoedya Ananta Toer', 'Sastrawan Indonesia.'),
  ('Raditya Dika', 'Penulis dan komedian Indonesia.'),
  ('Dian Kristiani', 'Penulis buku anak dan cerita edukatif.')
) AS source(name, biography)
WHERE NOT EXISTS (SELECT 1 FROM public.authors a WHERE a.name = source.name);

WITH book_source(title, isbn, category_name, publisher_name, author_name, publication_year, language, pages, shelf, total_copies, description) AS (
  VALUES
    ('Laskar Pelangi', '9789793062792', 'Fiksi', 'Bentang Pustaka', 'Andrea Hirata', 2005, 'Indonesia', 534, 'F-01', 4, 'Kisah persahabatan dan pendidikan di Belitung.'),
    ('Sang Pemimpi', '9789793062793', 'Fiksi', 'Bentang Pustaka', 'Andrea Hirata', 2006, 'Indonesia', 288, 'F-01', 3, 'Perjalanan mengejar mimpi dan pendidikan.'),
    ('Perahu Kertas', '9786022916625', 'Fiksi', 'Bentang Pustaka', 'Dee Lestari', 2009, 'Indonesia', 444, 'F-02', 3, 'Kisah cinta dan pencarian jati diri.'),
    ('Aroma Karsa', '9786022914638', 'Fiksi', 'Bentang Pustaka', 'Dee Lestari', 2018, 'Indonesia', 724, 'F-02', 2, 'Petualangan penciuman dan warisan keluarga.'),
    ('Bumi', '9786020332956', 'Fiksi', 'Gramedia Pustaka Utama', 'Tere Liye', 2014, 'Indonesia', 440, 'F-03', 4, 'Petualangan fantasi remaja.'),
    ('Negeri 5 Menara', '9789792248616', 'Fiksi', 'Gramedia Pustaka Utama', 'Andrea Hirata', 2009, 'Indonesia', 424, 'F-03', 3, 'Pendidikan, persahabatan, dan cita-cita.'),
    ('The Pragmatic Programmer', '9780135957059', 'Teknologi', 'Elex Media Komputindo', 'Andrew Hunt', 2019, 'Inggris', 352, 'T-01', 3, 'Praktik terbaik untuk pengembang perangkat lunak.'),
    ('Clean Code', '9780132350884', 'Teknologi', 'Elex Media Komputindo', 'David Thomas', 2008, 'Inggris', 464, 'T-01', 3, 'Panduan menulis kode yang mudah dirawat.'),
    ('Designing Data-Intensive Applications', '9781449373320', 'Teknologi', 'Elex Media Komputindo', 'David Thomas', 2017, 'Inggris', 616, 'T-02', 2, 'Dasar sistem data modern yang andal.'),
    ('Belajar Pemrograman Web', '9786020498900', 'Teknologi', 'Elex Media Komputindo', 'David Thomas', 2021, 'Indonesia', 280, 'T-02', 4, 'Pengantar membangun aplikasi web.'),
    ('Sapiens', '9786024246941', 'Sejarah', 'Mizan Publishing', 'Yuval Noah Harari', 2017, 'Indonesia', 528, 'S-01', 3, 'Sejarah singkat umat manusia.'),
    ('Homo Deus', '9786024246958', 'Sejarah', 'Mizan Publishing', 'Yuval Noah Harari', 2018, 'Indonesia', 512, 'S-01', 2, 'Masa depan umat manusia dan teknologi.'),
    ('Bumi Manusia', '9789799731234', 'Sejarah', 'Penerbit Buku Kompas', 'Pramoedya Ananta Toer', 1980, 'Indonesia', 535, 'S-02', 3, 'Novel sejarah dan kolonialisme Indonesia.'),
    ('Jejak Langkah', '9789799731258', 'Sejarah', 'Penerbit Buku Kompas', 'Pramoedya Ananta Toer', 1985, 'Indonesia', 724, 'S-02', 2, 'Perjalanan perjuangan dan perubahan sosial.'),
    ('Habibie dan Ainun', '9786020321234', 'Sejarah', 'Gramedia Pustaka Utama', 'B.J. Habibie', 2010, 'Indonesia', 320, 'S-03', 3, 'Memoar kehidupan dan pengabdian.'),
    ('Start With Why', '9781591846444', 'Bisnis', 'Gramedia Pustaka Utama', 'B.J. Habibie', 2011, 'Indonesia', 256, 'B-01', 2, 'Membangun kepemimpinan dengan tujuan.'),
    ('The Lean Startup', '9780307887894', 'Bisnis', 'Mizan Publishing', 'Andrew Hunt', 2011, 'Indonesia', 336, 'B-01', 2, 'Membangun bisnis dengan eksperimen cepat.'),
    ('Kambing Jantan', '9789797801234', 'Fiksi', 'Gramedia Pustaka Utama', 'Raditya Dika', 2005, 'Indonesia', 240, 'F-04', 3, 'Catatan humor dan kehidupan sehari-hari.'),
    ('Ensiklopedia Sains Anak', '9786020523456', 'Anak', 'Elex Media Komputindo', 'Dian Kristiani', 2020, 'Indonesia', 128, 'A-01', 4, 'Pengetahuan sains dasar dengan ilustrasi.'),
    ('Cerita dari Laut', '9786020523470', 'Anak', 'Mizan Publishing', 'Dian Kristiani', 2021, 'Indonesia', 96, 'A-01', 3, 'Cerita edukatif tentang kehidupan laut.'),
    ('Eksperimen Sains di Rumah', '9786020523487', 'Sains', 'Elex Media Komputindo', 'Dian Kristiani', 2022, 'Indonesia', 144, 'A-02', 3, 'Eksperimen sederhana dan aman untuk keluarga.')
), inserted AS (
  INSERT INTO public.books (title, isbn, category_id, publisher_id, publication_year, language, pages, shelf_location, total_copies, available_copies, description)
  SELECT b.title, b.isbn, c.id, p.id, b.publication_year, b.language, b.pages, b.shelf, b.total_copies, b.total_copies, b.description
  FROM book_source b
  JOIN public.categories c ON c.name = b.category_name
  JOIN public.publishers p ON p.name = b.publisher_name
  WHERE NOT EXISTS (SELECT 1 FROM public.books existing WHERE existing.isbn = b.isbn)
  RETURNING id, isbn
)
INSERT INTO public.book_authors (book_id, author_id)
SELECT book.id, a.id
FROM public.books book
JOIN book_source source ON source.isbn = book.isbn
JOIN public.authors a ON a.name = source.author_name
ON CONFLICT DO NOTHING;

-- Buat contoh transaksi hanya jika sudah ada akun anggota nyata.
DO $$
DECLARE
  v_user_id uuid;
  v_book_id uuid;
  v_book_id_2 uuid;
  v_reservation_book_id uuid;
  v_borrowing_id uuid;
BEGIN
  SELECT p.id INTO v_user_id
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'anggota' AND p.is_active = true
  ORDER BY p.created_at
  LIMIT 1;

  SELECT id INTO v_book_id FROM public.books WHERE isbn = '9789793062792';
  SELECT id INTO v_book_id_2 FROM public.books WHERE isbn = '9786022916625';
  SELECT id INTO v_reservation_book_id FROM public.books WHERE isbn = '9786022914638';

  IF v_user_id IS NOT NULL AND v_book_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.borrowings WHERE user_id = v_user_id AND book_id = v_book_id AND notes = 'SEED_FASE_7_RETURNED') THEN
      INSERT INTO public.borrowings (user_id, book_id, borrowed_at, due_at, returned_at, status, fine_amount, notes)
      VALUES (v_user_id, v_book_id, now() - interval '20 days', now() - interval '6 days', now() - interval '2 days', 'returned', 8000, 'SEED_FASE_7_RETURNED')
      RETURNING id INTO v_borrowing_id;
      INSERT INTO public.fines (borrowing_id, user_id, amount, status, notes)
      VALUES (v_borrowing_id, v_user_id, 8000, 'unpaid', 'SEED_FASE_7_FINE')
      ON CONFLICT (borrowing_id) DO NOTHING;
    END IF;
  END IF;

  IF v_user_id IS NOT NULL AND v_book_id_2 IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.borrowings WHERE user_id = v_user_id AND book_id = v_book_id_2 AND notes = 'SEED_FASE_7_ACTIVE') THEN
      INSERT INTO public.borrowings (user_id, book_id, borrowed_at, due_at, status, notes)
      VALUES (v_user_id, v_book_id_2, now() - interval '3 days', now() + interval '11 days', 'active', 'SEED_FASE_7_ACTIVE');
      UPDATE public.books SET available_copies = greatest(0, available_copies - 1) WHERE id = v_book_id_2;
    END IF;
  END IF;

  IF v_user_id IS NOT NULL AND v_reservation_book_id IS NOT NULL THEN
    UPDATE public.books SET available_copies = 0 WHERE id = v_reservation_book_id;
    INSERT INTO public.reservations (user_id, book_id, status, reserved_at)
    SELECT v_user_id, v_reservation_book_id, 'waiting', now() - interval '1 day'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE user_id = v_user_id AND book_id = v_reservation_book_id AND status IN ('waiting', 'ready')
    );
  END IF;
END $$;
