import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  total_books: number;
  total_members: number;
  available_copies: number;
  borrowed_copies: number;
  active_borrowings: number;
  overdue_borrowings: number;
  unpaid_fines: number;
  active_reservations: number;
}

export interface DashboardData {
  stats: DashboardStats;
  monthly_borrowings: Array<{ month: string; label: string; count: number }>;
  popular_books: Array<{ title: string; count: number }>;
  recent_activity: Array<{
    type: string;
    title: string;
    user_name: string;
    created_at: string;
  }>;
}

export type ReportType =
  "borrowings" | "returns" | "overdue" | "fines" | "popular_books" | "active_members" | "stock";

export async function getDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabase.rpc("dashboard_summary");
  if (error) throw error;
  const result = data as DashboardData;
  return {
    stats: result.stats,
    monthly_borrowings: result.monthly_borrowings ?? [],
    popular_books: result.popular_books ?? [],
    recent_activity: result.recent_activity ?? [],
  };
}

export async function getReport(
  type: ReportType,
  from: string,
  to: string,
): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await supabase.rpc("library_report", {
    p_report_type: type,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}
