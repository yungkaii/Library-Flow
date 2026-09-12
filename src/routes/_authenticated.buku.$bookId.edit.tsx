import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BookForm } from "@/components/forms/BookForm";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { listAuthors } from "@/services/authors.service";
import { getBookById, updateBook } from "@/services/books.service";
import { listCategories } from "@/services/categories.service";
import { listPublishers } from "@/services/publishers.service";
import type { BookValues } from "@/lib/validations";
import type { Author, BookWithRelations, Category, Publisher } from "@/types";

export const Route = createFileRoute("/_authenticated/buku/$bookId/edit")({
  component: EditBookPage,
});

function EditBookPage() {
  const { bookId } = Route.useParams();
  const { isStaff, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookWithRelations | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getBookById(bookId), listCategories(), listPublishers(), listAuthors()])
      .then(([b, c, p, a]) => {
        setBook(b);
        setCategories(c);
        setPublishers(p);
        setAuthors(a);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat data buku"))
      .finally(() => setLoading(false));
  }, [bookId]);

  if (!authLoading && !isStaff) {
    return <Navigate to="/buku" replace />;
  }

  const handleSubmit = async (values: BookValues, coverFile: File | null) => {
    await updateBook(
      bookId,
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
    toast.success("Perubahan buku disimpan");
    await navigate({ to: "/buku/$bookId", params: { bookId } });
  };

  return (
    <AppShell title="Edit Buku" description="Perbarui data buku pada katalog.">
      {loading && <p className="text-sm text-muted-foreground">Memuat data buku...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && book && (
        <section className="border-t-2 border-primary pt-7"><BookForm
          book={book}
          categories={categories}
          publishers={publishers}
          authors={authors}
          onSubmit={handleSubmit}
          submitLabel="Simpan Perubahan"
        /></section>
      )}
    </AppShell>
  );
}
