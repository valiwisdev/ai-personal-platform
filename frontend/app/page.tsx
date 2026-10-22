import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SiteHeader } from "@/components/site-header";
import { mainNavItems, navSections, type NavItem } from "@/lib/navigation";

const featuredItems = mainNavItems.filter((item) => item.href !== "/");

export default function HomePage() {
  return (
    <AppShell>
      <SiteHeader title="Home" />
      <section
        aria-label="Home"
        className="animate-view-enter flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 md:px-8 md:py-12"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Choose a workspace to get started.
            </p>
          </div>
          <ul className="overflow-hidden rounded-xl border border-slate-200">
            {featuredItems.map((item) => (
              <li key={item.href}>
                <WorkspaceLink item={item} />
              </li>
            ))}
          </ul>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
            {navSections.map((section) => (
              <section
                key={section.title}
                aria-labelledby={`home-section-${section.title}`}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-0.5 px-1">
                  <h2
                    id={`home-section-${section.title}`}
                    className="text-sm font-semibold"
                  >
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {section.description}
                  </p>
                </div>
                <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <WorkspaceLink item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function WorkspaceLink({ item }: Readonly<{ item: NavItem }>) {
  return (
    <a
      href={item.href}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
    >
      <item.icon className="size-5 shrink-0 text-slate-400" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{item.title}</span>
        <span className="truncate text-sm text-slate-500">
          {item.description}
        </span>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
        aria-hidden
      />
    </a>
  );
}
