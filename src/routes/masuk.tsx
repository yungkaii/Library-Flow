import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { useEffect } from "react";

import { LoginForm } from "@/components/forms/LoginForm";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";

type AuthTab = "masuk" | "daftar";

export const Route = createFileRoute("/masuk")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { tab: AuthTab } => ({
    tab: search['tab'] === "daftar" ? "daftar" : "masuk",
  }),
  head: () => ({
    meta: [
      { title: "Masuk — Sistem Informasi Perpustakaan" },
      {
        name: "description",
        content: "Masuk atau daftar untuk mengakses dashboard perpustakaan dan layanan peminjaman.",
      },
      { property: "og:title", content: "Masuk — Sistem Informasi Perpustakaan" },
      {
        property: "og:description",
        content: "Akses akun perpustakaan Anda: katalog, peminjaman, dan riwayat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-accent-foreground">
            <Library className="h-5 w-5" />
          </span>
          <span className="font-display text-sm font-bold tracking-wide text-foreground lg:text-primary-foreground">LIBRARY FLOW</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="grid min-h-screen lg:grid-cols-[minmax(0,.9fr)_minmax(28rem,.55fr)]">
        <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-end">
          <p className="eyebrow text-primary-foreground">Ruang baca digital</p>
          <h2 className="mt-5 max-w-xl font-display text-5xl font-bold leading-tight">Setiap buku punya tempat. Setiap pembaca punya perjalanan.</h2>
          <div className="mt-12 grid grid-cols-3 border-t border-primary-foreground/20 pt-6 text-xs text-primary-foreground/60"><span>Katalog</span><span>Sirkulasi</span><span>Keanggotaan</span></div>
        </section>
        <section className="flex flex-col justify-center px-5 pb-12 pt-24 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
        {!isSupabaseConfigured && (
          <Alert className="mb-4">
            <AlertTitle>Basis data belum terhubung</AlertTitle>
            <AlertDescription>
              Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada file .env agar login dan
              pendaftaran berfungsi.
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t-2 border-primary pt-7">
          <p className="eyebrow text-muted-foreground">Akses anggota & staf</p>
          <h1 className="mt-3 font-display text-3xl font-bold">
            {tab === "daftar" ? "Buat Akun Anggota" : "Masuk ke Akun"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "daftar"
              ? "Pendaftaran mandiri untuk anggota perpustakaan."
              : "Gunakan email dan kata sandi akun Anda."}
          </p>

          <Tabs
            value={tab}
            onValueChange={(value) =>
              navigate({ to: "/masuk", search: { tab: value as AuthTab }, replace: true })
            }
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="masuk">Masuk</TabsTrigger>
              <TabsTrigger value="daftar">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="masuk" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="daftar" className="mt-6">
              <RegisterForm
                onRegistered={() =>
                  navigate({ to: "/masuk", search: { tab: "masuk" }, replace: true })
                }
              />
            </TabsContent>
          </Tabs>
        </div></div></section>
      </main>
    </div>
  );
}
