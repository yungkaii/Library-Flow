import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Download, FileBarChart, RefreshCw } from "lucide-react";
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
import { getReport, type ReportType } from "@/services/analytics.service";

const reportOptions: Array<{ value: ReportType; label: string }> = [
  { value: "borrowings", label: "Peminjaman" },
  { value: "returns", label: "Pengembalian" },
  { value: "overdue", label: "Keterlambatan" },
  { value: "fines", label: "Denda" },
  { value: "popular_books", label: "Buku populer" },
  { value: "active_members", label: "Anggota aktif" },
  { value: "stock", label: "Stok buku" },
];

const columnLabels: Record<string, string> = {
  id: "ID",
  member: "Anggota",
  book: "Buku",
  event_at: "Tanggal",
  borrowed_at: "Dipinjam",
  due_at: "Jatuh tempo",
  returned_at: "Dikembalikan",
  status: "Status",
  fine_amount: "Denda",
  amount: "Jumlah",
  created_at: "Dibuat",
  borrow_count: "Total pinjam",
  member_code: "Kode anggota",
  late_days: "Hari terlambat",
  title: "Judul",
  total_copies: "Total eksemplar",
  available_copies: "Tersedia",
  borrowed_copies: "Dipinjam",
};

function formatCell(value: unknown, key: string) {
  if (value === null || value === undefined) return "-";
  if (["event_at", "borrowed_at", "due_at", "returned_at", "created_at"].includes(key)) {
    return new Date(String(value)).toLocaleDateString("id-ID");
  }
  if (["amount", "fine_amount"].includes(key)) return `Rp ${Number(value).toLocaleString("id-ID")}`;
  return String(value);
}

function csvValue(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export const Route = createFileRoute("/_authenticated/laporan")({ component: ReportsPage });

function ReportsPage() {
  const { isStaff, loading: authLoading } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("borrowings");
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (from > to) {
      setError("Tanggal mulai tidak boleh melewati tanggal akhir.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await getReport(reportType, from, to));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Laporan gagal dimuat";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isStaff) void load();
  }, [authLoading, isStaff, reportType]);

  const columns = useMemo(() => {
    const keys = rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
    return keys.filter((key) => key !== "id");
  }, [rows]);

  if (!authLoading && !isStaff) return <Navigate to="/dashboard" replace />;

  const handleExport = () => {
    if (rows.length === 0 || columns.length === 0) return;
    const csv = [
      columns.map((key) => csvValue(columnLabels[key] || key)).join(","),
      ...rows.map((row) => columns.map((key) => csvValue(formatCell(row[key], key))).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `laporan-${reportType}-${from}-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan CSV berhasil diunduh");
  };

  return (
    <AppShell
      title="Laporan"
      description="Analisis operasional perpustakaan berdasarkan rentang tanggal."
    >
      <section className="mb-7 border-y border-border py-6">
        <p className="eyebrow mb-5 text-muted-foreground">Parameter laporan</p>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))_auto_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium">Jenis laporan</label>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Dari</label>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Sampai</label>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <Button onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Terapkan
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={loading || rows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Memuat laporan...</p>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-3 border-y border-border py-10 text-sm text-muted-foreground">
          <FileBarChart className="h-5 w-5" />
          Tidak ada data untuk filter yang dipilih.
        </div>
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((key) => (
                  <TableHead key={key}>{columnLabels[key] || key}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={String(row["id"] ?? rowIndex)}>
                  {columns.map((key) => (
                    <TableCell key={key}>{formatCell(row[key], key)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
