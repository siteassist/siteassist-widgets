import type { Conversation, Message as MessageType } from "@/types";
import type { CustomUIMessage } from "@/types/chat";
import { useCallback, useMemo, useState } from "react";
import AppBar from "@/components/app-bar";
import AppBarButton from "@/components/app-bar-button";
import ChatTitle from "@/components/chat-title";
import CloseWindowButton from "@/components/close-window-button";
import MessageInputBar from "@/components/message-input-bar";
import MessagesView from "@/components/messages-view";
import { useChatbot } from "@/providers/chatbot-context";
import {
  convertToUIMessage,
  getHeaders,
  getWelcomeUIMessages,
} from "@/utils/helpers";
import { $api, fetchClient } from "@/utils/openapi";
import { useQueryClient } from "@tanstack/react-query";
import { HistoryIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function ChatHomeScreen() {
  const navigate = useNavigate();
  const { project, apiKey } = useChatbot();
  const [input, setInput] = useState("");
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [userMessage, setUserMessage] = useState<CustomUIMessage | null>(null);

  const messages = useMemo(
    () => [
      ...getWelcomeUIMessages(project.chatWidgetConfig),
      ...(userMessage ? [userMessage] : []),
    ],
    [project.chatWidgetConfig, userMessage],
  );

  const autoFocus = searchParams.get("autoFocus") === "true";

  const handleSubmit = useCallback(
    async (message?: string) => {
      if (isLoading) return;
      if (!message?.trim()) {
        message = input;
      }

      if (!message.trim()) {
        return;
      }

      setIsLoading(true);

      const userMessage: MessageType = {
        object: "message",
        id: uuidv4(),
        chatId: "",
        createdAt: new Date().toISOString(),
        role: "user",
        status: "complete",
        parts: [{ type: "text", text: message }],
        error: null,
        feedback: null,
        feedbackAt: null,
        metadata: null,
        humanAgent: null,
      };

      setInput("");

      setUserMessage(convertToUIMessage(userMessage));

      try {
        const res = await fetchClient.POST("/conversations", {
          headers: getHeaders(apiKey),
        });

        if (res.data) {
          queryClient.setQueryData(
            $api.queryOptions("get", "/conversations/{conversationId}", {
              params: { path: { conversationId: res.data.id } },
              headers: getHeaders(apiKey),
            }).queryKey,
            {
              ...res.data,
              pendingMessage: {
                id: userMessage.id,
                content: message,
              },
              messages: [],
            } satisfies Conversation,
          );

          void navigate(`/chats/${res.data.id}`);
        } else {
          console.error(res.error);
          toast.error("Failed to start conversation");
          setUserMessage(null);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to start conversation");
        setUserMessage(null);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, input, isLoading, navigate, queryClient],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <AppBar
        hideBackButton
        title={<ChatTitle />}
        trailing={
          <>
            <AppBarButton
              onClick={() => navigate("/chats")}
              tooltip="Conversation History"
            >
              <HistoryIcon />
            </AppBarButton>
            <CloseWindowButton />
          </>
        }
      />

      <MessagesView messages={messages} />

      {/* {project.quickPrompts.length > 0 && (
        <div className="mx-auto flex w-full max-w-screen-lg flex-wrap gap-2 p-4 pt-0">
          {project.quickPrompts.map((quickPrompt) => (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-muted-foreground hover:text-foreground"
              key={quickPrompt.id}
              onClick={() => {
                handleSubmit(quickPrompt.prompt);
              }}
            >
              {quickPrompt.title}
            </Button>
          ))}
        </div>
      )} */}

      <div className="shrink-0">
        <MessageInputBar
          input={input}
          setInput={setInput}
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          autoFocus={autoFocus}
          status={isLoading ? "submitted" : "ready"}
        />
      </div>
    </div>
  );
}
