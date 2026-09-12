import { createFileRoute, Navigate } from "@tanstack/react-router";
import { CalendarClock, Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  cancelReservation,
  completeReservation,
  listReservations,
} from "@/services/reservations.service";
import type { ReservationWithRelations } from "@/services/reservations.service";
import type { ReservationStatus } from "@/types";

const statusLabels: Record<ReservationStatus, string> = {
  waiting: "Menunggu",
  ready: "Siap diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const Route = createFileRoute("/_authenticated/reservasi")({
  component: ReservationsPage,
});

function ReservationsPage() {
  const { user, isStaff, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ReservationWithRelations[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<"cancel" | "complete" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setItems(await listReservations(isStaff ? {} : { userId: user.id }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat reservasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, isStaff, user?.id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.book?.title, item.user?.full_name, item.user?.member_code, statusLabels[item.status]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [items, query]);

  if (!authLoading && !user) return <Navigate to="/masuk" search={{ tab: "masuk" }} replace />;

  const handleAction = async () => {
    if (!selectedId || !action) return;
    setSubmitting(true);
    try {
      if (action === "cancel") await cancelReservation(selectedId);
      else await completeReservation(selectedId);
      toast.success(action === "cancel" ? "Reservasi dibatalkan" : "Reservasi ditandai selesai");
      setSelectedId(null);
      setAction(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aksi reservasi gagal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Reservasi"
      description={
        isStaff
          ? "Kelola antrean reservasi dan buku yang siap diambil."
          : "Pantau antrean reservasi buku Anda."
      }
    >
      <div className="mb-7 border-y border-border py-5">
        <p className="eyebrow mb-3 text-muted-foreground">Pencarian antrean</p>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari buku atau anggota"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat reservasi...</p>
      ) : filtered.length === 0 ? (
        <div className="flex items-center gap-3 border-y border-border py-10 text-sm text-muted-foreground">
          <CalendarClock className="h-5 w-5" />
          Belum ada data reservasi.
        </div>
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                {isStaff && <TableHead>Anggota</TableHead>}
                <TableHead>Buku</TableHead>
                <TableHead>Reservasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Siap sampai</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  {isStaff && (
                    <TableCell>{item.user?.full_name || item.user?.member_code || "-"}</TableCell>
                  )}
                  <TableCell>{item.book?.title || "-"}</TableCell>
                  <TableCell>{new Date(item.reserved_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.status === "ready"
                          ? "rounded-sm bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success"
                          : "rounded-sm bg-muted px-2 py-1 text-[10px] font-bold uppercase"
                      }
                    >
                      {statusLabels[item.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.expires_at ? new Date(item.expires_at).toLocaleDateString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === "ready" && isStaff && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedId(item.id);
                            setAction("complete");
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" /> Selesai
                        </Button>
                      )}
                      {(item.status === "waiting" || item.status === "ready") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedId(item.id);
                            setAction("cancel");
                          }}
                        >
                          <X className="mr-2 h-4 w-4" /> Batalkan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(selectedId && action)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setAction(null);
          }
        }}
        title={action === "complete" ? "Selesaikan reservasi ini?" : "Batalkan reservasi ini?"}
        description={
          action === "complete"
            ? "Tindakan ini menutup antrean reservasi untuk anggota."
            : "Reservasi aktif akan dilepas dari antrean."
        }
        confirmLabel={action === "complete" ? "Selesaikan" : "Batalkan"}
        destructive={action === "cancel"}
        loading={submitting}
        onConfirm={handleAction}
      />
    </AppShell>
  );
}
