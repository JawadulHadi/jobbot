"use client";

import type { ChatStatus, UIMessage } from "ai";
import { ArrowDownIcon, BotIcon, MessageSquareIcon, ShieldCheckIcon } from "lucide-react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { cn } from "@/lib/utils";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  emptyState?: string;
  messages: UIMessage[];
  status: ChatStatus;
};

export function Messages({ emptyState = "Ask anything...", messages, status }: MessagesProps) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
  } = useScrollToBottom();

  return (
    <div className="relative flex-1 bg-background">
      {messages.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
          {emptyState === "Ask anything..." ? (
            <div className="max-w-md text-center fade-up">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] ring-1 ring-[var(--brand)]/20">
                <BotIcon className="size-7" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                How can Jobbot help today?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Start a conversation below. If a task needs human approval, you’ll be guided to Reviews to continue safely.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-2.5 py-1">
                  <MessageSquareIcon className="size-3.5" /> Conversational help
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-2.5 py-1">
                  <ShieldCheckIcon className="size-3.5" /> Human-in-the-loop reviews
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">{emptyState}</p>
          )}
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 touch-pan-y overflow-y-auto",
          messages.length > 0 ? "bg-background" : "bg-transparent"
        )}
        ref={containerRef}
      >
        <div className="mx-auto flex min-h-full min-w-0 max-w-4xl flex-col gap-5 px-2 py-6 md:gap-7 md:px-4">
          {messages.map((message, index) => (
            <PreviewMessage
              isLoading={
                status === "streaming" && messages.length - 1 === index
              }
              key={message.id}
              message={message}
            />
          ))}

          {status === "submitted" && messages.at(-1)?.role !== "assistant" && (
            <ThinkingMessage />
          )}

          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={endRef}
          />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={`absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border border-border/50 bg-card/90 px-3.5 shadow-[var(--shadow-float)] backdrop-blur-lg transition-all duration-200 h-7 text-[10px] ${
          isAtBottom
            ? "pointer-events-none scale-90 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
        onClick={() => scrollToBottom("smooth")}
        type="button"
      >
        <ArrowDownIcon className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}
