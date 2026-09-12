import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BookForm } from "@/components/forms/BookForm";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listAuthors } from "@/services/authors.service";
import { createBook } from "@/services/books.service";
import { listCategories } from "@/services/categories.service";
import { listPublishers } from "@/services/publishers.service";
import type { BookValues } from "@/lib/validations";
import type { Author, Category, Publisher } from "@/types";

export const Route = createFileRoute("/_authenticated/buku/baru")({
  component: NewBookPage,
  errorComponent: AddBookError,
});

function AddBookError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell title="Tambah Buku">
      <Alert variant="destructive">
        <AlertTitle>Halaman tambah buku gagal dimuat</AlertTitle>
        <AlertDescription>
          {error.message || "Terjadi kesalahan saat membuka form."}
        </AlertDescription>
      </Alert>
      <Button className="mt-4" onClick={reset}>
        Coba lagi
      </Button>
    </AppShell>
  );
}

function NewBookPage() {
  const { isStaff, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listCategories(), listPublishers(), listAuthors()])
      .then(([c, p, a]) => {
        setCategories(c);
        setPublishers(p);
        setAuthors(a);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Gagal memuat data referensi";
        setReferenceError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!authLoading && !isStaff) {
    return <Navigate to="/buku" replace />;
  }

  const handleSubmit = async (values: BookValues, coverFile: File | null) => {
    const id = await createBook(
      {
        title: values.title,
        isbn: values.isbn || null,
        description: values.description || null,
        categoryId: values.categoryId,
        publisherId: values.publisherId,
        publicationYear: values.publicationYear,
        language: values.language,
        pages: values.pages,
        shelfLocation: values.shelfLocation || null,
        totalCopies: values.totalCopies,
      },
      values.authorIds,
      coverFile,
    );
    toast.success("Buku berhasil ditambahkan");
    await navigate({ to: "/buku/$bookId", params: { bookId: id } });
  };

  return (
    <AppShell title="Tambah Buku" description="Lengkapi data buku untuk menambahkannya ke katalog.">
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat data referensi...</p>
      ) : referenceError ? (
        <Alert variant="destructive">
          <AlertTitle>Data referensi belum dapat dimuat</AlertTitle>
          <AlertDescription>
            {referenceError}. Pastikan migration katalog dan RLS tabel kategori, penerbit, serta
            penulis sudah dijalankan di Supabase.
          </AlertDescription>
        </Alert>
      ) : (
        <section className="border-t-2 border-primary pt-7"><BookForm
          categories={categories}
          publishers={publishers}
          authors={authors}
          onSubmit={handleSubmit}
          submitLabel="Tambah Buku"
        /></section>
      )}
    </AppShell>
  );
}
