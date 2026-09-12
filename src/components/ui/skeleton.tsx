import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-sm bg-[linear-gradient(90deg,var(--muted),color-mix(in_oklab,var(--muted)_55%,var(--card)),var(--muted))] bg-[length:200%_100%] motion-safe:animate-[shimmer_1.6s_ease-in-out_infinite]", className)} {...props} />;
}

export { Skeleton };
