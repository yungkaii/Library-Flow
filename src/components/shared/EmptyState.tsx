import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="relative flex min-h-72 flex-col items-center justify-center gap-4 overflow-hidden border-y border-border py-16 text-center">
      <span className="absolute left-[12%] top-8 font-display text-8xl text-primary/5" aria-hidden="true">Ø</span>
      <span className="flex h-14 w-14 rotate-3 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-elevated motion-safe:animate-[page-enter_500ms_ease_both]">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </span>
      <div>
        <p className="font-display text-xl font-bold">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
