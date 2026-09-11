import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Library, ShieldCheck, Users } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistem Informasi Perpustakaan & Peminjaman Buku" },
      {
        name: "description",
        content:
          "Kelola katalog, keanggotaan, dan peminjaman buku dalam satu dashboard perpustakaan yang modern dan aman.",
      },
      { property: "og:title", content: "Sistem Informasi Perpustakaan & Peminjaman Buku" },
      {
        property: "og:description",
        content: "Dashboard perpustakaan modern: katalog, anggota, peminjaman, dan denda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const highlights = [
  {
    icon: BookOpen,
    title: "Katalog Terpusat",
    text: "Fondasi data buku dan kategori siap dikembangkan pada fase berikutnya.",
  },
  {
    icon: Users,
    title: "Tiga Peran",
    text: "Admin, Petugas, dan Anggota dengan hak akses yang berbeda.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Basis Data",
    text: "Hak akses ditegakkan di level basis data, bukan sekadar disembunyikan di tampilan.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Library className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-semibold">Perpustakaan</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to="/masuk">Masuk</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <section className="py-12 sm:py-20">
          <p className="text-sm font-medium text-muted-foreground">Fase 1 — Fondasi & Akun</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Sistem Informasi Perpustakaan & Peminjaman Buku
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Masuk untuk mengakses dashboard. Anggota baru dapat mendaftar sendiri dan langsung
            memperoleh akun keanggotaan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/masuk">Masuk ke Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/masuk" search={{ tab: "daftar" }}>
                Daftar Anggota
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="card-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <item.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
