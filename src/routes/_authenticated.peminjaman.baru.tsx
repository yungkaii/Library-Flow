import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { BookOpen, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { listMembers } from "@/services/members.service";
import { listBooks } from "@/services/books.service";
import { createBorrowing } from "@/services/borrowings.service";
import type { MemberListItem } from "@/services/members.service";
import type { BookWithRelations } from "@/types";

export const Route = createFileRoute("/_authenticated/peminjaman/baru")({
  component: NewBorrowingPage,
});

function NewBorrowingPage() {
  const { isStaff, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [books, setBooks] = useState<BookWithRelations[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [dueDays, setDueDays] = useState("14");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isStaff) return;
    setLoading(true);
    Promise.all([listMembers(), listBooks({ page: 1, pageSize: 100 })])
      .then(([memberData, bookData]) => {
        setMembers(memberData.filter((member) => member.is_active));
        setBooks(bookData.data.filter((book) => book.available_copies > 0));
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Gagal memuat data peminjaman");
      })
      .finally(() => setLoading(false));
  }, [isStaff]);

  const filteredMembers = useMemo(() => {
    const term = memberQuery.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) => {
      const haystack = [member.full_name, member.member_code, member.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [memberQuery, members]);

  const filteredBooks = useMemo(() => {
    const term = bookQuery.trim().toLowerCase();
    if (!term) return books;
    return books.filter((book) => {
      const haystack = [
        book.title,
        book.isbn,
        book.category?.name,
        book.publisher?.name,
        book.authors.map((author) => author.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [bookQuery, books]);

  if (!authLoading && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBorrow = async () => {
    if (!selectedUserId || !selectedBookId) {
      toast.error("Pilih anggota dan buku terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      await createBorrowing(selectedUserId, selectedBookId, Number(dueDays) || 14);
      toast.success("Peminjaman berhasil dibuat");
      await navigate({ to: "/peminjaman/aktif" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat peminjaman");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Peminjaman Baru"
      description="Catat peminjaman buku untuk anggota yang valid dan aktif."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat data anggota dan buku...</p>
      ) : (
        <div className="grid border-y border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
          <section className="py-6 lg:pr-7">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Pilih Anggota</h2>
            </div>
            <Input
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Cari nama, kode, atau nomor telepon"
              className="mb-4"
            />
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      className={selectedUserId === member.id ? "bg-muted/50" : undefined}
                    >
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start p-0 text-left font-normal"
                          onClick={() => setSelectedUserId(member.id)}
                        >
                          {member.full_name}
                        </Button>
                      </TableCell>
                      <TableCell>{member.member_code || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="py-6 lg:pl-7">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Pilih Buku</h2>
            </div>
            <Input
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
              placeholder="Cari judul, ISBN, atau penulis"
              className="mb-4"
            />
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Stok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow
                      key={book.id}
                      className={selectedBookId === book.id ? "bg-muted/50" : undefined}
                    >
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start p-0 text-left font-normal"
                          onClick={() => setSelectedBookId(book.id)}
                        >
                          {book.title}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {book.available_copies}/{book.total_copies}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      )}

      <aside className="mt-7 bg-primary p-6 text-primary-foreground">
        <p className="eyebrow mb-5 text-primary-foreground">Ringkasan transaksi</p>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="text-sm text-primary-foreground/80">Anggota terpilih</p>
            <p className="mt-1 font-medium">
              {members.find((m) => m.id === selectedUserId)?.full_name || "Belum dipilih"}
            </p>
          </div>
          <div>
            <label className="text-sm text-primary-foreground/80">Durasi peminjaman</label>
            <Select value={dueDays} onValueChange={setDueDays}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pilih lama pinjam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 hari</SelectItem>
                <SelectItem value="14">14 hari</SelectItem>
                <SelectItem value="21">21 hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-primary-foreground/80">
            Buku terpilih:{" "}
            {books.find((book) => book.id === selectedBookId)?.title || "Belum dipilih"}
          </p>
          <Button
            onClick={handleBorrow}
            disabled={!selectedUserId || !selectedBookId || submitting}
          >
            {submitting ? "Memproses..." : "Buat Peminjaman"}
          </Button>
        </div>
      </aside>
    </AppShell>
  );
}
