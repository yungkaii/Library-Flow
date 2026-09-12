import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AppRole, Profile } from "@/types";

const baseMemberSchema = z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Nomor telepon hanya boleh angka")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  role: z.enum(["admin", "petugas", "anggota"]),
  isActive: z.boolean(),
});

export const createMemberSchema = baseMemberSchema.extend({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi kata sandi tidak cocok",
  path: ["confirmPassword"],
});

export const updateMemberSchema = baseMemberSchema.extend({
  email: z.string().trim().email("Format email tidak valid").max(255).optional().or(z.literal("")),
});

export type CreateMemberValues = z.infer<typeof createMemberSchema>;
export type UpdateMemberValues = z.infer<typeof updateMemberSchema>;

export function MemberForm({
  mode,
  member,
  allowedRoles,
  onSubmit,
}: {
  mode: "create" | "edit";
  member?: Pick<Profile, "full_name" | "phone" | "address" | "is_active"> & { roles?: AppRole[] };
  allowedRoles: AppRole[];
  onSubmit: (values: CreateMemberValues | UpdateMemberValues) => Promise<void>;
}) {
  const schema = mode === "create" ? createMemberSchema : updateMemberSchema;

  const form = useForm<CreateMemberValues | UpdateMemberValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: member?.full_name ?? "",
      email: "",
      phone: member?.phone ?? "",
      address: member?.address ?? "",
      role: (member?.roles?.[0] ?? "anggota") as AppRole,
      isActive: member?.is_active ?? true,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    form.reset({
      fullName: member?.full_name ?? "",
      email: "",
      phone: member?.phone ?? "",
      address: member?.address ?? "",
      role: (member?.roles?.[0] ?? "anggota") as AppRole,
      isActive: member?.is_active ?? true,
      password: "",
      confirmPassword: "",
    });
  }, [form, member, mode]);

  const handleSubmit = async (values: CreateMemberValues | UpdateMemberValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === "create" && (
          <>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
                  <FormLabel>Konfirmasi Kata Sandi</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input inputMode="tel" {...field} />
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

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peran</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allowedRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === "admin" ? "Admin" : role === "petugas" ? "Petugas" : "Anggota"}
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Status akun</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Tambah Anggota" : "Simpan Perubahan"}
        </Button>
      </form>
    </Form>
  );
}
