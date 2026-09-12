import { createFileRoute, Navigate } from "@tanstack/react-router";
import { CircleDollarSign, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { listFines, updateFineStatus } from "@/services/fines.service";
import type { FineStatus } from "@/types";
import type { FineWithRelations } from "@/services/fines.service";

const statusLabels: Record<FineStatus, string> = {
  unpaid: "Belum dibayar",
  paid: "Dibayar",
  waived: "Dibebaskan",
};

export const Route = createFileRoute("/_authenticated/denda")({
  component: FinesPage,
});

function FinesPage() {
  const { user, isStaff, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FineWithRelations[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setItems(await listFines(isStaff ? undefined : user.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat denda");
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

  const handleStatusChange = async (fineId: string, status: FineStatus) => {
    setUpdatingId(fineId);
    try {
      await updateFineStatus(fineId, status);
      toast.success("Status denda diperbarui");
      setItems((current) =>
        current.map((item) => (item.id === fineId ? { ...item, status } : item)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status denda");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell
      title="Denda"
      description={
        isStaff
          ? "Lihat dan kelola status denda anggota."
          : "Lihat denda yang tercatat pada akun Anda."
      }
    >
      <div className="mb-7 border-y border-border py-5">
        <p className="eyebrow mb-3 text-muted-foreground">Pencarian catatan denda</p>
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
        <p className="text-sm text-muted-foreground">Memuat denda...</p>
      ) : filtered.length === 0 ? (
        <div className="flex items-center gap-3 border-y border-border py-10 text-sm text-muted-foreground">
          <CircleDollarSign className="h-5 w-5" />
          Belum ada denda.
        </div>
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                {isStaff && <TableHead>Anggota</TableHead>}
                <TableHead>Buku</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  {isStaff && (
                    <TableCell>{item.user?.full_name || item.user?.member_code || "-"}</TableCell>
                  )}
                  <TableCell>{item.book?.title || "-"}</TableCell>
                  <TableCell>Rp {item.amount.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    {isStaff ? (
                      <Select
                        value={item.status}
                        onValueChange={(value) =>
                          void handleStatusChange(item.id, value as FineStatus)
                        }
                        disabled={updatingId === item.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Belum dibayar</SelectItem>
                          <SelectItem value="paid">Dibayar</SelectItem>
                          <SelectItem value="waived">Dibebaskan</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="rounded-sm bg-muted px-2 py-1 text-[10px] font-bold uppercase">
                        {statusLabels[item.status]}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
