import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
  password: z.string().min(6, "Kata sandi minimal 6 karakter").max(72),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
    email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[0-9+\-\s]*$/, "Nomor telepon hanya boleh angka")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Nomor telepon hanya boleh angka")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;

// ---------- Fase 2: Katalog & Manajemen Buku ----------

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CategoryValues = z.infer<typeof categorySchema>;

export const authorSchema = z.object({
  name: z.string().trim().min(2, "Nama penulis minimal 2 karakter").max(150),
  biography: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type AuthorValues = z.infer<typeof authorSchema>;

export const publisherSchema = z.object({
  name: z.string().trim().min(2, "Nama penerbit minimal 2 karakter").max(150),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(255)
    .refine(
      (value) => value === "" || /^https?:\/\/.+/.test(value),
      "URL harus diawali http:// atau https://",
    )
    .optional()
    .or(z.literal("")),
  contact: z.string().trim().max(100).optional().or(z.literal("")),
});
export type PublisherValues = z.infer<typeof publisherSchema>;

const currentYear = new Date().getFullYear();

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(255),
  isbn: z.string().trim().max(32).optional().or(z.literal("")),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Pilih kategori"),
  publisherId: z.string().min(1, "Pilih penerbit"),
  authorIds: z.array(z.string()).min(1, "Pilih minimal satu penulis"),
  publicationYear: z.coerce
    .number({ invalid_type_error: "Tahun wajib diisi" })
    .int()
    .min(1400, "Tahun tidak valid")
    .max(currentYear, "Tahun tidak boleh di masa depan"),
  language: z.string().trim().min(1, "Bahasa wajib diisi").max(50),
  pages: z.coerce
    .number({ invalid_type_error: "Jumlah halaman wajib diisi" })
    .int()
    .min(1, "Minimal 1 halaman"),
  shelfLocation: z.string().trim().max(50).optional().or(z.literal("")),
  totalCopies: z.coerce
    .number({ invalid_type_error: "Jumlah eksemplar wajib diisi" })
    .int()
    .min(1, "Minimal 1 eksemplar"),
});
export type BookValues = z.infer<typeof bookSchema>;

export const settingsSchema = z.object({
  libraryName: z.string().trim().min(2, "Nama perpustakaan minimal 2 karakter").max(150),
  address: z.string().trim().max(255),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, "Nomor telepon tidak valid"),
  email: z.string().trim().email("Format email tidak valid").max(255).or(z.literal("")),
  maxActiveBorrowings: z.coerce.number().int().min(1).max(50),
  loanDurationDays: z.coerce.number().int().min(1).max(365),
  finePerDay: z.coerce.number().min(0).max(100000000),
  maxActiveReservations: z.coerce.number().int().min(1).max(20),
  defaultTheme: z.enum(["light", "dark", "system"]),
  compactMode: z.boolean(),
});
export type SettingsValues = z.infer<typeof settingsSchema>;
