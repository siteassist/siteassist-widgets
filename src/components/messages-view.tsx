import type { CustomUIMessage } from "@/types/chat";
import type { ChatStatus, ToolUIPart } from "ai";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-context";
import {
  ArrowDownIcon,
  ArrowUpRight,
  CheckIcon,
  CopyIcon,
  Loader,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
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
  return (
    <StickToBottom
      className="relative -mb-6 flex-1 overflow-y-auto"
      initial="smooth"
      resize="smooth"
      role="log"
    >
      <StickToBottom.Content className="mx-auto max-w-screen-lg px-4 pt-8 pb-20">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreaming = isLastMessage && status === "streaming";

          return (
            <MessageView
              index={index}
              isLastMessage={isLastMessage}
              isStreaming={isStreaming}
              message={message}
              key={message.id}
              onFeedbackClick={onFeedbackClick}
              onRegenerateClick={onRegenerateClick}
            />
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
      className="size-8"
    >
      {isCopied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
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

type Citation = {
  id: string;
  url: string;
  label: string;
};
// const citationRegex = /【(\d+)†([^】]+)】/g;

// Matches in-text reference style: [Some Label][1]  OR just  [1]
const refRegex = /\[((?:[^\]\r\n]|\\\])*)\]\[(\d+)\]|\[(\d+)\](?!:)/g;

function MessageView({
  message,
  isStreaming,
  onFeedbackClick,
}: {
  index: number;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  message: CustomUIMessage;

  onFeedbackClick?: (messageId: string, feedback: "like" | "dislike") => void;
  onRegenerateClick?: () => void;
}) {
  const theme = useTheme();

  const citations = useMemo(() => {
    if (message.role !== "assistant" || message.humanAgent) {
      return [];
    }

    const citations: Citation[] = [];
    const content = message.parts
      .filter((part) => part.type === "text" && part.text)
      .map((p) => (p.type == "text" ? p.text : ""))
      .join("\n\n");

    const matches = content.matchAll(
      /^\[(\d+)\]:\s+(\S+)(?:\s+"([^"]+)")?\s*$/gm,
    );

    for (const match of matches) {
      const id = match[1];
      const url = match[2];
      const label = match[3];

      if (id && url && label) {
        citations.push({ id, url, label });
      }
    }

    return citations;
  }, [message.humanAgent, message.parts, message.role]);

  return (
    <div className="group relative mb-12 grid w-full">
      <div
        className={cn("flex w-full min-w-0 flex-col items-start gap-1", {
          "items-end": message.role === "user",
        })}
      >
        {message.metadata?.pageContext?.textSelection && (
          <div className="bg-secondary/50 grid max-w-[calc(100%-2rem)] gap-2 rounded-lg p-2">
            <div className="flex gap-2">
              <div className="bg-border w-px rounded-full"></div>
              <div className="flex-1">
                <p className="text-muted-foreground line-clamp-3 text-sm">
                  {message.metadata?.pageContext?.textSelection}
                </p>
              </div>
            </div>
            {message.metadata?.pageContext?.pageUrl && (
              <a
                href={message.metadata?.pageContext?.pageUrl}
                target="_blank"
                className="text-primary truncate text-sm font-medium underline-offset-2 hover:underline"
                rel="noopener"
              >
                {message.metadata?.pageContext?.pageTitle ??
                  message.metadata?.pageContext?.pageUrl}
              </a>
            )}
          </div>
        )}
        <div className="grid max-w-[calc(100%-2rem)] min-w-0 gap-1">
          <div className="grid min-w-0 gap-1 overflow-hidden rounded-xl [&_div]:rounded-sm">
            {message.parts.map((part, i) => {
              if (part.type === "text") {
                const afterRefReplacement = part.text.replace(
                  refRegex,
                  (_match, _labeledText, idFromLabeled, idFromBare) => {
                    const id = idFromLabeled || idFromBare;
                    return `<sup class="citation" data-cite="${id}">[${id}]</sup>`;
                  },
                );

                return (
                  <div
                    key={`part-${message.id}-${i}`}
                    className={cn(
                      "bg-secondary/50 min-w-0 px-3 py-2.5 text-sm",
                      {
                        "bg-[var(--user-message-bubble)]! text-[var(--user-message-bubble-foreground)]!":
                          message.role === "user",
                      },
                    )}
                  >
                    <Streamdown
                      key={theme.isDark ? "dark" : "light"}
                      shikiTheme={[
                        theme.isDark ? "github-dark" : "github-light",
                        theme.isDark ? "github-dark" : "github-light",
                      ]}
                      className="[&_.shiki]:bg-secondary! [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      isAnimating={isStreaming}
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[
                        rehypeRaw,
                        [
                          harden,
                          {
                            allowedLinkPrefixes: ["mailto:", "*"],
                            defaultOrigin: window.location.origin,
                          },
                        ],
                      ]}
                      components={{
                        sup({ node, ...props }) {
                          const id = node?.properties?.["dataCite"];
                          const citation = citations.find((c) => c.id === id);

                          if (!citation) {
                            return <sup {...props} />;
                          }

                          return (
                            <Button
                              asChild
                              variant="secondary"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground h-6 rounded-full px-2 text-xs underline-offset-2 hover:underline"
                            >
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener"
                              >
                                {citation.label}
                              </a>
                            </Button>
                          );
                        },
                      }}
                    >
                      {afterRefReplacement}
                    </Streamdown>
                  </div>
                );
              }

              if (part.type.startsWith("tool-action_")) {
                return (
                  <RenderActionTool
                    key={`part-${message.id}-${i}`}
                    part={part as ToolUIPart}
                  />
                );
              }
            })}
          </div>

          {citations.length > 0 && (
            <div>
              <p className="text-muted-foreground text-sm">Sources</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {citations.map((citation) => (
                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="h-7 rounded-full px-3 text-sm underline-offset-2 hover:underline"
                  >
                    <a href={citation.url} target="_blank">
                      {citation.label}
                      <ArrowUpRight />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

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
                    onClick={() => onFeedbackClick?.(message.id, "like")}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                  >
                    <ThumbsUpIcon
                      className={cn("size-4", {
                        "fill-foreground text-foreground":
                          message.feedback === "like",
                      })}
                    />
                  </ButtonWithTooltip>
                  <ButtonWithTooltip
                    tooltip="Bad Response"
                    onClick={() => onFeedbackClick?.(message.id, "dislike")}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                  >
                    <ThumbsDownIcon
                      className={cn("size-4", {
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
}
