import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Clock3, UserRound, UsersRound } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const overview = [
  { label: "Buku tersedia", value: "Segera hadir", icon: BookOpen },
  { label: "Peminjaman aktif", value: "Segera hadir", icon: Clock3 },
  { label: "Anggota", value: "Segera hadir", icon: UsersRound },
];

function DashboardPage() {
  const { profile, roles, error } = useAuth();
  const displayName = profile?.full_name || "Pengguna";

  return (
    <AppShell
      title="Dashboard"
      description="Ringkasan akun dan akses layanan perpustakaan Anda."
    >
      <section className="mb-8 rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-elevated sm:p-8">
        <p className="text-sm font-medium text-primary-foreground/75">Selamat datang kembali</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{displayName}</h1>
        <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
          Akun Anda aktif sebagai {roles.map((role) => ROLE_LABEL[role]).join(", ") || "Anggota"}.
          Kelola data diri dan pantau aktivitas perpustakaan dari sini.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link to="/profil">
            <UserRound className="mr-2 h-4 w-4" />
            Buka Profil
          </Link>
        </Button>
      </section>

      {error && (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Data akun belum dapat dimuat: {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {overview.map((item) => (
          <article key={item.label} className="card-surface p-5">
            <item.icon className="h-5 w-5 text-primary" />
            <p className="mt-5 text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-lg font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 card-surface p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Aktivitas peminjaman</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Katalog dan fitur peminjaman akan tersedia pada fase berikutnya.
        </p>
      </section>
    </AppShell>
  );
}