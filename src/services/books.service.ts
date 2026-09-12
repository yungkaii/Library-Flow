import { supabase } from "@/lib/supabase";
import { uploadBookCover as uploadCoverFile } from "@/services/storage.service";
import type { Author, BookStatus, BookWithRelations, Category, Publisher } from "@/types";

export type BookSort = "newest" | "title_asc" | "title_desc" | "year_desc" | "year_asc";

export interface ListBooksParams {
  search?: string;
  categoryId?: string;
  year?: number;
  status?: BookStatus;
  sort?: BookSort;
  page?: number;
  pageSize?: number;
}

export interface ListBooksResult {
  data: BookWithRelations[];
  count: number;
}

interface BookAuthorRow {
  author: Pick<Author, "id" | "name"> | null;
}

interface BookRow {
  id: string;
  title: string;
  isbn: string | null;
  description: string | null;
  category_id: string | null;
  publisher_id: string | null;
  publication_year: number | null;
  language: string | null;
  pages: number | null;
  shelf_location: string | null;
  total_copies: number;
  available_copies: number;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  category: Pick<Category, "id" | "name"> | null;
  publisher: Pick<Publisher, "id" | "name"> | null;
  book_authors: BookAuthorRow[] | null;
}

const SELECT_WITH_RELATIONS =
  "*, category:categories(id,name), publisher:publishers(id,name), book_authors(author:authors(id,name))";

function mapBookRow(row: BookRow): BookWithRelations {
  return {
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    description: row.description,
    category_id: row.category_id,
    publisher_id: row.publisher_id,
    publication_year: row.publication_year,
    language: row.language,
    pages: row.pages,
    shelf_location: row.shelf_location,
    total_copies: row.total_copies,
    available_copies: row.available_copies,
    cover_url: row.cover_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category,
    publisher: row.publisher,
    authors: (row.book_authors ?? []).map((entry) => entry.author).filter((a): a is Author => Boolean(a)),
  };
}

const SORT_MAP: Record<BookSort, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  title_asc: { column: "title", ascending: true },
  title_desc: { column: "title", ascending: false },
  year_desc: { column: "publication_year", ascending: false },
  year_asc: { column: "publication_year", ascending: true },
};

export async function listBooks(params: ListBooksParams = {}): Promise<ListBooksResult> {
  const { search, categoryId, year, status, sort = "newest", page = 1, pageSize = 12 } = params;

  let query = supabase.from("books").select(SELECT_WITH_RELATIONS, { count: "exact" });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (year) query = query.eq("publication_year", year);
  if (status === "tersedia") query = query.gt("available_copies", 0);
  if (status === "dipinjam") query = query.eq("available_copies", 0).gt("total_copies", 0);
  if (status === "tidak_tersedia") query = query.eq("total_copies", 0);

  const term = search?.trim();
  if (term) {
    const orParts = [`title.ilike.%${term}%`, `isbn.ilike.%${term}%`];

    const [{ data: authorMatches }, { data: publisherMatches }] = await Promise.all([
      supabase.from("authors").select("id").ilike("name", `%${term}%`),
      supabase.from("publishers").select("id").ilike("name", `%${term}%`),
    ]);

    if (publisherMatches?.length) {
      orParts.push(`publisher_id.in.(${publisherMatches.map((p) => p.id).join(",")})`);
    }

    if (authorMatches?.length) {
      const { data: bookAuthorRows } = await supabase
        .from("book_authors")
        .select("book_id")
        .in(
          "author_id",
          authorMatches.map((a) => a.id),
        );
      if (bookAuthorRows?.length) {
        orParts.push(`id.in.(${bookAuthorRows.map((r) => r.book_id).join(",")})`);
      }
    }

    query = query.or(orParts.join(","));
  }

  const { column, ascending } = SORT_MAP[sort];
  query = query.order(column, { ascending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: ((data ?? []) as unknown as BookRow[]).map(mapBookRow), count: count ?? 0 };
}

export async function getBookById(id: string): Promise<BookWithRelations | null> {
  const { data, error } = await supabase
    .from("books")
    .select(SELECT_WITH_RELATIONS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBookRow(data as unknown as BookRow) : null;
}

export async function listRelatedBooks(
  categoryId: string | null,
  excludeBookId: string,
): Promise<BookWithRelations[]> {
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from("books")
    .select(SELECT_WITH_RELATIONS)
    .eq("category_id", categoryId)
    .neq("id", excludeBookId)
    .limit(4);
  if (error) throw error;
  return ((data ?? []) as unknown as BookRow[]).map(mapBookRow);
}

export interface BookPayload {
  title: string;
  isbn: string | null;
  description: string | null;
  categoryId: string;
  publisherId: string;
  publicationYear: number;
  language: string;
  pages: number;
  shelfLocation: string | null;
  totalCopies: number;
}

function toRow(payload: BookPayload) {
  return {
    title: payload.title,
    isbn: payload.isbn,
    description: payload.description,
    category_id: payload.categoryId,
    publisher_id: payload.publisherId,
    publication_year: payload.publicationYear,
    language: payload.language,
    pages: payload.pages,
    shelf_location: payload.shelfLocation,
  };
}

async function syncBookAuthors(bookId: string, authorIds: string[]) {
  const { error: deleteError } = await supabase.from("book_authors").delete().eq("book_id", bookId);
  if (deleteError) throw deleteError;
  if (authorIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("book_authors")
    .insert(authorIds.map((authorId) => ({ book_id: bookId, author_id: authorId })));
  if (insertError) throw insertError;
}

export async function createBook(
  payload: BookPayload,
  authorIds: string[],
  coverFile?: File | null,
): Promise<string> {
  const { data, error } = await supabase
    .from("books")
    .insert({
      ...toRow(payload),
      total_copies: payload.totalCopies,
      available_copies: payload.totalCopies,
    })
    .select("id")
    .single();
  if (error) throw error;

  const bookId = data.id as string;
  await syncBookAuthors(bookId, authorIds);

  if (coverFile) {
    const coverUrl = await uploadCoverFile(bookId, coverFile);
    const { error: coverError } = await supabase
      .from("books")
      .update({ cover_url: coverUrl })
      .eq("id", bookId);
    if (coverError) throw coverError;
  }

  return bookId;
}

export async function updateBook(
  id: string,
  payload: BookPayload,
  authorIds: string[],
  coverFile?: File | null,
) {
  const { data: existing, error: fetchError } = await supabase
    .from("books")
    .select("total_copies, available_copies, cover_url")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const delta = payload.totalCopies - existing.total_copies;
  const nextAvailable = Math.min(payload.totalCopies, Math.max(0, existing.available_copies + delta));

  let coverUrl = existing.cover_url as string | null;
  if (coverFile) {
    coverUrl = await uploadCoverFile(id, coverFile);
  }

  const { error } = await supabase
    .from("books")
    .update({
      ...toRow(payload),
      total_copies: payload.totalCopies,
      available_copies: nextAvailable,
      cover_url: coverUrl,
    })
    .eq("id", id);
  if (error) throw error;

  await syncBookAuthors(id, authorIds);
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}
