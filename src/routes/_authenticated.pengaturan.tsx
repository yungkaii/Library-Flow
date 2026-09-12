import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SettingsForm } from "@/components/forms/SettingsForm";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getLibrarySettings } from "@/services/settings.service";
import type { LibrarySettings } from "@/types";

export const Route = createFileRoute("/_authenticated/pengaturan")({ component: SettingsPage });

function SettingsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    getLibrarySettings()
      .then(setSettings)
      .catch((reason) => {
        const message = reason instanceof Error ? reason.message : "Gagal memuat pengaturan";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!authLoading && !isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell
      title="Pengaturan"
      description="Kelola identitas, aturan layanan, dan preferensi perpustakaan."
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Pengaturan belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : settings ? (
        <section className="border-t-2 border-primary py-7">
          <div className="mb-8 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 border-b border-border pb-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-accent-foreground">
              <Settings2 className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow text-muted-foreground">Administrasi</p>
              <h1 className="mt-1 font-display text-2xl font-bold">Pengaturan sistem</h1>
              <p className="text-sm text-muted-foreground">
                Perubahan di sini hanya dapat dilakukan oleh admin.
              </p>
            </div>
          </div>
          <SettingsForm settings={settings} onSaved={setSettings} />
        </section>
      ) : null}
    </AppShell>
  );
}
