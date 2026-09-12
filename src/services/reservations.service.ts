import { supabase } from "@/lib/supabase";
import type { BookWithRelations, Profile, Reservation, ReservationStatus } from "@/types";

export interface ReservationWithRelations extends Reservation {
  book: Pick<BookWithRelations, "id" | "title" | "cover_url"> | null;
  user: Pick<Profile, "id" | "full_name" | "member_code"> | null;
}

export interface ReservationFilters {
  userId?: string;
  status?: ReservationStatus;
  page?: number;
  pageSize?: number;
}

const SELECT_QUERY =
  "*, book:books(id, title, cover_url), user:profiles(id, full_name, member_code)";

export async function syncReservationQueues() {
  const { error } = await supabase.rpc("refresh_all_reservation_queues");
  if (error) throw error;
}

export async function listReservations(
  filters: ReservationFilters = {},
): Promise<ReservationWithRelations[]> {
  await syncReservationQueues();
  const { userId, status, page = 1, pageSize = 50 } = filters;
  let query = supabase.from("reservations").select(SELECT_QUERY);
  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);
  const from = (page - 1) * pageSize;
  query = query.order("reserved_at", { ascending: true }).range(from, from + pageSize - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ReservationWithRelations[];
}

export async function reserveBook(bookId: string) {
  const { data, error } = await supabase.rpc("reserve_book", { p_book_id: bookId });
  if (error) throw error;
  return data as Reservation;
}

export async function cancelReservation(reservationId: string) {
  const { data, error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
  return data as Reservation;
}

export async function completeReservation(reservationId: string) {
  const { data, error } = await supabase.rpc("complete_reservation", {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
  return data as Reservation;
}
