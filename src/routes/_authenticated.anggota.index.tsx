import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  CircleDashed,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MemberForm } from "@/components/forms/MemberForm";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  createMember,
  listMembers,
  toggleMemberStatus,
  updateMember,
  type MemberListItem,
} from "@/services/members.service";
import type { AppRole } from "@/types";

export const Route = createFileRoute("/_authenticated/anggota/")({
  component: MembersPage,
});

function MembersPage() {
  const navigate = useNavigate();
  const { isStaff, isAdmin, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<MemberListItem | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await listMembers();
      setMembers(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat daftar anggota");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) => {
      const haystack = [member.full_name, member.member_code, member.phone, member.roles.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [members, query]);

  if (!authLoading && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  const allowedRoles: AppRole[] = isAdmin ? ["admin", "petugas", "anggota"] : ["anggota"];

  const handleCreate = async (values: Parameters<typeof createMember>[0]) => {
    try {
      await createMember(values);
      toast.success("Anggota baru berhasil ditambahkan");
      setDialogOpen(false);
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan anggota");
    }
  };

  const handleEdit = async (values: Parameters<typeof updateMember>[1], memberId: string) => {
    try {
      await updateMember(memberId, values);
      toast.success("Data anggota berhasil diperbarui");
      setDialogOpen(false);
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui anggota");
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setStatusUpdating(true);
    try {
      await toggleMemberStatus(statusTarget.id, !statusTarget.is_active);
      toast.success(
        statusTarget.is_active ? "Anggota berhasil disuspend" : "Anggota berhasil diaktifkan",
      );
      setStatusTarget(null);
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status anggota");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <AppShell title="Anggota" description="Kelola data anggota, status akun, dan hak akses.">
      <div className="mb-7 grid gap-4 border-y border-border py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
        <p className="eyebrow mb-3 text-muted-foreground">Direktori keanggotaan</p>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, kode, atau nomor telepon"
            className="pl-9"
          />
        </div></div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggota
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Belum ada anggota"
          description="Data anggota belum tersedia. Tambahkan anggota baru untuk mulai mengelola perpustakaan."
          actionLabel="Tambah Anggota"
          onAction={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="font-medium">{member.full_name || "Tanpa nama"}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.phone || "Belum ada telepon"}
                    </div>
                  </TableCell>
                  <TableCell>{member.member_code || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.roles.length > 0 ? (
                        member.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-2 py-1 text-[10px] font-bold uppercase"
                          >
                            {role === "admin" ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <UserRound className="h-3 w-3" />
                            )}
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Belum ada</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success">
                        <BadgeCheck className="h-3.5 w-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-warning/10 px-2 py-1 text-[10px] font-bold uppercase text-warning">
                        <CircleDashed className="h-3.5 w-3.5" /> Suspend
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/anggota/$memberId" params={{ memberId: member.id }}>
                          <UserRound className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(member);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStatusTarget(member)}
                        aria-label={member.is_active ? "Suspend anggota" : "Aktifkan anggota"}
                      >
                        {member.is_active ? (
                          <CircleDashed className="h-4 w-4" />
                        ) : (
                          <BadgeCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Anggota" : "Tambah Anggota"}</DialogTitle>
          </DialogHeader>
          <MemberForm
            mode={editing ? "edit" : "create"}
            {...(editing
              ? {
                  member: {
                    full_name: editing.full_name,
                    phone: editing.phone,
                    address: editing.address,
                    is_active: editing.is_active,
                    roles: editing.roles,
                  },
                }
              : {})}
            allowedRoles={allowedRoles}
            onSubmit={async (values) => {
              if (editing) {
                if (!("password" in values)) {
                  await handleEdit(
                    {
                      fullName: values.fullName,
                      phone: values.phone || null,
                      address: values.address || null,
                      role: values.role,
                      isActive: values.isActive,
                    },
                    editing.id,
                  );
                }
                return;
              }

              if ("password" in values && "email" in values) {
                await handleCreate({
                  fullName: values.fullName,
                  email: values.email,
                  password: values.password,
                  phone: values.phone || null,
                  address: values.address || null,
                  role: values.role,
                  isActive: values.isActive,
                });
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={statusTarget?.is_active ? "Suspend anggota ini?" : "Aktifkan anggota ini?"}
        description={
          statusTarget?.is_active
            ? `Akun "${statusTarget.full_name || "anggota ini"}" akan dinonaktifkan sementara.`
            : `Akun "${statusTarget?.full_name || "anggota ini"}" akan diaktifkan kembali.`
        }
        confirmLabel={statusTarget?.is_active ? "Suspend" : "Aktifkan"}
        loading={statusUpdating}
        onConfirm={handleToggleStatus}
      />

      {!isAdmin && (
        <Alert className="mt-6">
          <AlertTitle>Mode akses petugas</AlertTitle>
          <AlertDescription>
            Anda dapat mengelola data anggota dan status akun, tetapi perubahan peran admin/petugas
            hanya bisa dilakukan oleh admin.
          </AlertDescription>
        </Alert>
      )}
    </AppShell>
  );
}
