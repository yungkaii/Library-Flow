import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { listActiveBorrowings } from "@/services/borrowings.service";
import type { BorrowingWithRelations } from "@/services/borrowings.service";

export const Route = createFileRoute("/_authenticated/peminjaman/aktif")({
  component: ActiveBorrowingsPage,
});

function ActiveBorrowingsPage() {
  const { isStaff, loading: authLoading } = useAuth();
  const [items, setItems] = useState<BorrowingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStaff) return;
    listActiveBorrowings()
      .then(setItems)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Gagal memuat peminjaman aktif");
      })
      .finally(() => setLoading(false));
  }, [isStaff]);

  if (!authLoading && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppShell title="Peminjaman Aktif" description="Daftar buku yang masih dipinjam dan belum dikembalikan.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat peminjaman aktif...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="Belum ada peminjaman aktif"
          description="Tidak ada transaksi pinjam yang masih berjalan saat ini."
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Buku</TableHead>
                <TableHead>Dipinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isLate = new Date(item.due_at).getTime() < Date.now();
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.user?.full_name || "-"}</TableCell>
                    <TableCell>{item.book?.title || "-"}</TableCell>
                    <TableCell>{new Date(item.borrowed_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{new Date(item.due_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isLate
                            ? "rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                            : "rounded-sm bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success"
                        }
                      >
                        {isLate ? "Terlambat" : "Aktif"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
