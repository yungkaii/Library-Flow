import { supabase } from "@/lib/supabase";
import type { AppRole, Profile } from "@/types";

export interface MemberListItem extends Profile {
  roles: AppRole[];
}

export interface CreateMemberPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  address?: string | null;
  role: AppRole;
  isActive?: boolean;
}

export interface UpdateMemberPayload {
  fullName: string;
  phone?: string | null;
  address?: string | null;
  role: AppRole;
  isActive: boolean;
}

function normalizeRoles(rows: Array<{ role: AppRole }> = []): AppRole[] {
  const unique = new Set<AppRole>();
  rows.forEach((row) => {
    if (row.role) unique.add(row.role);
  });
  return Array.from(unique);
}

function mapMember(profile: Profile, roleRows: Array<{ role: AppRole }> = []): MemberListItem {
  return {
    ...profile,
    roles: normalizeRoles(roleRows),
  };
}

export async function listMembers(): Promise<MemberListItem[]> {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });
  if (profileError) throw profileError;

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id, role");
  if (roleError) throw roleError;

  const rolesByUserId = new Map<string, Array<{ role: AppRole }>>();
  (roleRows ?? []).forEach((row) => {
    const userId = (row as { user_id: string }).user_id;
    const current = rolesByUserId.get(userId) ?? [];
    current.push({ role: (row as { role: AppRole }).role });
    rolesByUserId.set(userId, current);
  });

  return (profiles ?? []).map((profile) => mapMember(profile as Profile, rolesByUserId.get(profile.id) ?? []));
}

export async function getMemberById(id: string): Promise<MemberListItem | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", id);
  if (roleError) throw roleError;

  return mapMember(profile as Profile, (roleRows ?? []) as Array<{ role: AppRole }>);
}

export async function upsertUserRoles(userId: string, roles: AppRole[]) {
  const nextRoles = [...new Set(roles)];

  if (nextRoles.length === 0) {
    throw new Error("Akun harus memiliki minimal satu peran");
  }

  const { data: currentRows, error: fetchError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (fetchError) throw fetchError;

  const currentRoles = new Set((currentRows ?? []).map((row) => (row as { role: AppRole }).role));
  const toAdd = nextRoles.filter((role) => !currentRoles.has(role));
  const toRemove = [...currentRoles].filter((role) => !nextRoles.includes(role));

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase.from("user_roles").insert(
      toAdd.map((role) => ({ user_id: userId, role })),
    );
    if (insertError) throw insertError;
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", toRemove);
    if (deleteError) throw deleteError;
  }

  const { data: savedRows, error: verifyError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (verifyError) throw verifyError;

  const savedRoles = new Set((savedRows ?? []).map((row) => (row as { role: AppRole }).role));
  if (savedRoles.size !== nextRoles.length || nextRoles.some((role) => !savedRoles.has(role))) {
    throw new Error("Peran akun gagal disimpan. Periksa izin admin lalu coba lagi.");
  }
}

export async function createMember(payload: CreateMemberPayload) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: {
        full_name: payload.fullName,
        phone: payload.phone ?? null,
      },
    },
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Akun anggota tidak berhasil dibuat");
  }

  await upsertUserRoles(userId, [payload.role]);

  if (payload.isActive === false) {
    const { error: statusError } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", userId);
    if (statusError) throw statusError;
  }

  return userId;
}

export async function updateMember(id: string, payload: UpdateMemberPayload) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      is_active: payload.isActive,
    })
    .eq("id", id);
  if (profileError) throw profileError;

  await upsertUserRoles(id, [payload.role]);
}

export async function toggleMemberStatus(id: string, nextStatus: boolean) {
  const { error } = await supabase.from("profiles").update({ is_active: nextStatus }).eq("id", id);
  if (error) throw error;
}
