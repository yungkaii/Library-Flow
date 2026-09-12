import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Pencil, PenLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthorForm } from "@/components/forms/AuthorForm";
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
  createAuthor,
  deleteAuthor,
  listAuthorsWithCount,
  updateAuthor,
} from "@/services/authors.service";
import type { AuthorValues } from "@/lib/validations";
import type { Author } from "@/types";

export const Route = createFileRoute("/_authenticated/penulis")({
  component: AuthorPage,
});

type AuthorWithCount = Author & { book_count: number };

function AuthorPage() {
  const { isStaff, loading: authLoading } = useAuth();

  const [authors, setAuthors] = useState<AuthorWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Author | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AuthorWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    listAuthorsWithCount()
      .then(setAuthors)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Gagal memuat penulis"))
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

  const openEdit = (author: Author) => {
    setEditing(author);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: AuthorValues) => {
    try {
      const payload = { name: values.name, biography: values.biography || null };
      if (editing) {
        await updateAuthor(editing.id, payload);
        toast.success("Penulis diperbarui");
      } else {
        await createAuthor(payload);
        toast.success("Penulis ditambahkan");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan penulis");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAuthor(deleteTarget.id);
      toast.success("Penulis dihapus");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus penulis");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell title="Penulis" description="Kelola data penulis buku.">
      <div className="mb-7 flex justify-end border-y border-border py-5">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Penulis
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="Belum ada data penulis"
          description="Tambahkan penulis agar bisa dikaitkan dengan buku."
          actionLabel="Tambah Penulis"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Biografi</TableHead>
                <TableHead>Jumlah Buku</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((author) => (
                <TableRow key={author.id}>
                  <TableCell className="font-medium">{author.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate sm:table-cell">
                    {author.biography || "-"}
                  </TableCell>
                  <TableCell>{author.book_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(author)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(author)}>
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
            <DialogTitle>{editing ? "Edit Penulis" : "Tambah Penulis"}</DialogTitle>
          </DialogHeader>
          <AuthorForm {...(editing ? { author: editing } : {})} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus penulis ini?"
        description={
          deleteTarget?.book_count
            ? `Penulis "${deleteTarget?.name}" masih terkait dengan ${deleteTarget.book_count} buku.`
            : `Penulis "${deleteTarget?.name}" akan dihapus permanen.`
        }
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
