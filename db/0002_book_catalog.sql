-- Fase 2: katalog & manajemen buku (kategori, penerbit, penulis, buku).
-- Jalankan isi file ini di SQL Editor proyek Supabase Anda, SETELAH 0001_foundation_auth.sql.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  website text,
  contact text,
  created_at timestamptz not null default now()
);

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  biography text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  isbn text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  publisher_id uuid references public.publishers(id) on delete set null,
  publication_year integer,
  language text,
  pages integer,
  shelf_location text,
  total_copies integer not null default 1 check (total_copies >= 0),
  available_copies integer not null default 1 check (available_copies >= 0),
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint available_not_exceed_total check (available_copies <= total_copies)
);

create index if not exists books_category_id_idx on public.books(category_id);
create index if not exists books_publisher_id_idx on public.books(publisher_id);
create unique index if not exists books_isbn_unique_idx
  on public.books(isbn) where isbn is not null and isbn <> '';

create table if not exists public.book_authors (
  book_id uuid not null references public.books(id) on delete cascade,
  author_id uuid not null references public.authors(id) on delete cascade,
  primary key (book_id, author_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

grant select on public.categories, public.publishers, public.authors, public.books, public.book_authors
  to authenticated;
grant all on public.categories, public.publishers, public.authors, public.books, public.book_authors
  to service_role;

alter table public.categories enable row level security;
alter table public.publishers enable row level security;
alter table public.authors enable row level security;
alter table public.books enable row level security;
alter table public.book_authors enable row level security;

-- Semua pengguna yang login boleh membaca katalog; hanya staff (admin/petugas) yang bisa mengubah.
drop policy if exists "Authenticated can read categories" on public.categories;
create policy "Authenticated can read categories"
  on public.categories for select to authenticated using (true);

drop policy if exists "Staff manage categories" on public.categories;
create policy "Staff manage categories"
  on public.categories for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "Authenticated can read publishers" on public.publishers;
create policy "Authenticated can read publishers"
  on public.publishers for select to authenticated using (true);

drop policy if exists "Staff manage publishers" on public.publishers;
create policy "Staff manage publishers"
  on public.publishers for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "Authenticated can read authors" on public.authors;
create policy "Authenticated can read authors"
  on public.authors for select to authenticated using (true);

drop policy if exists "Staff manage authors" on public.authors;
create policy "Staff manage authors"
  on public.authors for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "Authenticated can read books" on public.books;
create policy "Authenticated can read books"
  on public.books for select to authenticated using (true);

drop policy if exists "Staff manage books" on public.books;
create policy "Staff manage books"
  on public.books for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "Authenticated can read book_authors" on public.book_authors;
create policy "Authenticated can read book_authors"
  on public.book_authors for select to authenticated using (true);

drop policy if exists "Staff manage book_authors" on public.book_authors;
create policy "Staff manage book_authors"
  on public.book_authors for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Storage bucket untuk cover buku (public read, staff-only write).
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

drop policy if exists "Public can view book covers" on storage.objects;
create policy "Public can view book covers"
  on storage.objects for select using (bucket_id = 'book-covers');

drop policy if exists "Staff can upload book covers" on storage.objects;
create policy "Staff can upload book covers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'book-covers' and public.is_staff(auth.uid()));

drop policy if exists "Staff can update book covers" on storage.objects;
create policy "Staff can update book covers"
  on storage.objects for update to authenticated
  using (bucket_id = 'book-covers' and public.is_staff(auth.uid()));

drop policy if exists "Staff can delete book covers" on storage.objects;
create policy "Staff can delete book covers"
  on storage.objects for delete to authenticated
  using (bucket_id = 'book-covers' and public.is_staff(auth.uid()));
