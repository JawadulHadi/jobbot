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
    <div className="relative flex-1 bg-transparent">
      {messages.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
          {emptyState === "Ask anything..." ? (
            <div className="max-w-lg text-center fade-up glass-strong rounded-3xl p-8 md:p-10">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)]/25 to-[var(--brand)]/5 text-[var(--brand)] ring-1 ring-[var(--brand)]/30 shadow-[0_8px_30px_-10px_oklch(from_var(--brand)_l_c_h_/_0.5)]">
                <BotIcon className="size-8" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How can Jobbot help today?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Start a conversation below. If a task needs human approval, you’ll be guided to Reviews to continue safely.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5">
                  <MessageSquareIcon className="size-3.5 text-[var(--brand)]" aria-hidden="true" /> Conversational help
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5">
                  <ShieldCheckIcon className="size-3.5 text-[var(--brand)]" aria-hidden="true" /> Human-in-the-loop reviews
                </span>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl px-6 py-4">
              <p className="text-sm text-muted-foreground text-center">{emptyState}</p>
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 touch-pan-y overflow-y-auto",
          messages.length > 0 ? "bg-transparent" : "bg-transparent"
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
        className={`absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full glass px-4 shadow-[var(--shadow-float)] transition-all duration-200 h-8 text-[11px] text-foreground/80 ${
          isAtBottom
            ? "pointer-events-none scale-90 opacity-0"
            : "pointer-events-auto scale-100 opacity-100 hover:bg-[var(--glass-bg-strong)]"
        }`}
        onClick={() => scrollToBottom("smooth")}
        type="button"
      >
        <ArrowDownIcon className="size-3.5 mr-1" aria-hidden="true" />
        Latest
      </button>
    </div>
  );
}
