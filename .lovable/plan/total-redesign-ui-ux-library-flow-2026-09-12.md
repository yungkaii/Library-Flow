# Total Redesign UI/UX Library Flow

## Tujuan
Mengubah seluruh Library Flow menjadi produk perpustakaan digital premium bergaya **Academic Editorial**, tanpa mengubah schema database, service layer, autentikasi, izin peran, routing, atau business logic yang sudah berjalan.

## Arah Visual Terkunci
- Palet: deep ink `#132C24`, warm ivory `#F6F1E7`, chartreuse `#D9F06B`, warm amber `#D89A37`, beserta tonal semantiknya.
- Tipografi: **Libre Baskerville** untuk judul editorial dan angka utama; **IBM Plex Sans** untuk UI, tabel, formulir, dan metadata.
- Komposisi: ritme majalah digital asimetris, tipografi kuat, garis editorial, bidang berlapis, dan ruang kosong terarah.
- Dark mode: workspace editorial ink yang dirancang khusus, bukan inversi otomatis.
- Motion: entrance ringan, indikator navigasi bergerak, hover/press halus, count-up statistik, chart reveal, modal/dropdown transisi, shimmer, serta dukungan `prefers-reduced-motion`.

## Tahapan Implementasi

### 1. Fondasi desain dan komponen bersama
- Bangun ulang token warna, tipografi, ukuran, bayangan, radius, status, chart, dan motion di sistem global.
- Selaraskan Button, Input, Select, Tabs, Dialog, Dropdown, Table, Toast, Skeleton, dan kontrol dasar agar tidak terlihat seperti default library UI.
- Tambahkan komponen reusable: `PageHeader`, `SectionHeader`, `StatBlock`, `FilterBar`, `ActivityItem`, `ResponsiveTable`, `AnimatedCard`, `SearchInterface`, serta peningkatan `StatusBadge` dan `EmptyState`.

### 2. App shell
- Ubah sidebar menjadi indeks katalog editorial dengan grouping yang jelas, branding kuat, indikator aktif animatif, serta collapse/drawer mobile yang halus.
- Buat header lebih ringkas dengan context page, notification, theme, profil, role, dan logout yang tetap lengkap.
- Pertahankan kontrak `AppShell`, seluruh link, pembatasan admin/petugas, dan alur keluar akun.

### 3. Dashboard
- Susun ulang sebagai spread editorial: sapaan dan status, Total Buku dominan, metrik sekunder dengan skala berbeda, warning keterlambatan, tren, visualisasi, aktivitas, dan quick actions yang tidak berbentuk grid kartu seragam.
- Pertahankan semua sumber data, kondisi peran, loading, error, dan tautan yang ada.

### 4. Pengalaman buku
- Catalog: search utama, filter chips/controls, result count, sorting, cover-forward grid, availability, metadata reveal, dan perilaku hover premium.
- Detail: komposisi asimetris, cover berdimensi, judul besar, colophon metadata, deskripsi, ketersediaan, CTA, dan related books.
- Form tambah/edit: kelompok informasi yang jelas dan pengalaman unggah cover tetap sama.

### 5. Sirkulasi dan anggota
- Peminjaman baru: workflow pencarian anggota/buku, bagian terstruktur, ringkasan, submit, dan confirmation state.
- Peminjaman aktif, pengembalian, dan riwayat: due-date hierarchy, hubungan buku-anggota, warning overdue, aksi, serta tampilan mobile yang mudah dipindai.
- Reservasi: queue position, status, tanggal, dan progress/timeline tanpa mengubah RPC refresh queue.
- Anggota: directory dengan avatar, status, ringkasan peminjaman, aktivitas; detail menjadi profile workspace.
- Denda: hierarchy outstanding/unpaid/paid/overdue yang tegas dengan warning elegan.

### 6. Reports, master data, settings, dan profile
- Reports menjadi analytics workspace dengan komposisi metrik/chart/filter yang variatif; export hanya dipertahankan bila sudah tersedia.
- Category, Author, dan Publisher mendapat personality berbeda sambil memakai pola shared yang konsisten.
- Settings dan profile disusun sebagai workspace kelompok pengaturan dengan feedback simpan yang jelas.

### 7. Authentication dan public experience
- Landing page dibuat sebagai editorial introduction yang kuat tanpa pola tiga feature-card generik.
- Login/register/reset dibuat sebagai split editorial layout; form, deep-link tab, peringatan konfigurasi, dan recovery flow tetap utuh.

### 8. States, responsivitas, dan final polish
- Terapkan empty, loading, error, toast, modal, dropdown, chart, dan skeleton yang selaras dengan identitas baru.
- Desktop menggunakan komposisi kaya; tablet menyusun ulang kolom; mobile memakai drawer, toolbar ringkas, filter horizontal, target sentuh nyaman, dan transformasi tabel yang sesuai konteks.
- Validasi semua route pada desktop dan mobile, dark mode, interaksi utama, console/runtime, serta hasil build.

## Batasan Teknis yang Dijaga
- Tidak mengubah file migrasi atau schema database.
- Tidak mengubah service layer dan RPC kecuali hambatan UI yang benar-benar memerlukan penyesuaian minimal.
- Tidak mengganti TanStack Start, sistem autentikasi, routing, maupun data asli.
- Tidak mengubah path berbahasa Indonesia atau file route tree hasil generate.
- Tetap menjaga auth gate, role-based visibility, redirect, query/search state, pagination, notification generation, reservation queue refresh, upload cover, dan error reporting.
- Tidak menambahkan dummy data untuk mempercantik tampilan.

## Kriteria Selesai
- Semua halaman memiliki satu identitas Library Flow yang konsisten namun tidak identik.
- Tidak ada route atau fitur lama yang hilang.
- Tidak ada pola dashboard generik berupa kartu seragam dan border berlebihan.
- Light/dark mode, desktop/tablet/mobile, loading/empty/error, dan alur penting telah diperiksa.
