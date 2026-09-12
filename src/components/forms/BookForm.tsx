import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookSchema, type BookValues } from "@/lib/validations";
import type { Author, BookWithRelations, Category, Publisher } from "@/types";

interface BookFormProps {
  book?: BookWithRelations;
  categories: Category[];
  publishers: Publisher[];
  authors: Author[];
  onSubmit: (values: BookValues, coverFile: File | null) => Promise<void>;
  submitLabel?: string;
}

export function BookForm({
  book,
  categories,
  publishers,
  authors,
  onSubmit,
  submitLabel = "Simpan Buku",
}: BookFormProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(book?.cover_url ?? null);

  const form = useForm<BookValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: book?.title ?? "",
      isbn: book?.isbn ?? "",
      description: book?.description ?? "",
      categoryId: book?.category_id ?? "",
      publisherId: book?.publisher_id ?? "",
      authorIds: book?.authors.map((a) => a.id) ?? [],
      publicationYear: book?.publication_year ?? new Date().getFullYear(),
      language: book?.language ?? "Indonesia",
      pages: book?.pages ?? 1,
      shelfLocation: book?.shelf_location ?? "",
      totalCopies: book?.total_copies ?? 1,
    },
  });

  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const handleSubmit = async (values: BookValues) => {
    try {
      await onSubmit(values, coverFile);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan buku");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="book-cover">Cover Buku</Label>
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview cover" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <Input
              id="book-cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Buku</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publicationYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Terbit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Sinopsis</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="publisherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Penerbit</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih penerbit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {publishers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="authorIds"
          render={() => (
            <FormItem>
              <FormLabel>Penulis</FormLabel>
              <ScrollArea className="h-40 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  {authors.map((author) => (
                    <FormField
                      key={author.id}
                      control={form.control}
                      name="authorIds"
                      render={({ field }) => {
                        const checked = field.value?.includes(author.id);
                        return (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const next = value
                                    ? [...(field.value ?? []), author.id]
                                    : (field.value ?? []).filter((id) => id !== author.id);
                                  field.onChange(next);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-sm font-normal">
                              {author.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  {authors.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Belum ada data penulis. Tambahkan penulis terlebih dahulu di menu Penulis.
                    </p>
                  )}
                </div>
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bahasa</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Halaman</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shelfLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasi / Rak</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="totalCopies"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Jumlah Eksemplar</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
