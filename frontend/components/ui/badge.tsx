import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "secondary",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "secondary" | "success" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "success"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
