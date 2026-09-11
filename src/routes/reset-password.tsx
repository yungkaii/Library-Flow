import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4">
      <div className="card-surface w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">Atur Ulang Kata Sandi</h1>
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
      </div>
    </div>
  );
}
