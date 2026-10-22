import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { SiteHeader } from "@/components/site-header";

export function WorkspacePage({
  title,
  icon,
}: Readonly<{ title: string; icon: ReactNode }>) {
  return (
    <AppShell>
      <SiteHeader title={title} />
      <section
        aria-label={title}
        className="animate-view-enter flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto p-6 text-center"
      >
        <div className="rounded-xl bg-slate-100 p-3 text-slate-500">{icon}</div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">Nothing here yet.</p>
      </section>
    </AppShell>
  );
}
