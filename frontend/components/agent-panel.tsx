"use client";

import {
  ArrowLeft,
  MessageSquare,
  Settings,
  SquarePen,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteChatButton } from "@/components/delete-chat-button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AgentOption } from "@/schemas/agents";
import type { Conversation } from "@/schemas/conversation";

type AgentPanelProps = Readonly<{
  agentId: string;
  agents: readonly AgentOption[];
  threadId: string;
  conversations: readonly Conversation[];
  conversationsError: string | null;
  isRunning: boolean;
  onAgentChange: (agentId: string) => void;
  onConversationChange: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (threadId: string) => Promise<boolean>;
  onSettings: () => void;
  settingsOpen: boolean;
  onBack: () => void;
}>;

export function AgentPanel(props: AgentPanelProps) {
  const currentConversation = props.conversations.find(
    (conversation) => conversation.threadId === props.threadId,
  );
  if (props.settingsOpen) {
    return (
      <aside
        key="settings-navigation"
        aria-label="Settings navigation"
        className="flex shrink-0 flex-col gap-3 border-b border-slate-200 p-3 md:w-64 md:border-r md:border-b-0"
      >
        <Button
          type="button"
          variant="ghost"
          className="justify-start gap-2"
          onClick={props.onBack}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to chat
        </Button>
        <TabsList
          aria-label="Settings sections"
          className="h-auto w-full justify-start gap-0.5 bg-transparent p-0 md:flex-col"
        >
          <TabsTrigger
            value="tools"
            className="w-full justify-start gap-2 px-2 py-1.5 font-normal text-slate-700 hover:bg-slate-100 data-[state=active]:bg-slate-100 data-[state=active]:font-medium data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <Wrench className="size-4 text-slate-500" aria-hidden />
            Tools
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="w-full justify-start gap-2 px-2 py-1.5 font-normal text-slate-700 hover:bg-slate-100 data-[state=active]:bg-slate-100 data-[state=active]:font-medium data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <Settings className="size-4 text-slate-500" aria-hidden />
            General
          </TabsTrigger>
        </TabsList>
      </aside>
    );
  }
  return (
    <>
      <aside
        key="chat-navigation"
        aria-label="Agent chats"
        className="hidden w-64 shrink-0 flex-col gap-3 border-r border-slate-200 p-3 md:flex"
      >
        <Button onClick={props.onNewChat} disabled={props.isRunning}>
          <SquarePen className="size-4" aria-hidden />
          New chat
        </Button>
        <AgentSelect {...props} className="w-full min-w-0" />
        <ChatHistory {...props} />
        <div className="shrink-0 border-t border-slate-200 pt-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={props.onSettings}
            aria-pressed={props.settingsOpen}
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </Button>
        </div>
      </aside>
      <div className="flex items-center gap-2 border-b border-slate-200 p-2 md:hidden">
        <AgentSelect {...props} className="w-32 shrink-0" />
        <HistorySelect {...props} />
        {currentConversation && (
          <DeleteChatButton
            conversation={currentConversation}
            disabled={props.isRunning}
            onDelete={props.onDeleteChat}
          />
        )}
        <Button
          size="icon"
          aria-label="New chat"
          onClick={props.onNewChat}
          disabled={props.isRunning}
          className="size-9 shrink-0"
        >
          <SquarePen className="size-4" aria-hidden />
        </Button>
      </div>
      {props.conversationsError && (
        <p role="status" className="px-2 py-1 text-xs text-red-600 md:hidden">
          {props.conversationsError}
        </p>
      )}
    </>
  );
}

function AgentSelect({
  agentId,
  agents,
  isRunning,
  onAgentChange,
  className,
}: AgentPanelProps & Readonly<{ className: string }>) {
  return (
    <Select value={agentId} onValueChange={onAgentChange} disabled={isRunning}>
      <SelectTrigger aria-label="Agent" size="sm" className={className}>
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ChatHistory({
  threadId,
  conversations,
  conversationsError,
  isRunning,
  onConversationChange,
  onDeleteChat,
}: AgentPanelProps) {
  return (
    <nav aria-label="Chat history" className="flex min-h-0 flex-1 flex-col">
      <h2 className="px-2 pb-1 text-xs font-medium text-slate-500">History</h2>
      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {conversations.map((conversation) => {
          const isActive = conversation.threadId === threadId;
          return (
            <li
              key={conversation.threadId}
              className="flex min-w-0 items-center gap-1"
            >
              <button
                type="button"
                title={conversation.title}
                aria-current={isActive ? "page" : undefined}
                disabled={isRunning || isActive}
                onClick={() => onConversationChange(conversation.threadId)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-default",
                  isActive && "bg-slate-100 font-medium text-slate-900",
                )}
              >
                <MessageSquare
                  className="size-4 shrink-0 text-slate-500"
                  aria-hidden
                />
                <span className="truncate">{conversation.title}</span>
              </button>
              <DeleteChatButton
                conversation={conversation}
                disabled={isRunning}
                onDelete={onDeleteChat}
              />
            </li>
          );
        })}
      </ul>
      {conversationsError && (
        <p role="status" className="px-2 pt-2 text-xs text-red-600">
          {conversationsError}
        </p>
      )}
    </nav>
  );
}

function HistorySelect({
  threadId,
  conversations,
  isRunning,
  onConversationChange,
}: AgentPanelProps) {
  const isSavedChat = conversations.some(
    (conversation) => conversation.threadId === threadId,
  );

  return (
    <Select
      value={isSavedChat ? threadId : ""}
      onValueChange={onConversationChange}
      disabled={isRunning || conversations.length === 0}
    >
      <SelectTrigger
        aria-label="Chat history"
        size="sm"
        className="min-w-0 flex-1"
      >
        <SelectValue placeholder="Chat history" />
      </SelectTrigger>
      <SelectContent>
        {conversations.map((conversation) => (
          <SelectItem
            key={conversation.threadId}
            value={conversation.threadId}
            title={conversation.title}
          >
            {conversation.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
