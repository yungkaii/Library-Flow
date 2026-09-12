import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getMemberById, toggleMemberStatus, type MemberListItem } from "@/services/members.service";

export const Route = createFileRoute("/_authenticated/anggota/$memberId")({
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { memberId } = Route.useParams();
  const navigate = useNavigate();
  const { isStaff, isAdmin } = useAuth();
  const [member, setMember] = useState<MemberListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStaff) {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }

    let active = true;
    setLoading(true);

    getMemberById(memberId)
      .then((result) => {
        if (active) setMember(result);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Gagal memuat detail anggota");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isStaff, memberId, navigate]);

  const handleToggleStatus = async () => {
    if (!member) return;
    try {
      await toggleMemberStatus(member.id, !member.is_active);
      const next = !member.is_active ? "diaktifkan" : "disuspend";
      toast.success(`Anggota berhasil ${next}`);
      setMember((current: MemberListItem | null) =>
        current ? { ...current, is_active: !current.is_active } : current,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status anggota");
    }
  };

  if (loading) {
    return (
      <AppShell title="Detail Anggota">
        <p className="text-sm text-muted-foreground">Memuat data anggota...</p>
      </AppShell>
    );
  }

  if (!member) {
    return (
      <AppShell title="Detail Anggota">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Data anggota tidak ditemukan atau akun sudah dihapus.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={member.full_name || "Detail Anggota"}
      description="Ringkasan data dan status keanggotaan anggota."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link to="/anggota">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        {isAdmin && (
          <Button variant={member.is_active ? "secondary" : "default"} onClick={handleToggleStatus}>
            {member.is_active ? "Suspend" : "Aktifkan"}
          </Button>
        )}
      </div>

      <div className="grid border-t-2 border-primary lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="bg-primary p-7 text-primary-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-accent font-display text-xl font-bold text-accent-foreground">
            {member.full_name?.slice(0, 1)?.toUpperCase() || "A"}
          </div>
          <h1 className="mt-5 text-2xl font-semibold">{member.full_name || "Anggota"}</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">
            {member.member_code || "Kode belum dibuat"}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {member.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 rounded-sm border border-primary-foreground/25 px-2.5 py-1 text-[10px] font-bold uppercase"
              >
                <ShieldCheck className="h-3 w-3" />
                {role}
              </span>
            ))}
            {!member.is_active && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2.5 py-1 text-[10px] font-bold uppercase text-warning">
                Suspend
              </span>
            )}
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-primary-foreground/80">Telepon</dt>
              <dd className="font-medium">{member.phone || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-primary-foreground/80">Alamat</dt>
              <dd className="max-w-[220px] text-right font-medium">{member.address || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-primary-foreground/80">Status akun</dt>
              <dd className="font-medium">{member.is_active ? "Aktif" : "Suspend"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-primary-foreground/80">Bergabung</dt>
              <dd className="font-medium">
                {new Date(member.created_at).toLocaleDateString("id-ID")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border-x border-b border-border p-7 lg:border-l-0">
          <p className="eyebrow text-muted-foreground">Catatan keanggotaan</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Profil layanan</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Identitas, peran, dan status akun anggota dikelola dari halaman ini. Riwayat transaksi tetap tercatat pada bagian sirkulasi perpustakaan.</p>
          <div className="mt-10 border-l-2 border-accent bg-accent/15 p-5 text-sm leading-6">Gunakan status akun untuk mengatur akses anggota tanpa menghapus rekam jejaknya.</div>
        </section>
      </div>
    </AppShell>
  );
}
