# Prompt Sistem Perpustakaan — Versi Bertahap (Hemat Limit)

## Cara Pakai
Kirim **CONTEXT** dulu sekali di awal project (atau taruh di system/project prompt kalau tools-nya mendukung). Setelah itu kirim **FASE 1**, tunggu selesai & cek hasilnya, baru lanjut **FASE 2**, dst. Jangan kirim semua fase sekaligus.

Kalau ada fase yang gagal/error, jangan kirim ulang seluruh fase — cukup minta perbaikan spesifik pada bagian yang error saja.

---

## CONTEXT (kirim sekali di awal)

Saya membangun **Sistem Informasi Perpustakaan dan Peminjaman Buku**, production-ready, dengan stack:
- TypeScript + React + Vite + Tailwind CSS + shadcn/ui + Lucide Icons
- Supabase (Postgres, Auth, RLS, Storage)

Desain: modern dashboard style, clean, whitespace proporsional, rounded card, subtle shadow, light & dark mode, sidebar desktop + drawer mobile, fully responsive (desktop/tablet/mobile), tanpa horizontal overflow.

Role: **Admin** (akses penuh), **Petugas** (operasional, tanpa user management/settings sensitif), **Anggota** (katalog, pinjam, reservasi, riwayat, denda, profil). Semua permission ditegakkan lewat Supabase RLS, bukan cuma disembunyikan di UI.

Aturan penting:
- Semua fitur harus benar-benar terhubung ke Supabase, tidak ada dummy/mock data di fitur utama
- Tidak ada tombol dummy/placeholder
- Selalu ada loading state, empty state, error state, toast feedback
- Gunakan Zod untuk validasi form
- Simpan kredensial di `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), jangan pernah expose service role key di frontend
- Struktur folder modular: components/ui, layout, forms, pages, hooks, lib, services, types

Saya akan minta fitur secara bertahap per fase. Fokus dulu ke fase yang saya minta, jangan bangun fase lain di luar yang diminta.

---

## FASE 1 — Fondasi: Schema, Auth, Layout

Buat:
1. SQL migration untuk tabel inti: `profiles`, `categories`, `authors`, `publishers`, `books`, `book_authors`, dengan relasi, constraint, index, timestamps yang sesuai.
2. RLS policy dasar: profiles hanya bisa dibaca/diubah oleh pemiliknya (kecuali admin), books bisa dibaca semua role tapi hanya admin/petugas yang bisa ubah.
3. Supabase Auth: login, register, logout, forgot/reset password, protected routes, redirect sesuai role setelah login.
4. Layout shell: sidebar (desktop) + drawer (mobile), topbar, theme toggle light/dark, halaman dashboard kosong sebagai placeholder yang nanti diisi di fase berikutnya.

Jangan bangun fitur peminjaman/pengembalian/reservasi/laporan dulu — itu di fase lain.

---

## FASE 2 — Katalog & Manajemen Buku

Buat:
1. Halaman katalog buku (search judul/ISBN/penulis/penerbit, filter kategori & tahun & status, sort, pagination, grid view) — data dari Supabase, pakai debounce di search.
2. Halaman detail buku.
3. CRUD buku (tambah/edit/hapus) untuk admin & petugas, termasuk upload cover ke Supabase Storage, dengan validasi Zod.
4. CRUD sederhana untuk kategori, penulis, penerbit.

---

## FASE 3 — Anggota

Buat:
1. CRUD anggota (tambah/edit/lihat detail/suspend/aktifkan) untuk admin & petugas.
2. Halaman detail anggota: statistik pinjaman aktif, riwayat, denda, reservasi (bagian ini boleh kosong dulu kalau tabel terkait belum ada — akan diisi fase berikutnya).
3. Halaman profil anggota (member bisa lihat & edit profil sendiri).

---

## FASE 4 — Peminjaman & Pengembalian (core business logic)

Buat:
1. Tabel `borrowings` + RLS + RPC/function di Supabase untuk proses peminjaman (cek ketersediaan, cek batas pinjam, cek keterlambatan, kurangi stok) dan pengembalian (hitung keterlambatan & denda otomatis, tambah stok kembali) — pakai RPC agar aman dari race condition, jangan logic kritikal di client saja.
2. Halaman "Peminjaman Baru" untuk petugas/admin.
3. Halaman "Pengembalian" dengan search transaksi/anggota dan confirmation dialog.
4. Halaman "Peminjaman Aktif" & "Riwayat Peminjaman" untuk anggota dan untuk admin/petugas (lihat semua anggota).

---

## FASE 5 — Reservasi & Denda

Buat:
1. Tabel `reservations` + RLS + logic antrean berbasis waktu reservasi + status (Waiting/Ready/Completed/Cancelled/Expired).
2. Fitur reservasi di halaman detail buku (muncul saat buku tidak tersedia) + halaman kelola reservasi anggota.
3. Tabel `fines` + halaman kelola denda (admin/petugas: lihat & ubah status Unpaid/Paid/Waived; anggota: lihat denda sendiri).

---

## FASE 6 — Dashboard, Laporan, Notifikasi

Buat:
1. Dashboard admin: kartu statistik (total buku, anggota, buku tersedia/dipinjam, peminjaman aktif/terlambat, total denda, reservasi aktif), grafik (peminjaman per bulan, buku populer), aktivitas terbaru, quick actions.
2. Halaman laporan (peminjaman, pengembalian, keterlambatan, denda, buku populer, anggota aktif, stok) dengan filter tanggal & export CSV.
3. Tabel `notifications` + notification center di header (buku dipinjam/dikembalikan, jatuh tempo, terlambat, reservasi tersedia, denda baru).

---

## FASE 7 — Settings, Seed Data, QA Akhir

Buat:
1. Halaman Settings admin: identitas perpustakaan, aturan peminjaman (maks buku, lama pinjam, denda/hari, maks reservasi), preferensi tampilan.
2. Seed data realistis: 20+ buku, beberapa kategori/penulis/penerbit/anggota/transaksi/reservasi/denda.
3. QA menyeluruh: pastikan tidak ada TypeScript error, broken import, route rusak, tombol dummy, mock data yang masih dipakai, RLS yang bocor, dan cek responsive di mobile/tablet/desktop.

---

## Tips tambahan biar tidak boros limit
- Setelah tiap fase, cek dulu hasilnya jalan sebelum lanjut fase berikutnya — jangan minta banyak revisi sekaligus, gabungkan jadi satu pesan revisi per putaran.
- Kalau di tengah fase context/limit mulai terasa berat, mulai chat/project baru dan tempel ulang **CONTEXT** + ringkasan status ("Fase 1–3 sudah selesai dan berjalan, lanjut Fase 4") daripada mengulang prompt awal secara penuh.
- Hindari minta "generate semua sekaligus" — biarkan AI kerja per fase sesuai urutan di atas.
