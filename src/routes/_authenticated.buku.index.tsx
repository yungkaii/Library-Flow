import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { BookCard } from "@/components/books/BookCard";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { listBooks, type BookSort } from "@/services/books.service";
import { listCategories } from "@/services/categories.service";
import type { BookStatus, BookWithRelations, Category } from "@/types";

export const Route = createFileRoute("/_authenticated/buku/")({
  component: BookCatalogPage,
});

const PAGE_SIZE = 12;

function BookCatalogPage() {
  const { isStaff } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<BookSort>("newest");
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<BookWithRelations[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, status, sort]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listBooks({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(categoryId !== "all" ? { categoryId } : {}),
      ...(status !== "all" ? { status: status as BookStatus } : {}),
      sort,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (!active) return;
        setBooks(result.data);
        setCount(result.count);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat katalog buku");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, categoryId, status, sort, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <AppShell title="Katalog Buku" description="Cari dan jelajahi koleksi buku perpustakaan.">
      <section className="mb-8 grid gap-6 border-y border-border py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow text-muted-foreground">Temukan bacaan berikutnya</p>
          <div className="relative mt-3 w-full max-w-2xl">
          <Search className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, ISBN, penulis, atau penerbit..."
            className="h-12 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-base shadow-none focus-visible:ring-0"
          />
          </div>
        </div>
        {isStaff && (
          <Button asChild>
            <Link to="/buku/baru">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Buku
            </Link>
          </Button>
        )}
      </section>

      <div className="mb-7 grid grid-cols-1 gap-3 pb-2 sm:flex sm:snap-x sm:overflow-x-auto">
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="tersedia">Tersedia</SelectItem>
            <SelectItem value="dipinjam">Sedang Dipinjam</SelectItem>
            <SelectItem value="tidak_tersedia">Tidak Tersedia</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as BookSort)}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Terbaru</SelectItem>
            <SelectItem value="title_asc">Judul A-Z</SelectItem>
            <SelectItem value="title_desc">Judul Z-A</SelectItem>
            <SelectItem value="year_desc">Tahun Terbaru</SelectItem>
            <SelectItem value="year_asc">Tahun Terlama</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow text-muted-foreground">Katalog pilihan</p><h1 className="mt-1 font-display text-3xl font-bold">{count.toLocaleString("id-ID")} buku</h1></div><p className="hidden text-xs text-muted-foreground sm:block">Halaman {page} dari {totalPages}</p></div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada buku ditemukan"
          description="Coba ubah kata kunci pencarian atau filter yang digunakan."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((book, index) => (
              <ScrollReveal key={book.id} delay={(index % 5) * 40}>
                <BookCard book={book} />
              </ScrollReveal>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </AppShell>
  );
}
