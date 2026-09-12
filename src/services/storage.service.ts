import { supabase } from "@/lib/supabase";

const BOOK_COVERS_BUCKET = "book-covers";

/** Uploads a book cover image and returns its public URL. */
export async function uploadBookCover(bookId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${bookId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BOOK_COVERS_BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BOOK_COVERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
