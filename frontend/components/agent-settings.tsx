"use client";

import { Wrench } from "lucide-react";
import { ToolSwitches } from "@/components/tools-menu";
import { TabsContent } from "@/components/ui/tabs";
import type { ReactNode } from "react";

export function AgentSettings({
  children,
}: Readonly<{ children?: ReactNode }>) {
  return (
    <section
      aria-label="Agent settings"
      className="animate-view-enter flex min-h-0 flex-1 flex-col p-4 sm:p-6"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-6">
        <div className="shrink-0">
          <h2 className="text-xl font-semibold">Settings</h2>
        </div>
        <TabsContent
          value="tools"
          className="data-[state=active]:flex data-[state=active]:flex-col"
        >
          <section
            aria-labelledby="settings-tools-heading"
            className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-4"
          >
            <h3
              id="settings-tools-heading"
              className="flex shrink-0 items-center gap-2 font-medium"
            >
              <Wrench className="size-4" aria-hidden />
              Tools
            </h3>
            <p className="mt-2 mb-4 shrink-0 text-sm text-slate-500">
              Choose the tools this agent can use in this chat. Changes apply to
              your next message.
            </p>
            {children ?? <ToolSwitches />}
          </section>
        </TabsContent>
        <TabsContent value="general">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-medium">General</h3>
            <p className="mt-2 text-sm text-slate-500">
              No additional settings yet.
            </p>
          </div>
        </TabsContent>
      </div>
    </section>
  );
}
