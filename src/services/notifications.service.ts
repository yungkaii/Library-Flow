import { supabase } from "@/lib/supabase";
import type { Notification, NotificationType } from "@/types";

export async function listNotifications(limit = 12): Promise<Notification[]> {
  await supabase.rpc("generate_due_notifications");
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}

export function notificationLabel(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    borrowed: "Peminjaman",
    returned: "Pengembalian",
    due_soon: "Jatuh tempo",
    overdue: "Terlambat",
    reservation_ready: "Reservasi",
    fine_created: "Denda",
  };
  return labels[type];
}
