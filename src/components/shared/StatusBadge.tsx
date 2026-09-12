import { Badge } from "@/components/ui/badge";
import { BOOK_STATUS_LABEL, type BookStatus } from "@/types";

const STATUS_VARIANT: Record<BookStatus, "default" | "secondary" | "destructive"> = {
  tersedia: "default",
  dipinjam: "secondary",
  tidak_tersedia: "destructive",
};

export function BookStatusBadge({ status }: { status: BookStatus }) {
  return <Badge variant={STATUS_VARIANT[status]} className="w-fit rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{BOOK_STATUS_LABEL[status]}</Badge>;
}
