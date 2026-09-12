import { supabase } from "@/lib/supabase";
import type { Author } from "@/types";

export async function listAuthors(): Promise<Author[]> {
  const { data, error } = await supabase.from("authors").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Author[];
}

export async function listAuthorsWithCount(): Promise<(Author & { book_count: number })[]> {
  const [{ data: authors, error: authorError }, { data: links, error: linkError }] = await Promise.all([
    supabase.from("authors").select("*").order("name"),
    supabase.from("book_authors").select("author_id"),
  ]);
  if (authorError) throw authorError;
  if (linkError) throw linkError;

  const counts = new Map<string, number>();
  (links ?? []).forEach((row) => {
    const authorId = (row as { author_id: string }).author_id;
    counts.set(authorId, (counts.get(authorId) ?? 0) + 1);
  });

  return ((authors ?? []) as Author[]).map((author) => ({
    ...author,
    book_count: counts.get(author.id) ?? 0,
  }));
}

export async function createAuthor(values: { name: string; biography: string | null }) {
  const { error } = await supabase.from("authors").insert(values);
  if (error) throw error;
}

export async function updateAuthor(id: string, values: { name: string; biography: string | null }) {
  const { error } = await supabase.from("authors").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteAuthor(id: string) {
  const { error } = await supabase.from("authors").delete().eq("id", id);
  if (error) throw error;
}
