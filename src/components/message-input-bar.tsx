import type { ChatStatus } from "ai";
import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnMessage } from "@/hooks/use-on-message";
import { cn } from "@/lib/utils";
import { ChatbotContext } from "@/providers/chatbot-context";
import { useProject } from "@/providers/project-context";
import { ArrowUpIcon, CornerDownRight, Square, XIcon } from "lucide-react";

export interface MessageInputBarProps {
  autoFocus?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status?: ChatStatus;
  error?: Error;
  onStop?: () => void;
}

export default function MessageInputBar({
  status,
  error,
  autoFocus,
  input,
  setInput,
  onSubmit,
  onStop,
}: MessageInputBarProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const project = useProject();
  const [isFocused, setIsFocused] = useState(false);
  const chatbotContext = useContext(ChatbotContext);

  const pageContext = chatbotContext?.pageContext;

  const loading = status === "streaming" || status === "submitted";

  const sendButton = useMemo(() => {
    if (loading) {
      return (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={onStop}
          className="size-9 rounded-full"
        >
          <Square className="fill-foreground size-5" />
          <div className="sr-only">Stop</div>
        </Button>
      );
    }

    return (
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || !!error}
        className="size-9 rounded-full"
      >
        <ArrowUpIcon className="size-5" />
        <div className="sr-only">Send Message</div>
      </Button>
    );
  }, [loading, input, error, onStop]);

  useOnMessage((type) => {
    if (type === "focus") {
      textAreaRef.current?.focus();
    }
  });

  useEffect(() => {
    if (textAreaRef.current && isFocused) {
      textAreaRef.current.style.height = "0px";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + 2 + "px";
    }
  }, [input, isFocused]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, [pageContext?.textSelection]);

  return (
    <div className="from-background/0 via-background to-background relative z-20 shrink-0 bg-gradient-to-b via-[1.25rem]">
      <div className="relative mx-auto w-full max-w-screen-lg p-2 pt-0">
        <div
          className={cn(
            "bg-background dark:bg-secondary ring-border flex flex-col gap-1 overflow-hidden rounded-[26px] ring-1",
          )}
        >
          {pageContext?.textSelection && (
            <div className="p-1 pb-0">
              <div className="bg-foreground/5 flex gap-2 rounded-[22px] rounded-b-lg p-2">
                <div className="flex size-6 shrink-0 items-center justify-center">
                  <CornerDownRight className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="line-clamp-3 text-sm">
                    {pageContext.textSelection}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    chatbotContext?.setPageContext((context) => ({
                      ...context,
                      textSelection: undefined,
                    }))
                  }
                  className="size-6"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
          <form
            className="relative flex w-full shrink-0 flex-col"
            onSubmit={onSubmit}
          >
            <div className="flex items-end px-2 py-0">
              <textarea
                ref={textAreaRef}
                placeholder={
                  project.chatWidgetConfig.inputPlaceholder.trim() || "Message…"
                }
                className="placeholder:text-muted-foreground max-h-32 flex-1 resize-none border-none px-3 py-3 text-base leading-relaxed outline-none"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.code === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (loading) {
                      return;
                    }
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                autoFocus={autoFocus}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <div className="py-2">{sendButton}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
