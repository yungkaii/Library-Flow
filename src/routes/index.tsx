import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, Library, ShieldCheck, Users } from "lucide-react";

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
    text: "Cari buku, lihat ketersediaan, dan kelola koleksi perpustakaan.",
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
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-border px-4 py-5 sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Library className="h-5 w-5" />
          </span>
          <span><span className="block font-display text-sm font-bold">LIBRARY FLOW</span><span className="block text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Sistem Informasi</span></span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to="/masuk" search={{ tab: "masuk" }}>
              Masuk
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-7">
        <section className="grid min-h-[68vh] border-b border-border py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.5fr)] lg:py-16">
          <div className="flex flex-col justify-between pr-0 lg:pr-16">
          <p className="eyebrow text-muted-foreground">Sistem Informasi Perpustakaan · 2026</p>
          <div className="my-14">
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.12] sm:text-6xl lg:text-7xl">
            Koleksi yang teratur.<br/><span className="italic text-primary/65">Pengetahuan yang mengalir.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">Kelola katalog, anggota, peminjaman, reservasi, denda, laporan, dan notifikasi dalam satu ruang kerja perpustakaan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/masuk" search={{ tab: "masuk" }}>
                Masuk ke ruang kerja <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/masuk" search={{ tab: "daftar" }}>
                Daftar Anggota
              </Link>
            </Button>
          </div></div>
          <aside className="mt-10 flex flex-col justify-between border-l-0 border-border bg-primary p-7 text-primary-foreground lg:mt-0 lg:border-l">
            <div><Library className="h-8 w-8 text-primary-foreground"/><p className="mt-6 font-display text-2xl font-bold leading-snug">Satu katalog.<br/>Tiga peran.<br/>Setiap alur terhubung.</p></div>
            <div className="mt-12 border-t border-primary-foreground/20 pt-5 text-xs leading-5 text-primary-foreground/65">Dibangun untuk ritme kerja pustakawan dan pengalaman anggota yang lebih jelas.</div>
          </aside>
        </section>

        <section className="grid divide-y divide-border py-10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {highlights.map((item) => (
            <article key={item.title} className="group px-0 py-7 first:pl-0 sm:px-7 sm:py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-accent-foreground transition-transform group-hover:-rotate-3">
                <item.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 font-display text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
