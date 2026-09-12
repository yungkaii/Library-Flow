import { supabase } from "@/lib/supabase";
import type { BookWithRelations, Fine, FineStatus, Profile } from "@/types";

export interface FineWithRelations extends Fine {
  user: Pick<Profile, "id" | "full_name" | "member_code"> | null;
  book: Pick<BookWithRelations, "id" | "title"> | null;
}

export async function listFines(userId?: string): Promise<FineWithRelations[]> {
  let query = supabase
    .from("fines")
    .select(
      "*, user:profiles(id, full_name, member_code), borrowing:borrowings(book:books(id, title))",
    )
    .order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const borrowing = row["borrowing"] as {
      book?: Pick<BookWithRelations, "id" | "title"> | null;
    } | null;
    return {
      ...(row as unknown as Fine),
      amount: Number(row["amount"] ?? 0),
      user: (row["user"] as FineWithRelations["user"]) ?? null,
      book: borrowing?.book ?? null,
    };
  });
}

export async function updateFineStatus(fineId: string, status: FineStatus) {
  const { data, error } = await supabase.rpc("update_fine_status", {
    p_fine_id: fineId,
    p_status: status,
  });
  if (error) throw error;
  return data as Fine;
}
