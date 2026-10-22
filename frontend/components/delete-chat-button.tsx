"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Conversation } from "@/schemas/conversation";

export function DeleteChatButton({
  conversation,
  disabled,
  onDelete,
}: Readonly<{
  conversation: Conversation;
  disabled: boolean;
  onDelete: (threadId: string) => Promise<boolean>;
}>) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-slate-500 hover:text-red-600"
          aria-label={`Delete chat: ${conversation.title}`}
          title="Delete chat"
          disabled={disabled}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Delete chat"
        className="max-w-[calc(100vw-1rem)]"
      >
        <h2 className="font-medium">Delete chat?</h2>
        <p className="mt-2 text-sm break-words text-slate-600">
          “{conversation.title}” and its messages will be permanently deleted.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            disabled={disabled}
            onClick={async () => {
              if (await onDelete(conversation.threadId)) setOpen(false);
            }}
          >
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
