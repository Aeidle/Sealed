import { cn } from "@/lib/utils";

/** Frosted-glass surface used as the app's primary card. */
export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass w-full rounded-3xl p-6 sm:p-8", className)}>{children}</div>
  );
}
