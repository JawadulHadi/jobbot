"use client";

import type { UIMessage } from "ai";
import type { ComponentProps } from "react";
import Link from "next/link";
import { cn, sanitizeText } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { memo } from "react";
import { Streamdown } from "streamdown";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SparklesIcon } from "./icons";

const streamdownPlugins = { cjk, code, math, mermaid };

const MarkdownResponse = memo(
  ({ className, ...props }: ComponentProps<typeof Streamdown>) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prev, next) => prev.children === next.children
);
MarkdownResponse.displayName = "MarkdownResponse";

export const PreviewMessage = ({
  message,
  isLoading,
}: {
  message: UIMessage;
  isLoading: boolean;
}) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = message.parts?.some(
    (part) => part.type === "text" && part.text?.trim().length > 0
  );
  const isThinking = isAssistant && isLoading && !hasAnyContent;

  const parts = message.parts?.map((part, index) => {
    if (part.type === "data-suspension") {
      return (
        <div key={`message-${message.id}-part-${index}`}>
          <Link
            className="text-sm font-medium text-primary underline"
            href="/reviews"
          >
            Open reviews to continue
          </Link>
        </div>
      );
    }
    if (part.type !== "text") return null;
    return (
      <div
        className={cn(
          "flex min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm text-foreground text-[13px] leading-[1.7]",
          isUser &&
            "w-fit max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-md glass-strong px-4 py-2.5",
          isAssistant && "rounded-2xl glass-subtle px-4 py-3"
        )}
        key={`message-${message.id}-part-${index}`}
      >
        <MarkdownResponse>{sanitizeText(part.text)}</MarkdownResponse>
      </div>
    );
  });

  const content = isThinking ? (
    <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
      <Shimmer className="font-medium" duration={1}>
        Thinking...
      </Shimmer>
    </div>
  ) : (
    <>{parts}</>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        !isAssistant && "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      )}
      data-role={message.role}
    >
      <div
        className={cn(
          isUser ? "flex flex-col items-end gap-2" : "flex items-start gap-3"
        )}
      >
        {isAssistant && (
          <div className="flex h-[calc(13px*1.7)] shrink-0 items-center pt-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/25 to-[var(--brand)]/5 text-[var(--brand)] ring-1 ring-[var(--brand)]/25 shadow-sm">
              <SparklesIcon size={14} />
            </div>
          </div>
        )}
        {isAssistant ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">{content}</div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export const ThinkingMessage = () => (
  <div className="group/message w-full" data-role="assistant">
    <div className="flex items-start gap-3">
      <div className="flex h-[calc(13px*1.7)] shrink-0 items-center pt-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/25 to-[var(--brand)]/5 text-[var(--brand)] ring-1 ring-[var(--brand)]/25 shadow-sm">
          <SparklesIcon size={14} />
        </div>
      </div>
      <div className="glass-subtle rounded-2xl px-4 py-3 flex h-[calc(13px*1.7+1.5rem)] items-center text-[13px] leading-[1.7]">
        <Shimmer className="font-medium" duration={1}>
          Thinking...
        </Shimmer>
      </div>
    </div>
  </div>
);
