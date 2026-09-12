import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function listCategoriesWithCount(): Promise<(Category & { book_count: number })[]> {
  const [{ data: categories, error: catError }, { data: books, error: bookError }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("books").select("category_id"),
  ]);
  if (catError) throw catError;
  if (bookError) throw bookError;

  const counts = new Map<string, number>();
  (books ?? []).forEach((row) => {
    const categoryId = (row as { category_id: string | null }).category_id;
    if (!categoryId) return;
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  });

  return ((categories ?? []) as Category[]).map((category) => ({
    ...category,
    book_count: counts.get(category.id) ?? 0,
  }));
}

export async function createCategory(values: { name: string; description: string | null }) {
  const { error } = await supabase.from("categories").insert(values);
  if (error) throw error;
}

export async function updateCategory(
  id: string,
  values: { name: string; description: string | null },
) {
  const { error } = await supabase.from("categories").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
