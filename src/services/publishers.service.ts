import { supabase } from "@/lib/supabase";
import type { Publisher } from "@/types";

export async function listPublishers(): Promise<Publisher[]> {
  const { data, error } = await supabase.from("publishers").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Publisher[];
}

export async function listPublishersWithCount(): Promise<(Publisher & { book_count: number })[]> {
  const [{ data: publishers, error: pubError }, { data: books, error: bookError }] = await Promise.all([
    supabase.from("publishers").select("*").order("name"),
    supabase.from("books").select("publisher_id"),
  ]);
  if (pubError) throw pubError;
  if (bookError) throw bookError;

  const counts = new Map<string, number>();
  (books ?? []).forEach((row) => {
    const publisherId = (row as { publisher_id: string | null }).publisher_id;
    if (!publisherId) return;
    counts.set(publisherId, (counts.get(publisherId) ?? 0) + 1);
  });

  return ((publishers ?? []) as Publisher[]).map((publisher) => ({
    ...publisher,
    book_count: counts.get(publisher.id) ?? 0,
  }));
}

export async function createPublisher(values: {
  name: string;
  address: string | null;
  website: string | null;
  contact: string | null;
}) {
  const { error } = await supabase.from("publishers").insert(values);
  if (error) throw error;
}

export async function updatePublisher(
  id: string,
  values: { name: string; address: string | null; website: string | null; contact: string | null },
) {
  const { error } = await supabase.from("publishers").update(values).eq("id", id);
  if (error) throw error;
}

export async function deletePublisher(id: string) {
  const { error } = await supabase.from("publishers").delete().eq("id", id);
  if (error) throw error;
}
