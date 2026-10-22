"use client";

import {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type ReactNode,
} from "react";
import { CopilotChatInput } from "@copilotkit/react-core/v2";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { AgentTool } from "@/schemas/tools";

type ToolsMenuValue = Readonly<{
  tools: readonly AgentTool[];
  enabledTools: readonly string[];
  disabled: boolean;
  onToolChange: (name: string, enabled: boolean) => void;
}>;

const ToolsMenuContext = createContext<ToolsMenuValue | null>(null);

export function ToolsMenuProvider({
  children,
  ...value
}: ToolsMenuValue & Readonly<{ children: ReactNode }>) {
  return (
    <ToolsMenuContext.Provider value={value}>
      {children}
    </ToolsMenuContext.Provider>
  );
}

export function ChatInputActions({
  onAddFile,
  disabled,
}: ComponentProps<typeof CopilotChatInput.AddMenuButton>) {
  const menu = useContext(ToolsMenuContext);
  return (
    <div className="flex items-center gap-1">
      {onAddFile && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Add attachment"
          title="Add attachment"
          disabled={disabled || menu?.disabled}
          onClick={onAddFile}
          className="size-9 rounded-full text-[#444444] hover:bg-[#f8f8f8] hover:text-[#333333]"
        >
          <Plus className="size-5" aria-hidden />
        </Button>
      )}
      <ToolsMenu />
    </div>
  );
}

function ToolsMenu() {
  const menu = useContext(ToolsMenuContext);
  const titleId = useId();
  if (!menu || menu.tools.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Tools"
          title="Tools"
          disabled={menu.disabled}
          className="size-9 rounded-full text-[#444444] hover:bg-[#f8f8f8] hover:text-[#333333]"
        >
          <Wrench className="size-5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-labelledby={titleId}
        side="top"
        align="start"
        className="flex max-h-[min(24rem,var(--radix-popover-content-available-height))] w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden border-slate-200"
      >
        <h2 id={titleId} className="mb-3 shrink-0 text-sm font-medium">
          Tools
        </h2>
        <ToolSwitches />
      </PopoverContent>
    </Popover>
  );
}

export function ToolSwitches() {
  const menu = useContext(ToolsMenuContext);
  const id = useId();
  if (!menu || menu.tools.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        This agent has no configurable tools.
      </p>
    );
  }
  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain">
      {menu.tools.map((tool) => (
        <label
          key={tool.name}
          className="flex shrink-0 items-center justify-between gap-3 rounded-md py-2 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50"
        >
          <span className="flex flex-col gap-0.5">
            <span>{tool.label}</span>
            <span
              id={`${id}-${tool.name}`}
              className="text-muted-foreground text-xs"
            >
              {tool.available ? tool.description : "Unavailable on this server"}
            </span>
          </span>
          <Switch
            checked={menu.enabledTools.includes(tool.name)}
            disabled={menu.disabled || !tool.available}
            onCheckedChange={(checked) => menu.onToolChange(tool.name, checked)}
            aria-label={tool.label}
            aria-describedby={`${id}-${tool.name}`}
          />
        </label>
      ))}
    </div>
  );
}
