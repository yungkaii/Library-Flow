import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BookCard } from "@/components/books/BookCard";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BookStatusBadge } from "@/components/shared/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { deleteBook, getBookById, listRelatedBooks } from "@/services/books.service";
import { getBookStatus, type BookWithRelations } from "@/types";
import { reserveBook } from "@/services/reservations.service";

export const Route = createFileRoute("/_authenticated/buku/$bookId/")({
  component: BookDetailPage,
});

function BookDetailPage() {
  const { bookId } = Route.useParams();
  const { isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookWithRelations | null>(null);
  const [related, setRelated] = useState<BookWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBookById(bookId)
      .then((result) => {
        if (!active) return;
        setBook(result);
        if (!result) return;
        void listRelatedBooks(result.category_id, result.id)
          .then((relatedBooks) => {
            if (active) setRelated(relatedBooks);
          })
          .catch(() => {
            if (active) setRelated([]);
          });
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat detail buku");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBook(bookId);
      toast.success("Buku berhasil dihapus");
      await navigate({ to: "/buku" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus buku");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleReserve = async () => {
    setReserving(true);
    try {
      await reserveBook(bookId);
      toast.success("Buku berhasil masuk antrean reservasi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat reservasi");
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Detail Buku">
        <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !book) {
    return (
      <AppShell title="Detail Buku">
        <Alert variant="destructive">
          <AlertTitle>Buku tidak ditemukan</AlertTitle>
          <AlertDescription>{error ?? "Buku yang Anda cari tidak tersedia."}</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  const status = getBookStatus(book);

  return (
    <AppShell
      title={book.title}
      {...(book.category?.name ? { description: book.category.name } : {})}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <aside>
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm bg-muted shadow-lg">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {isStaff && (
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/buku/$bookId/edit" params={{ bookId: book.id }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" size="icon" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </aside>

        <article className="border-t-2 border-primary pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <BookStatusBadge status={status} />
            {book.category && (
              <span className="text-xs text-muted-foreground">{book.category.name}</span>
            )}
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">{book.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {book.authors.map((a) => a.name).join(", ") || "Penulis tidak diketahui"}
            {book.publisher ? ` · ${book.publisher.name}` : ""}
          </p>

          {book.description && (
            <p className="mt-8 max-w-3xl font-display text-lg leading-8 text-foreground/85">{book.description}</p>
          )}

          <dl className="mt-8 grid grid-cols-2 border-y border-border text-sm sm:grid-cols-3">
            <div className="border-b border-border py-4 sm:border-r">
              <dt className="text-muted-foreground">ISBN</dt>
              <dd className="font-medium">{book.isbn || "-"}</dd>
            </div>
            <div className="border-b border-border px-4 py-4 sm:border-r">
              <dt className="text-muted-foreground">Tahun Terbit</dt>
              <dd className="font-medium">{book.publication_year ?? "-"}</dd>
            </div>
            <div className="border-b border-border py-4 pl-0 sm:pl-4">
              <dt className="text-muted-foreground">Bahasa</dt>
              <dd className="font-medium">{book.language || "-"}</dd>
            </div>
            <div className="py-4 sm:border-r">
              <dt className="text-muted-foreground">Jumlah Halaman</dt>
              <dd className="font-medium">{book.pages ?? "-"}</dd>
            </div>
            <div className="px-4 py-4 sm:border-r">
              <dt className="text-muted-foreground">Lokasi / Rak</dt>
              <dd className="font-medium">{book.shelf_location || "-"}</dd>
            </div>
            <div className="py-4 pl-0 sm:pl-4">
              <dt className="text-muted-foreground">Stok</dt>
              <dd className="font-medium">
                {book.available_copies}/{book.total_copies} tersedia
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            {status !== "tersedia" && !isStaff ? (
              <Button variant="secondary" onClick={handleReserve} disabled={reserving}>
                <CalendarClock className="mr-2 h-4 w-4" />
                {reserving ? "Memproses..." : "Reservasi Buku"}
              </Button>
            ) : isStaff ? (
              <Button asChild>
                <Link to="/peminjaman/baru">Buat Peminjaman</Link>
              </Button>
            ) : null}
          </div>

          <div className="mt-8 border-l-2 border-accent bg-accent/15 p-4 text-sm leading-6 text-muted-foreground">
            Antrean reservasi diproses berdasarkan waktu pendaftaran. Saat buku tersedia, reservasi
            terlama akan berubah menjadi siap diambil selama dua hari.
          </div>
        </article>
      </div>

      {related.length > 0 && (
        <section className="mt-14 border-t border-border pt-7">
          <p className="eyebrow text-muted-foreground">Dalam rak yang sama</p>
          <h2 className="mb-6 mt-2 font-display text-2xl font-bold">Buku Terkait</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => (
              <BookCard key={r.id} book={r} />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus buku ini?"
        description={`"${book.title}" akan dihapus secara permanen dari katalog.`}
        confirmLabel="Hapus"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
