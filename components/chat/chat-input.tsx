"use client";

import type { ChatStatus } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StopIcon } from "./icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  disabled?: boolean;
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (text: string) => void;
  placeholder?: string;
  status: ChatStatus;
  stop: () => void;
};

export function ChatInput({
  disabled = false,
  input,
  setInput,
  onSendMessage,
  placeholder = "Ask anything...",
  status,
  stop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [disabled]);

  const submitForm = useCallback(() => {
    if (disabled || !input.trim()) return;
    onSendMessage(input);
    setInput("");
  }, [disabled, input, onSendMessage, setInput]);

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && input.trim() && (status === "ready" || status === "error")) {
          submitForm();
        }
      }}
    >
      <div className="overflow-hidden rounded-2xl glass-subtle transition-all duration-300 focus-within:shadow-[var(--shadow-composer-focus)] focus-within:border-[var(--ring)]/40">
        <textarea
          aria-label="Message"
          className="field-sizing-content max-h-48 min-h-24 w-full resize-none border-0 bg-transparent px-4 pt-4 pb-2 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/45"
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onCompositionEnd={() => setIsComposing(false)}
          onCompositionStart={() => setIsComposing(true)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || isComposing || e.nativeEvent.isComposing) return;
            e.preventDefault();
            if (!disabled && input.trim() && (status === "ready" || status === "error")) {
              submitForm();
            }
          }}
          placeholder={placeholder}
          ref={textareaRef}
          value={input}
        />
        <div className="flex items-center justify-end px-3 pb-3 pt-1">
          {status === "submitted" || status === "streaming" ? (
            <Button
              aria-label="Stop generating"
              className="h-8 w-8 rounded-xl bg-[var(--brand)] p-1 text-[var(--brand-foreground)] shadow-[0_6px_16px_-6px_oklch(from_var(--brand)_l_c_h_/_0.7)] transition-all duration-200 hover:brightness-110 active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                stop();
              }}
              type="button"
            >
              <StopIcon size={14} />
            </Button>
          ) : (
            <button
              aria-label="Send message"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                input.trim() && !disabled
                  ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[0_6px_16px_-6px_oklch(from_var(--brand)_l_c_h_/_0.7)] hover:brightness-110 active:scale-95"
                  : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed border border-border/40"
              )}
              disabled={disabled || !input.trim()}
              type="submit"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
