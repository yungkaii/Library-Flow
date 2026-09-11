# Library Flow

Saya membangun Sistem Informasi Perpustakaan dan Peminjaman Buku, production-ready, dengan stack:

TypeScript + React + Vite + Tailwind CSS + shadcn/ui + Lucide Icons

Supabase (Postgres, Auth, RLS, Storage)

Desain: modern dashboard style, clean, whitespace proporsional, rounded card, subtle shadow, light & dark mode, sidebar desktop + drawer mobile, fully responsive (desktop/tablet/mobile), tanpa horizontal overflow.

Role: Admin (akses penuh), Petugas (operasional, tanpa user management/settings sensitif), Anggota (katalog, pinjam, reservasi, riwayat, denda, profil). Semua permission ditegakkan lewat Supabase RLS, bukan cuma disembunyikan di UI.

Aturan penting:

Semua fitur harus benar-benar terhubung ke Supabase, tidak ada dummy/mock data di fitur utama

Tidak ada tombol dummy/placeholder

Selalu ada loading state, empty state, error state, toast feedback

Gunakan Zod untuk validasi form

Simpan kredensial di .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), jangan pernah expose service role key di frontend

Struktur folder modular: components/ui, layout, forms, pages, hooks, lib, services, types

Saya akan minta fitur secara bertahap per fase. Fokus dulu ke fase yang saya minta, jangan bangun fase lain di luar yang diminta.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/53239206-6999-4f1f-a84f-62dafef324a9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
