"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <TooltipProvider>{children}</TooltipProvider>
    </CopilotKitProvider>
  );
}
