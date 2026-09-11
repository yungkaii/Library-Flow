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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Library className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-semibold">Perpustakaan</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        {!isSupabaseConfigured && (
          <Alert className="mb-4">
            <AlertTitle>Basis data belum terhubung</AlertTitle>
            <AlertDescription>
              Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada file .env agar login dan
              pendaftaran berfungsi.
            </AlertDescription>
          </Alert>
        )}

        <div className="card-surface p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">
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
        </div>
      </main>
    </div>
  );
}
