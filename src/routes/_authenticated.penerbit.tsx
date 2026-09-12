import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PublisherForm } from "@/components/forms/PublisherForm";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
  createPublisher,
  deletePublisher,
  listPublishersWithCount,
  updatePublisher,
} from "@/services/publishers.service";
import type { PublisherValues } from "@/lib/validations";
import type { Publisher } from "@/types";

export const Route = createFileRoute("/_authenticated/penerbit")({
  component: PublisherPage,
});

type PublisherWithCount = Publisher & { book_count: number };

function PublisherPage() {
  const { isStaff, loading: authLoading } = useAuth();

  const [publishers, setPublishers] = useState<PublisherWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Publisher | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<PublisherWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    listPublishersWithCount()
      .then(setPublishers)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Gagal memuat penerbit"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (!authLoading && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (publisher: Publisher) => {
    setEditing(publisher);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: PublisherValues) => {
    try {
      const payload = {
        name: values.name,
        address: values.address || null,
        website: values.website || null,
        contact: values.contact || null,
      };
      if (editing) {
        await updatePublisher(editing.id, payload);
        toast.success("Penerbit diperbarui");
      } else {
        await createPublisher(payload);
        toast.success("Penerbit ditambahkan");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan penerbit");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePublisher(deleteTarget.id);
      toast.success("Penerbit dihapus");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus penerbit");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell title="Penerbit" description="Kelola data penerbit buku.">
      <div className="mb-7 flex justify-end border-y border-border py-5">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Penerbit
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : publishers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada data penerbit"
          description="Tambahkan penerbit agar bisa dikaitkan dengan buku."
          actionLabel="Tambah Penerbit"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Kontak</TableHead>
                <TableHead>Jumlah Buku</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publishers.map((publisher) => (
                <TableRow key={publisher.id}>
                  <TableCell className="font-medium">{publisher.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {publisher.contact || publisher.website || "-"}
                  </TableCell>
                  <TableCell>{publisher.book_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(publisher)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(publisher)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Penerbit" : "Tambah Penerbit"}</DialogTitle>
          </DialogHeader>
          <PublisherForm {...(editing ? { publisher: editing } : {})} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus penerbit ini?"
        description={
          deleteTarget?.book_count
            ? `Penerbit "${deleteTarget?.name}" masih terkait dengan ${deleteTarget.book_count} buku.`
            : `Penerbit "${deleteTarget?.name}" akan dihapus permanen.`
        }
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
