import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ArrowLeftRight, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { listBorrowings, returnBorrowing } from "@/services/borrowings.service";
import type { BorrowingWithRelations } from "@/services/borrowings.service";

export const Route = createFileRoute("/_authenticated/pengembalian")({
  component: ReturnPage,
});

function ReturnPage() {
  const { isStaff, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<BorrowingWithRelations[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listBorrowings({ status: "active" });
      setTransactions(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data pinjaman aktif");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaff) return;
    void load();
  }, [isStaff]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return transactions;
    return transactions.filter((item) => {
      const haystack = [
        item.user?.full_name,
        item.user?.member_code,
        item.book?.title,
        item.book?.id,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query, transactions]);

  if (!authLoading && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleReturn = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await returnBorrowing(selectedId);
      toast.success("Buku berhasil dikembalikan");
      setSelectedId(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengembalikan buku");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Pengembalian" description="Cari transaksi peminjaman dan konfirmasi pengembalian buku.">
      <div className="mb-7 border-y border-border py-5">
        <p className="eyebrow mb-3 text-muted-foreground">Temukan transaksi</p>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari anggota atau buku"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat peminjaman aktif...</p>
      ) : filtered.length === 0 ? (
        <div className="border-y border-border py-10 text-sm text-muted-foreground">
          Tidak ada peminjaman aktif yang perlu dikembalikan.
        </div>
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Buku</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const isLate = new Date(item.due_at).getTime() < Date.now();
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.user?.full_name || "-"}</TableCell>
                    <TableCell>{item.book?.title || "-"}</TableCell>
                    <TableCell>{new Date(item.due_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      {isLate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <ShieldCheck className="h-3 w-3" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success">
                          Aktif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => setSelectedId(item.id)}>
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        Kembalikan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title="Konfirmasi pengembalian buku?"
        description="Pastikan buku sudah diterima kembali dari anggota sebelum proses dikonfirmasi."
        confirmLabel="Kembalikan"
        loading={submitting}
        onConfirm={handleReturn}
      />
    </AppShell>
  );
}
