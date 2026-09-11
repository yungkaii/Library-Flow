import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/layout/AppSidebar";
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
      await navigate({ to: "/masuk", replace: true });
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
          <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <div className="ml-1 flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-display text-base font-semibold sm:text-lg">
                {title}
              </span>
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="hidden shrink-0 sm:inline-flex">
                  {ROLE_LABEL[role]}
                </Badge>
              ))}
            </div>
            <ThemeToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials(displayName)}</AvatarFallback>
              </Avatar>
              <span className="max-w-[10rem] truncate text-sm text-muted-foreground">
                {displayName}
              </span>
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
          </header>

          <main className="min-w-0 flex-1 px-3 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              {description && (
                <p className="mb-6 text-sm text-muted-foreground">{description}</p>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
