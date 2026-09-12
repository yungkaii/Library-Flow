import { supabase } from "@/lib/supabase";
import type { Borrowing, BorrowingStatus, BookWithRelations, Profile } from "@/types";

export interface BorrowingWithRelations extends Borrowing {
  book: Pick<
    BookWithRelations,
    "id" | "title" | "cover_url" | "available_copies" | "total_copies"
  > | null;
  user: Pick<Profile, "id" | "full_name" | "member_code"> | null;
}

export interface BorrowingFilters {
  userId?: string;
  status?: BorrowingStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

const SELECT_QUERY =
  "*, book:books(id, title, cover_url, available_copies, total_copies), user:profiles(id, full_name, member_code)";

function toBorrowing(row: any): BorrowingWithRelations {
  return {
    id: row.id,
    user_id: row.user_id,
    book_id: row.book_id,
    borrowed_at: row.borrowed_at,
    due_at: row.due_at,
    returned_at: row.returned_at,
    status: row.status,
    fine_amount: Number(row.fine_amount ?? 0),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    book: row.book ?? null,
    user: row.user ?? null,
  };
}

export async function listBorrowings(
  filters: BorrowingFilters = {},
): Promise<BorrowingWithRelations[]> {
  const { userId, status, search, page = 1, pageSize = 25 } = filters;

  let query = supabase.from("borrowings").select(SELECT_QUERY, { count: "exact" });

  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `notes.ilike.%${term}%, book_id.in.(select id from books where title.ilike.%${term}% or isbn.ilike.%${term}%), user_id.in.(select id from profiles where full_name.ilike.%${term}% or member_code.ilike.%${term}%)`,
    );
  }

  query = query.order("borrowed_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as any[]).map(toBorrowing);
}

export async function listActiveBorrowings(userId?: string): Promise<BorrowingWithRelations[]> {
  return listBorrowings({ ...(userId ? { userId } : {}), status: "active" });
}

export async function listBorrowingHistory(userId?: string): Promise<BorrowingWithRelations[]> {
  return listBorrowings({ ...(userId ? { userId } : {}), status: "returned" });
}

export async function createBorrowing(userId: string, bookId: string, dueDays = 14) {
  const { data, error } = await supabase.rpc("borrow_book", {
    p_user_id: userId,
    p_book_id: bookId,
    p_due_days: dueDays,
  });

  if (error) throw error;
  return data as Borrowing;
}

export async function returnBorrowing(borrowingId: string) {
  const { data, error } = await supabase.rpc("return_book", {
    p_borrowing_id: borrowingId,
  });

  if (error) throw error;
  return data as Borrowing;
}
