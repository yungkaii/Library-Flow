export type AppRole = "admin" | "petugas" | "anggota";

export interface Profile {
  id: string;
  full_name: string;
  member_code: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  petugas: "Petugas",
  anggota: "Anggota",
};

// ---------- Fase 2: Katalog & Manajemen Buku ----------

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Author {
  id: string;
  name: string;
  biography: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Publisher {
  id: string;
  name: string;
  address: string | null;
  website: string | null;
  contact: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string | null;
  description: string | null;
  category_id: string | null;
  publisher_id: string | null;
  publication_year: number | null;
  language: string | null;
  pages: number | null;
  shelf_location: string | null;
  total_copies: number;
  available_copies: number;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookWithRelations extends Book {
  category: Pick<Category, "id" | "name"> | null;
  publisher: Pick<Publisher, "id" | "name"> | null;
  authors: Pick<Author, "id" | "name">[];
}

export type BookStatus = "tersedia" | "dipinjam" | "tidak_tersedia";

export type BorrowingStatus = "active" | "returned";

export interface Borrowing {
  id: string;
  user_id: string;
  book_id: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  status: BorrowingStatus;
  fine_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ReservationStatus = "waiting" | "ready" | "completed" | "cancelled" | "expired";

export interface Reservation {
  id: string;
  user_id: string;
  book_id: string;
  status: ReservationStatus;
  reserved_at: string;
  ready_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type FineStatus = "unpaid" | "paid" | "waived";

export interface Fine {
  id: string;
  borrowing_id: string;
  user_id: string;
  amount: number;
  status: FineStatus;
  paid_at: string | null;
  waived_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  "borrowed" | "returned" | "due_soon" | "overdue" | "reservation_ready" | "fine_created";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  dedupe_key: string | null;
  read_at: string | null;
  created_at: string;
}

export interface LibrarySettings {
  id: boolean;
  library_name: string;
  address: string;
  phone: string;
  email: string;
  max_active_borrowings: number;
  loan_duration_days: number;
  fine_per_day: number;
  max_active_reservations: number;
  default_theme: "light" | "dark" | "system";
  compact_mode: boolean;
  updated_at: string;
  updated_by: string | null;
}

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  tersedia: "Tersedia",
  dipinjam: "Sedang Dipinjam",
  tidak_tersedia: "Tidak Tersedia",
};

export function getBookStatus(book: Pick<Book, "available_copies" | "total_copies">): BookStatus {
  if (book.total_copies <= 0) return "tidak_tersedia";
  if (book.available_copies <= 0) return "dipinjam";
  return "tersedia";
}
