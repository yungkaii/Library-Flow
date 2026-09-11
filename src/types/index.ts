export type AppRole = "admin" | "petugas" | "anggota";

export interface Profile {
  id: string;
  full_name: string;
  member_code: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  petugas: "Petugas",
  anggota: "Anggota",
};
