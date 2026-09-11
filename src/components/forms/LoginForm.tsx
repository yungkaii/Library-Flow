import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { loginSchema, type LoginValues } from "@/lib/validations";
import { requestPasswordReset, signIn } from "@/services/auth.service";

export function LoginForm() {
  const navigate = useNavigate();
  const [sendingReset, setSendingReset] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await signIn(values.email, values.password);
      toast.success("Selamat datang kembali");
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email atau kata sandi salah");
    }
  };

  const onForgotPassword = async () => {
    const email = form.getValues("email").trim();
    if (!email) {
      form.setError("email", { message: "Isi email dulu untuk atur ulang kata sandi" });
      return;
    }
    setSendingReset(true);
    try {
      await requestPasswordReset(email);
      toast.success("Tautan atur ulang kata sandi dikirim ke email Anda");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim tautan");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="nama@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata Sandi</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Masuk
        </Button>

        <Button
          type="button"
          variant="link"
          className="w-full"
          onClick={onForgotPassword}
          disabled={sendingReset}
        >
          {sendingReset ? "Mengirim tautan..." : "Lupa kata sandi?"}
        </Button>
      </form>
    </Form>
  );
}
