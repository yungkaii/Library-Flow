import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  FileBarChart,
  LayoutDashboard,
  Library,
  PenLine,
  Settings2,
  Tag,
  UserRound,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Katalog Buku", url: "/buku", icon: BookOpen },
  { title: "Reservasi", url: "/reservasi", icon: CalendarClock },
  { title: "Denda", url: "/denda", icon: CircleDollarSign },
] as const;

const circulationItems = [
  { title: "Anggota", url: "/anggota", icon: UserRound },
  { title: "Peminjaman Baru", url: "/peminjaman/baru", icon: Clock3 },
  { title: "Pengembalian", url: "/pengembalian", icon: ArrowLeftRight },
  { title: "Peminjaman Aktif", url: "/peminjaman/aktif", icon: Clock3 },
  { title: "Riwayat", url: "/peminjaman/riwayat", icon: BookOpen },
  { title: "Laporan", url: "/laporan", icon: FileBarChart },
] as const;

const archiveItems = [
  { title: "Kategori", url: "/kategori", icon: Tag },
  { title: "Penulis", url: "/penulis", icon: PenLine },
  { title: "Penerbit", url: "/penerbit", icon: Building2 },
] as const;

const footerItems = [{ title: "Profil Saya", url: "/profil", icon: UserRound }] as const;
const adminItems = [{ title: "Pengaturan", url: "/pengaturan", icon: Settings2 }] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { isStaff, isAdmin } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 pb-5 pt-6 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-4 group-data-[collapsible=icon]:pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground shadow-lg group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <Library className="h-5 w-5 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-bold">LIBRARY FLOW</span>
              <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">Indeks Koleksi Digital</span>
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Ikhtisar</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <Link to={item.url} className="relative flex items-center gap-3 py-1 data-[status=active]:font-semibold">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isStaff && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Sirkulasi</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {circulationItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isStaff && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Arsip Induk</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {archiveItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url}>
                      <Link to={item.url} className="flex items-center gap-3"><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Administrasi</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Akun</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!collapsed && <p className="px-2 pt-3 text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground/35">Sistem operasional perpustakaan</p>}
      </SidebarFooter>
    </Sidebar>
  );
}
