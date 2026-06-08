import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "emerald" | "sky" | "amber" | "rose" | "slate";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            tone === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            tone === "sky" && "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
            tone === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            tone === "rose" && "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
            tone === "slate" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
