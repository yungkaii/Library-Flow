import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, Clock3, FileBarChart, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardData, type DashboardData } from "@/services/analytics.service";
import { ROLE_LABEL } from "@/types";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

const statCards = [
  {
    key: "total_books",
    label: "Total buku",
    icon: BookOpen,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
  {
    key: "total_members",
    label: "Anggota",
    icon: UsersRound,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
  {
    key: "available_copies",
    label: "Buku tersedia",
    icon: BookOpen,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
  {
    key: "borrowed_copies",
    label: "Buku dipinjam",
    icon: BookOpen,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
  {
    key: "active_borrowings",
    label: "Peminjaman aktif",
    icon: Clock3,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
  {
    key: "overdue_borrowings",
    label: "Terlambat",
    icon: Clock3,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
  {
    key: "unpaid_fines",
    label: "Denda belum dibayar",
    icon: FileBarChart,
    format: (value: number) => `Rp ${value.toLocaleString("id-ID")}`,
  },
  {
    key: "active_reservations",
    label: "Reservasi aktif",
    icon: FileBarChart,
    format: (value: number) => value.toLocaleString("id-ID"),
  },
] as const;

function DashboardPage() {
  const { profile, roles, isStaff, error: authError } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(isStaff);
  const [error, setError] = useState<string | null>(null);
  const displayName = profile?.full_name || "Pengguna";

  useEffect(() => {
    if (!isStaff) return;
    getDashboardData()
      .then(setData)
      .catch((reason) => {
        const message = reason instanceof Error ? reason.message : "Dashboard gagal dimuat";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [isStaff]);

  return (
    <AppShell
      title="Dashboard"
      description="Ringkasan operasional perpustakaan dan akses layanan Anda."
    >
      <section className="relative mb-10 grid min-h-72 overflow-hidden bg-primary text-primary-foreground lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,.55fr)]">
        <div className="flex flex-col justify-between p-7 sm:p-10">
          <p className="eyebrow text-primary-foreground/80">Edisi operasional · hari ini</p>
          <div className="mt-12">
            <p className="font-display text-lg italic text-primary-foreground/85">Selamat datang kembali,</p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">{displayName}</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/80">Semua koleksi, sirkulasi, dan aktivitas anggota tersusun dalam satu pandangan yang hidup.</p>
          </div>
        </div>
        <div className="flex flex-col justify-between border-t border-primary-foreground/15 bg-primary-foreground/5 p-7 lg:border-l lg:border-t-0">
          <div>
            <span className="inline-flex items-center gap-2 text-xs text-primary-foreground/70"><span className="h-2 w-2 rounded-full bg-chartreuse" /> Perpustakaan aktif</span>
            <p className="mt-3 text-xs leading-5 text-primary-foreground/75">Akses sebagai {roles.map((role) => ROLE_LABEL[role]).join(", ") || "Anggota"}</p>
          </div>
          <div className="mt-8 grid gap-2">
          <Button asChild variant="secondary" className="justify-between">
            <Link to="/buku">
              Katalog Buku
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-between text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link to="/profil">
              Profil
              <UserRound className="h-4 w-4" />
            </Link>
          </Button>
          </div>
        </div>
      </section>

      {authError && (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Data akun belum dapat dimuat: {authError}
        </p>
      )}
      {!isStaff ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/peminjaman/aktif"
            label="Peminjaman aktif"
            description="Pantau buku yang sedang Anda pinjam."
          />
          <QuickAction
            href="/reservasi"
            label="Reservasi"
            description="Lihat antrean dan status reservasi."
          />
          <QuickAction href="/denda" label="Denda" description="Periksa tagihan denda akun Anda." />
        </section>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Memuat ringkasan operasional...</p>
      ) : error || !data ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Data dashboard tidak tersedia."}
        </div>
      ) : (
        <StaffDashboard data={data} />
      )}
    </AppShell>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={href as never}
      className="group border-t border-border py-6 transition-colors hover:border-primary"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{label}</h2>
        <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

function StaffDashboard({ data }: { data: DashboardData }) {
  const totalBooks = statCards[0].format(data.stats.total_books);
  return (
    <>
      <section className="grid border-y border-border lg:grid-cols-[1.5fr_.8fr_.8fr]">
        <article className="flex min-h-64 flex-col justify-between py-7 pr-7 lg:border-r lg:border-border">
          <p className="eyebrow text-muted-foreground">Koleksi utama</p>
          <div>
            <p className="font-display text-6xl font-bold leading-none sm:text-7xl">{totalBooks}</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Judul tercatat dengan {data.stats.available_copies.toLocaleString("id-ID")} eksemplar siap dipinjam.</p>
          </div>
        </article>
        <article className="flex min-h-52 flex-col justify-between border-t border-border p-7 lg:border-r lg:border-t-0">
          <Clock3 className="h-5 w-5 text-primary" />
          <div><p className="font-display text-4xl font-bold">{data.stats.active_borrowings.toLocaleString("id-ID")}</p><p className="mt-2 text-sm text-muted-foreground">Peminjaman aktif</p></div>
        </article>
        <article className="flex min-h-52 flex-col justify-between border-t border-border bg-warning/12 p-7 lg:border-t-0">
          <p className="eyebrow text-warning">Perlu perhatian</p>
          <div><p className="font-display text-4xl font-bold text-warning">{data.stats.overdue_borrowings.toLocaleString("id-ID")}</p><p className="mt-2 text-sm text-muted-foreground">Peminjaman terlambat</p></div>
        </article>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,.55fr)]">
        <div className="border-b border-border pb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow text-muted-foreground">Tren sirkulasi</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Peminjaman per bulan</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/laporan">Laporan</Link>
            </Button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_borrowings}>
                <CartesianGrid strokeDasharray="2 8" vertical={false} opacity={0.35} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Peminjaman"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-primary p-6 text-primary-foreground shadow-elevated">
          <h2 className="font-display text-xl font-bold">Buku populer</h2>
          <p className="mb-4 text-sm text-primary-foreground/80">Paling sering dipinjam</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.popular_books} layout="vertical" margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="2 8" horizontal={false} opacity={0.2} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="title" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Dipinjam" fill="var(--chartreuse)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(15rem,.7fr)]">
        <div className="overflow-x-auto border-t border-border pt-6">
          <p className="eyebrow text-muted-foreground">Catatan harian</p>
          <h2 className="mb-5 mt-2 font-display text-2xl font-bold">Aktivitas terbaru</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Aktivitas</th>
                <th className="pb-2 font-medium">Anggota</th>
                <th className="pb-2 text-right font-medium">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_activity.map((item, index) => (
                <tr key={`${item.created_at}-${index}`} className="border-b last:border-0">
                  <td className="py-3">{item.title}</td>
                  <td className="py-3 text-muted-foreground">{item.user_name}</td>
                  <td className="py-3 text-right text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recent_activity.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">Belum ada aktivitas.</p>
          )}
        </div>
        <div className="border-l-2 border-accent bg-secondary/45 p-6">
          <p className="eyebrow text-muted-foreground">Jalan pintas</p>
          <h2 className="mt-2 font-display text-xl font-bold">Aksi cepat</h2>
          <div className="mt-4 grid gap-2">
            <Button asChild className="justify-start">
              <Link to="/peminjaman/baru">
                <Clock3 className="mr-2 h-4 w-4" />
                Peminjaman baru
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/pengembalian">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Proses pengembalian
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/anggota">
                <UsersRound className="mr-2 h-4 w-4" />
                Kelola anggota
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
