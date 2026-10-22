"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  Code2,
  FileText,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = Readonly<{ title: string; href: string; icon: LucideIcon }>;

const navItems: readonly NavItem[] = [
  { title: "Agents", href: "/", icon: Bot },
  { title: "Coding", href: "/coding", icon: Code2 },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Personal", href: "/personal", icon: UserRound },
];

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <Sparkles className="size-5" aria-hidden />
              <span className="text-base font-semibold">
                AI Personal Platform
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <a
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon aria-hidden />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
