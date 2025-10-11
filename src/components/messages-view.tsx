import type { CustomUIMessage } from "@/types/chat";
import type { ChatStatus, ToolUIPart } from "ai";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-context";
import {
  ArrowDownIcon,
  CheckIcon,
  CopyIcon,
  Loader,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { harden } from "rehype-harden";
import { Streamdown } from "streamdown";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ButtonWithTooltip } from "./button-with-tooltip";
import { ShimmeringText } from "./simmering-text";

export default function MessagesView({
  messages,
  status,
  onFeedbackClick,
  onRegenerateClick,
  isHumanHandled,
}: {
  messages: CustomUIMessage[];
  status?: ChatStatus;
  onFeedbackClick?: (messageId: string, feedback: "like" | "dislike") => void;
  onRegenerateClick?: () => void;
  isHumanHandled?: boolean;
}) {
  const theme = useTheme();

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  return (
    <StickToBottom
      className="relative -mb-6 flex-1 overflow-y-auto"
      initial="smooth"
      resize="smooth"
      role="log"
    >
      <StickToBottom.Content className="mx-auto max-w-screen-lg px-4 pt-8 pb-20">
        {messages.map((message, messageIndex) => {
          const isLastMessage = messageIndex === messages.length - 1;
          const isStreaming = isLastMessage && status === "streaming";

          return (
            <div
              key={message.id}
              className="group relative mx-auto mb-12 flex w-full"
            >
              <div
                className={cn("flex w-full", {
                  "justify-end": message.role === "user",
                })}
              >
                <div className="grid max-w-[calc(100%-2rem)] min-w-0 gap-1 overflow-hidden rounded-xl">
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <div
                          key={`part-${message.id}-${i}`}
                          className={cn("bg-secondary/50 px-3 py-2.5 text-sm", {
                            "bg-[var(--user-message-bubble)]! text-[var(--user-message-bubble-foreground)]!":
                              message.role === "user",
                          })}
                        >
                          <Streamdown
                            key={theme.isDark ? "dark" : "light"}
                            shikiTheme={[
                              theme.isDark ? "github-dark" : "github-light",
                              theme.isDark ? "github-dark" : "github-light",
                            ]}
                            className="[&_.shiki]:bg-secondary! size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            isAnimating={isStreaming}
                            rehypePlugins={[
                              [
                                harden,
                                {
                                  allowedLinkPrefixes: ["mailto:", "*"],
                                  defaultOrigin: window.location.origin,
                                },
                              ],
                            ]}
                          >
                            {part.text}
                          </Streamdown>
                        </div>
                      );
                    }

                    if (part.type.startsWith("tool-action_")) {
                      return <RenderActionTool part={part as ToolUIPart} />;
                    }
                  })}

                  {!message.hideActions && !isStreaming && (
                    <div
                      className={cn(
                        "absolute top-[calc(100%+4px)] right-0 left-0 flex items-center gap-1 px-2",
                        {
                          "justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100":
                            message.role === "user",
                        },
                      )}
                    >
                      <CopyAction message={message} />
                      {message.role === "assistant" && (
                        <>
                          <ButtonWithTooltip
                            tooltip="Good Response"
                            onClick={() =>
                              onFeedbackClick?.(message.id, "like")
                            }
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                          >
                            <ThumbsUpIcon
                              className={cn({
                                "fill-foreground text-foreground":
                                  message.feedback === "like",
                              })}
                            />
                          </ButtonWithTooltip>
                          <ButtonWithTooltip
                            tooltip="Bad Response"
                            onClick={() =>
                              onFeedbackClick?.(message.id, "dislike")
                            }
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                          >
                            <ThumbsDownIcon
                              className={cn({
                                "fill-foreground text-foreground":
                                  message.feedback === "dislike",
                              })}
                            />
                          </ButtonWithTooltip>
                        </>
                      )}
                    </div>
                  )}

                  {isStreaming ? (
                    <div>
                      <Loader className="size-4 animate-spin" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {status === "submitted" && !isHumanHandled && (
          <ShimmeringText text="Thinking" />
        )}
        {status === "error" && (
          <div className="flex items-center gap-4 p-6">
            <p className="text-muted-foreground text-center text-sm">
              Something went wrong.
            </p>
            <Button type="button" onClick={onRegenerateClick}>
              Retry
            </Button>
          </div>
        )}
      </StickToBottom.Content>
      <ScrollToBottomButton className="bottom-8" />
    </StickToBottom>
  );
}

function CopyAction({ message }: { message: CustomUIMessage }) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async () => {
    if (isCopied) return;
    try {
      await navigator.clipboard.writeText(
        message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n\n"),
      );
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    } catch {
      /* empty */
    }
  }, [isCopied, message.parts]);

  return (
    <ButtonWithTooltip
      onClick={copy}
      tooltip={isCopied ? "Copied" : "Copy"}
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
    >
      {isCopied ? <CheckIcon /> : <CopyIcon />}
    </ButtonWithTooltip>
  );
}

function RenderActionTool({ part }: { part: ToolUIPart }) {
  const [, actionType] = part.type.split("_");

  switch (actionType) {
    case "display-link": {
      if (part.state === "output-available") {
        const output = part.output as {
          buttonLabel: string;
          href: string;
          buttonVariant?:
            | "default"
            | "destructive"
            | "outline"
            | "secondary"
            | "ghost"
            | "link";
        };
        return (
          <div className="bg-secondary/50 px-3 py-2">
            <Button variant={output.buttonVariant} asChild className="w-full">
              <a href={output.href} target="_blank">
                {output.buttonLabel}
              </a>
            </Button>
          </div>
        );
      }
    }
  }
}

const ScrollToBottomButton = ({
  className,
  ...props
}: ComponentProps<typeof Button>) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn(
          "absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full",
          className,
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};
