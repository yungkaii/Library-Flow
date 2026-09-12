import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/hooks/useTheme";
import { settingsSchema, type SettingsValues } from "@/lib/validations";
import { updateLibrarySettings } from "@/services/settings.service";
import type { LibrarySettings } from "@/types";

function toFormValues(settings: LibrarySettings): SettingsValues {
  return {
    libraryName: settings.library_name,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    maxActiveBorrowings: settings.max_active_borrowings,
    loanDurationDays: settings.loan_duration_days,
    finePerDay: settings.fine_per_day,
    maxActiveReservations: settings.max_active_reservations,
    defaultTheme: settings.default_theme,
    compactMode: settings.compact_mode,
  };
}

export function SettingsForm({
  settings,
  onSaved,
}: {
  settings: LibrarySettings;
  onSaved: (next: LibrarySettings) => void;
}) {
  const { setPreference } = useTheme();
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  });

  useEffect(() => {
    form.reset(toFormValues(settings));
  }, [form, settings]);

  const onSubmit = async (values: SettingsValues) => {
    try {
      const next = await updateLibrarySettings({
        library_name: values.libraryName,
        address: values.address,
        phone: values.phone,
        email: values.email,
        max_active_borrowings: values.maxActiveBorrowings,
        loan_duration_days: values.loanDurationDays,
        fine_per_day: values.finePerDay,
        max_active_reservations: values.maxActiveReservations,
        default_theme: values.defaultTheme,
        compact_mode: values.compactMode,
      });
      setPreference(values.defaultTheme);
      onSaved(next);
      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Identitas perpustakaan</h2>
            <p className="text-sm text-muted-foreground">
              Informasi yang digunakan pada operasional perpustakaan.
            </p>
          </div>
          <FormField
            control={form.control}
            name="libraryName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama perpustakaan</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telepon</FormLabel>
                  <FormControl>
                    <Input inputMode="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Aturan peminjaman</h2>
            <p className="text-sm text-muted-foreground">
              Nilai ini menjadi acuan operasional berikutnya.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxActiveBorrowings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maks. peminjaman aktif</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={50} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loanDurationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lama pinjam (hari)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={365} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finePerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denda per hari (Rp)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxActiveReservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maks. reservasi aktif</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={20} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Preferensi tampilan</h2>
            <p className="text-sm text-muted-foreground">
              Preferensi default untuk pengalaman pengguna perpustakaan.
            </p>
          </div>
          <FormField
            control={form.control}
            name="defaultTheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tema default</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="system">Ikuti perangkat</SelectItem>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="compactMode"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Mode ringkas</FormLabel>
                  <FormDescription>
                    Gunakan jarak antar elemen yang lebih padat pada tabel dan panel.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </section>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
          Pengaturan
        </Button>
      </form>
    </Form>
  );
}
