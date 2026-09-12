import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Library, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations";
import { updatePassword } from "@/services/auth.service";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Atur Ulang Kata Sandi — Perpustakaan" },
      {
        name: "description",
        content: "Buat kata sandi baru untuk akun perpustakaan Anda.",
      },
      { property: "og:title", content: "Atur Ulang Kata Sandi — Perpustakaan" },
      { property: "og:description", content: "Buat kata sandi baru untuk akun Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await updatePassword(values.password);
      toast.success("Kata sandi berhasil diperbarui");
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui kata sandi");
    }
  };

  return (
    <div className="grid min-h-screen overflow-x-hidden bg-background lg:grid-cols-[minmax(0,.8fr)_minmax(28rem,.55fr)]">
      <aside className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <span className="flex items-center gap-3 font-display text-sm font-bold"><span className="grid h-9 w-9 place-items-center rounded-sm bg-accent text-accent-foreground"><Library className="h-5 w-5" /></span>LIBRARY FLOW</span>
        <div><p className="eyebrow text-primary-foreground">Keamanan akun</p><p className="mt-5 max-w-md font-display text-5xl font-bold leading-tight">Kembali ke koleksi Anda dengan aman.</p></div>
      </aside>
      <main className="flex items-center px-5 py-24 sm:px-12">
      <div className="mx-auto w-full max-w-md border-t-2 border-primary pt-7">
        <p className="eyebrow text-muted-foreground">Pemulihan akses</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Atur Ulang Kata Sandi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buka halaman ini dari tautan yang dikirim ke email Anda, lalu buat kata sandi baru.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi Baru</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ulangi Kata Sandi</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Kata Sandi
            </Button>
          </form>
        </Form>
      </div></main>
    </div>
  );
}
