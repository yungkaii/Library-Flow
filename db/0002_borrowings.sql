-- Fase 4: Peminjaman & pengembalian.
-- Jalankan di SQL Editor Supabase project Anda.

create type public.borrowing_status as enum ('active', 'returned');

create table if not exists public.borrowings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  status public.borrowing_status not null default 'active',
  fine_amount numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists borrowings_user_status_idx
  on public.borrowings (user_id, status, due_at);

create index if not exists borrowings_book_status_idx
  on public.borrowings (book_id, status);

grant select, insert, update on public.borrowings to authenticated;
grant all on public.borrowings to service_role;

alter table public.borrowings enable row level security;

-- Anggota bisa melihat riwayat peminjamannya sendiri.
drop policy if exists "Members can read own borrowings" on public.borrowings;
create policy "Members can read own borrowings"
  on public.borrowings for select to authenticated
  using (auth.uid() = user_id);

-- Petugas/Admin bisa melihat semua transaksi.
drop policy if exists "Staff can read all borrowings" on public.borrowings;
create policy "Staff can read all borrowings"
  on public.borrowings for select to authenticated
  using (public.is_staff(auth.uid()));

-- Hanya staff/admin yang bisa membuat & mengembalikan.
drop policy if exists "Staff can insert borrowings" on public.borrowings;
create policy "Staff can insert borrowings"
  on public.borrowings for insert to authenticated
  with check (public.is_staff(auth.uid()));

drop policy if exists "Staff can update borrowings" on public.borrowings;
create policy "Staff can update borrowings"
  on public.borrowings for update to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create or replace function public.borrow_book(
  p_user_id uuid,
  p_book_id uuid,
  p_due_days integer default 14
)
returns public.borrowings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.profiles;
  v_book public.books;
  v_active_count integer;
  v_due_at timestamptz;
  v_record public.borrowings;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Hanya petugas/admin yang dapat memproses peminjaman.';
  end if;

  if p_due_days is null or p_due_days <= 0 then
    raise exception 'Durasi pinjam tidak valid.';
  end if;

  select * into v_member
  from public.profiles
  where id = p_user_id and is_active = true;

  if v_member.id is null then
    raise exception 'Anggota tidak ditemukan atau akun sedang tidak aktif.';
  end if;

  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if v_book.id is null then
    raise exception 'Buku tidak ditemukan.';
  end if;

  if v_book.available_copies <= 0 then
    raise exception 'Buku tidak tersedia saat ini.';
  end if;

  select count(*) into v_active_count
  from public.borrowings
  where user_id = p_user_id and status = 'active';

  if v_active_count >= 3 then
    raise exception 'Anggota sudah mencapai batas maksimal peminjaman aktif.';
  end if;

  if exists (
    select 1
    from public.borrowings
    where user_id = p_user_id
      and status = 'active'
      and due_at < now()
  ) then
    raise exception 'Anggota masih memiliki peminjaman yang terlambat.';
  end if;

  v_due_at = now() + make_interval(days => p_due_days);

  update public.books
  set available_copies = available_copies - 1,
      updated_at = now()
  where id = p_book_id
    and available_copies > 0;

  insert into public.borrowings (user_id, book_id, due_at, status, fine_amount, notes)
  values (p_user_id, p_book_id, v_due_at, 'active', 0, null)
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.borrow_book(uuid, uuid, integer) to authenticated;

create or replace function public.return_book(p_borrowing_id uuid)
returns public.borrowings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_borrowing public.borrowings;
  v_book public.books;
  v_late_days integer;
  v_fine_amount numeric(10,2);
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Hanya petugas/admin yang dapat memproses pengembalian.';
  end if;

  select * into v_borrowing
  from public.borrowings
  where id = p_borrowing_id
  for update;

  if v_borrowing.id is null then
    raise exception 'Transaksi peminjaman tidak ditemukan.';
  end if;

  if v_borrowing.status = 'returned' then
    raise exception 'Buku ini sudah dikembalikan.';
  end if;

  select * into v_book
  from public.books
  where id = v_borrowing.book_id
  for update;

  v_late_days := greatest(0, extract(day from (now() - v_borrowing.due_at))::int);
  v_fine_amount := v_late_days * 2000.00;

  update public.borrowings
  set returned_at = now(),
      status = 'returned',
      fine_amount = v_fine_amount,
      updated_at = now()
  where id = p_borrowing_id;

  update public.books
  set available_copies = available_copies + 1,
      updated_at = now()
  where id = v_borrowing.book_id;

  select * into v_borrowing
  from public.borrowings
  where id = p_borrowing_id;

  return v_borrowing;
end;
$$;

grant execute on function public.return_book(uuid) to authenticated;

create or replace trigger set_public_borrowings_updated_at
before update on public.borrowings
for each row
execute function public.set_updated_at();
