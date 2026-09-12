import { createFileRoute } from "@tanstack/react-router";

import { ProfileForm } from "@/components/forms/ProfileForm";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profil")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, loading, error } = useAuth();
  const name = profile?.full_name || user?.email || "Pengguna";

  return (
    <AppShell title="Profil Saya" description="Perbarui informasi akun dan data kontak Anda.">
      {loading && <p className="text-sm text-muted-foreground">Memuat profil...</p>}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Profil belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && profile && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <section className="card-surface flex items-center gap-4 p-6 lg:block">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 lg:mt-5">
              <h1 className="truncate text-xl font-semibold">{name}</h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
              {profile.member_code && (
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary">
                  Kode anggota: {profile.member_code}
                </p>
              )}
            </div>
          </section>
          <section className="card-surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Informasi pribadi</h2>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              Data ini digunakan untuk kebutuhan layanan perpustakaan.
            </p>
            <ProfileForm profile={profile} />
          </section>
        </div>
      )}
    </AppShell>
  );
}