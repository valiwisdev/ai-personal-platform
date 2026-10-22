import { AgentStatus } from "@/components/agent-status";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  title,
  agentId,
  onSettings,
  settingsOpen,
}: Readonly<{
  title: string;
  agentId?: string;
  onSettings?: () => void;
  settingsOpen?: boolean;
}>) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-slate-200 transition-[width,height] ease-linear">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="truncate text-base font-medium">{title}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {onSettings && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 md:hidden"
              aria-label="Settings"
              aria-pressed={settingsOpen}
              onClick={onSettings}
            >
              <Settings className="size-4" aria-hidden />
            </Button>
          )}
          {agentId && <AgentStatus agentId={agentId} />}
        </div>
      </div>
    </header>
  );
}
