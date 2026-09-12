import { createFileRoute, Navigate } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { listBorrowingHistory } from "@/services/borrowings.service";
import type { BorrowingWithRelations } from "@/services/borrowings.service";

export const Route = createFileRoute("/_authenticated/peminjaman/riwayat")({
  component: BorrowingHistoryPage,
});

function BorrowingHistoryPage() {
  const { isStaff, loading: authLoading } = useAuth();
  const [items, setItems] = useState<BorrowingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStaff) return;
    listBorrowingHistory()
      .then(setItems)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Gagal memuat riwayat peminjaman");
      })
      .finally(() => setLoading(false));
  }, [isStaff]);

  if (!authLoading && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppShell title="Riwayat Peminjaman" description="Semua transaksi pinjam yang sudah selesai atau dikembalikan.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat riwayat peminjaman...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum ada riwayat"
          description="Riwayat peminjaman akan muncul setelah transaksi selesai dikembalikan."
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
                <TableHead>Dikembalikan</TableHead>
                <TableHead>Denda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.user?.full_name || "-"}</TableCell>
                  <TableCell>{item.book?.title || "-"}</TableCell>
                  <TableCell>{new Date(item.borrowed_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{new Date(item.due_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{item.returned_at ? new Date(item.returned_at).toLocaleDateString("id-ID") : "-"}</TableCell>
                  <TableCell>Rp {Number(item.fine_amount ?? 0).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
