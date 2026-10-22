"use client";

import type { CSSProperties, ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const layoutStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties;

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SidebarProvider className="h-svh" style={layoutStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  );
}
