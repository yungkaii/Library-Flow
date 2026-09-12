import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { BookStatusBadge } from "@/components/shared/StatusBadge";
import { getBookStatus, type BookWithRelations } from "@/types";

export function BookCard({ book }: { book: BookWithRelations }) {
  const status = getBookStatus(book);

  return (
    <Link
      to="/buku/$bookId"
      params={{ bookId: book.id }}
      className="group flex cursor-pointer flex-col overflow-hidden border-b border-border pb-4 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm bg-muted shadow-card transition-shadow duration-300 group-hover:shadow-elevated">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
            loading="lazy"
          />
        ) : (
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex items-center justify-between gap-2"><BookStatusBadge status={status} /><span className="text-[10px] text-muted-foreground">{book.publication_year || "—"}</span></div>
        <h3 className="line-clamp-2 font-display text-base font-bold leading-snug">{book.title}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.authors.map((a) => a.name).join(", ") || "Penulis tidak diketahui"}
        </p>
        <p className="mt-auto text-xs text-muted-foreground">
          {book.available_copies}/{book.total_copies} tersedia
        </p>
      </div>
    </Link>
  );
}
