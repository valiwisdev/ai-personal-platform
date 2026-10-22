"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useAgent,
} from "@copilotkit/react-core/v2";
import { AgentPanel } from "@/components/agent-panel";
import { AgentSettings } from "@/components/agent-settings";
import { AppShell } from "@/components/app-shell";
import { SiteHeader } from "@/components/site-header";
import { ChatInputActions, ToolsMenuProvider } from "@/components/tools-menu";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useAgentHistory } from "@/hooks/use-agent-history";
import { useAgentTools } from "@/hooks/use-agent-tools";
import { useConversations } from "@/hooks/use-conversations";
import { useIsMobile } from "@/hooks/use-mobile";
import { toAgentMessages } from "@/lib/agent-response";
import type { AgentOption } from "@/schemas/agents";

type AgentChatProps = Readonly<{
  agentId: string;
  agents: readonly AgentOption[];
  threadId: string;
}>;

export function AgentChat({ agentId, agents, threadId }: AgentChatProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("tools");
  const isMobile = useIsMobile();
  const { agent } = useAgent({ agentId });
  const {
    conversations,
    error: conversationsError,
    isDeleting,
    deleteConversation,
  } = useConversations(agentId, agent, true);

  function openConversation(nextAgentId: string, nextThreadId: string) {
    setSettingsOpen(false);
    router.push(
      `/agents?agent=${encodeURIComponent(nextAgentId)}&thread=${encodeURIComponent(nextThreadId)}`,
    );
  }

  function openNewConversation(nextAgentId: string) {
    openConversation(nextAgentId, crypto.randomUUID());
  }

  async function deleteChat(deletedThreadId: string): Promise<boolean> {
    const deleted = await deleteConversation(deletedThreadId);
    if (deleted && deletedThreadId === threadId) {
      setSettingsOpen(false);
      router.replace(
        `/agents?agent=${encodeURIComponent(agentId)}&thread=${crypto.randomUUID()}`,
      );
    }
    return deleted;
  }

  return (
    <AppShell>
      <SiteHeader
        title="Agentic Chat"
        agentId={agentId}
        onSettings={() => setSettingsOpen(true)}
        settingsOpen={settingsOpen}
      />
      <Tabs
        value={settingsTab}
        onValueChange={setSettingsTab}
        orientation={isMobile ? "horizontal" : "vertical"}
        className="min-h-0 flex-1 gap-0 md:flex-row"
      >
        <AgentPanel
          agentId={agentId}
          agents={agents}
          threadId={threadId}
          conversations={conversations}
          conversationsError={conversationsError}
          isRunning={agent.isRunning || isDeleting}
          onDeleteChat={deleteChat}
          onSettings={() => setSettingsOpen(true)}
          settingsOpen={settingsOpen}
          onBack={() => setSettingsOpen(false)}
          onAgentChange={openNewConversation}
          onConversationChange={(nextThreadId) =>
            openConversation(agentId, nextThreadId)
          }
          onNewChat={() => openNewConversation(agentId)}
        />
        <div
          inert={isDeleting}
          aria-busy={isDeleting}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <AgentConversation
            key={`${agentId}:${threadId}`}
            agentId={agentId}
            threadId={threadId}
            settingsOpen={settingsOpen}
          />
        </div>
      </Tabs>
    </AppShell>
  );
}

function AgentConversation({
  agentId,
  threadId,
  settingsOpen,
}: Readonly<{
  agentId: string;
  threadId: string;
  settingsOpen: boolean;
}>) {
  const history = useAgentHistory(agentId, threadId);
  const toolSelection = useAgentTools(agentId, history.agent, history.isLoaded);

  let status: ReactNode = null;
  if (history.error || toolSelection.error) {
    status = (
      <div
        className="m-auto flex flex-col items-center gap-3 p-6 text-center"
        role="alert"
      >
        <p>{history.error || toolSelection.error}</p>
        <Button
          variant="outline"
          onClick={history.error ? history.retryHistory : toolSelection.retry}
        >
          Try again
        </Button>
      </div>
    );
  } else if (!history.isLoaded || !toolSelection.tools) {
    status = (
      <output className="m-auto text-sm text-slate-500">
        Loading conversation…
      </output>
    );
  }

  if (status) {
    return settingsOpen ? <AgentSettings>{status}</AgentSettings> : status;
  }

  return (
    <ToolsMenuProvider
      tools={toolSelection.tools ?? []}
      enabledTools={toolSelection.enabledTools}
      disabled={history.agent.isRunning}
      onToolChange={toolSelection.setToolEnabled}
    >
      {settingsOpen && <AgentSettings />}
      <div
        className={
          settingsOpen
            ? "hidden"
            : "animate-view-enter flex min-h-0 flex-1 flex-col"
        }
      >
        <CopilotChatConfigurationProvider
          agentId={agentId}
          threadId={threadId}
          hasExplicitThreadId={false}
        >
          <CopilotChat
            agentId={agentId}
            className="h-full"
            labels={{ welcomeMessageText: "Send a message to begin." }}
            messageView={{ transformMessages: toAgentMessages }}
            input={{ addMenuButton: ChatInputActions }}
            attachments={{
              enabled: true,
              accept: "image/*,application/pdf",
              maxSize: 10 * 1024 * 1024,
            }}
          />
        </CopilotChatConfigurationProvider>
      </div>
    </ToolsMenuProvider>
  );
}
