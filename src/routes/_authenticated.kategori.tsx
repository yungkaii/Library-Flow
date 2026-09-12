import { createFileRoute, Navigate } from "@tanstack/react-router";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CategoryForm } from "@/components/forms/CategoryForm";
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
  createCategory,
  deleteCategory,
  listCategoriesWithCount,
  updateCategory,
} from "@/services/categories.service";
import type { CategoryValues } from "@/lib/validations";
import type { Category } from "@/types";

export const Route = createFileRoute("/_authenticated/kategori")({
  component: CategoryPage,
});

type CategoryWithCount = Category & { book_count: number };

function CategoryPage() {
  const { isStaff, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    listCategoriesWithCount()
      .then(setCategories)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Gagal memuat kategori"))
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

  const openEdit = (category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: CategoryValues) => {
    try {
      const payload = { name: values.name, description: values.description || null };
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success("Kategori diperbarui");
      } else {
        await createCategory(payload);
        toast.success("Kategori ditambahkan");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan kategori");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast.success("Kategori dihapus");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell title="Kategori" description="Kelola kategori buku pada katalog.">
      <div className="mb-7 flex justify-end border-y border-border py-5">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Belum ada kategori"
          description="Tambahkan kategori pertama untuk mulai mengelompokkan buku."
          actionLabel="Tambah Kategori"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-x-auto border-t-2 border-primary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Deskripsi</TableHead>
                <TableHead>Jumlah Buku</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate sm:table-cell">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>{category.book_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(category)}>
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
            <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <CategoryForm {...(editing ? { category: editing } : {})} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus kategori ini?"
        description={
          deleteTarget?.book_count
            ? `Kategori "${deleteTarget?.name}" masih digunakan oleh ${deleteTarget.book_count} buku. Buku terkait akan kehilangan kategorinya.`
            : `Kategori "${deleteTarget?.name}" akan dihapus permanen.`
        }
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
