import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "slate" | "green" | "amber" | "rose" | "blue" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
        tone === "slate" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        tone === "green" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        tone === "amber" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        tone === "rose" && "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        tone === "blue" && "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
        className,
      )}
      {...props}
    />
  );
}
