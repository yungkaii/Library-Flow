import { useNavigate } from "@tanstack/react-router";
import { LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/services/auth.service";
import { ROLE_LABEL } from "@/types";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { profile, user, roles } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Berhasil keluar");
      await navigate({ to: "/masuk", search: { tab: "masuk" }, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal keluar");
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = profile?.full_name || user?.email || "Pengguna";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-background/90 px-3 backdrop-blur-md sm:px-7">
            <SidebarTrigger className="shrink-0" />
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden h-5 w-px bg-border sm:block" />
              <span className="max-w-[38vw] truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:max-w-none">{title}</span>
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="hidden shrink-0 rounded-sm text-[10px] uppercase tracking-[0.1em] lg:inline-flex">
                  {ROLE_LABEL[role]}
                </Badge>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <NotificationCenter />
              <div className="ml-1 hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <Avatar className="h-8 w-8 rounded-sm">
                <AvatarFallback className="rounded-sm bg-primary text-xs text-primary-foreground">{initials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="block max-w-[9rem] truncate text-xs font-semibold">{displayName}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Sparkles className="h-2.5 w-2.5" /> Sedang bertugas</span>
              </div>
              </div>
              <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
            <div className="page-enter mx-auto w-full max-w-7xl">
              {description && <p className="mb-7 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
