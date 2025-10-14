import type { Conversation, Message } from "@/types";
import type { CustomUIMessage } from "@/types/chat";
import type { TextPart } from "ai";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import AppBar from "@/components/app-bar";
import AppBarButton from "@/components/app-bar-button";
import ChatTitle from "@/components/chat-title";
import ConnectonStatus from "@/components/conection-status";
import MessageInputBar from "@/components/message-input-bar";
import MessagesView from "@/components/messages-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatbot } from "@/providers/chatbot-context";
import { useProject } from "@/providers/project-context";
import { API_URL } from "@/utils/constants";
import {
  convertToUIMessage,
  getHeaders,
  getWelcomeUIMessages,
} from "@/utils/helpers";
import { $api } from "@/utils/openapi";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { formatDistanceToNow } from "date-fns";
import {
  HistoryIcon,
  MessageCirclePlusIcon,
  MessageCircleXIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import useWebSocket from "react-use-websocket";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import FullScreenButton from "./fullscreen-button";

export interface ConversationViewProps {
  conversation: Conversation;
}

export default function ConversationView({
  conversation,
}: ConversationViewProps) {
  const [input, setInput] = useState("");
  const [showCloseChatWarning, setShowCloseChatWarning] = useState(false);
  const { apiKey, pageUrl } = useChatbot();
  const project = useProject();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const refreshConversation = () => {
    void queryClient.invalidateQueries({
      queryKey: $api.queryOptions("get", "/conversations/{conversationId}", {
        params: { path: { conversationId: conversation.id } },
        headers: getHeaders(apiKey),
      }).queryKey,
    });
  };

  // AI SDK
  const {
    status,
    messages,
    setMessages,
    sendMessage,
    stop,
    error,
    regenerate,
  } = useChat<CustomUIMessage>({
    id: conversation.id,
    experimental_throttle: 50,
    generateId: () => uuidv4(),
    messages: conversation.messages.map(convertToUIMessage),
    transport: new DefaultChatTransport({
      api: `${API_URL}/v2/conversations/${conversation.id}/messages`,
      prepareSendMessagesRequest: ({ messages, body }) => {
        const userMsgs = messages.filter((message) => message.role === "user");
        const lastMessage = userMsgs[userMsgs.length - 1];

        if (!lastMessage) {
          throw new Error("No user message found!");
        }

        return {
          body: {
            ...body,
            content: (lastMessage.parts[0] as TextPart).text,
            stream: true,
          },
        };
      },
    }),
    onError: (error) => {
      console.error(error);
      toast.error("Something went wrong!");
    },
    onFinish: () => {
      void refreshConversation();
    },
  });

  const allMessages = useMemo(
    () => [...getWelcomeUIMessages(project.chatWidgetConfig), ...messages],
    [messages, project.chatWidgetConfig],
  );

  // WebSocket Connection
  const { readyState } = useWebSocket(
    `${API_URL}/v2/conversations/${conversation.id}/ws?apiKey=${apiKey}`,
    {
      heartbeat: {
        message: "ping",
        returnMessage: "pong",
        timeout: 60000,
        interval: 30000,
      },
      reconnectAttempts: Infinity,
      reconnectInterval: (attemptNumber) =>
        Math.min(1000 * Math.pow(2, attemptNumber), 30000),
      shouldReconnect: () => true,
      retryOnError: true,
      onOpen: () => {
        console.log("WebSocket connected");
      },
      onClose: (event) => {
        console.log(
          "WebSocket disconnected:",
          event.code,
          event.reason,
          event.wasClean,
        );
      },
      onError: (event) => {
        console.error("WebSocket error:", event);
      },
      onReconnectStop: (numAttempts) => {
        console.error("Failed to reconnect after", numAttempts, "attempts");
        toast.error("Connection lost. Please refresh the page.");
      },
      onMessage: (event) => {
        console.log("WS Event", event);
        try {
          const data = JSON.parse(event.data as string) as
            | {
                type: "new_message";
                chatId?: string;
                message?: Message;
              }
            | {
                type: "human_assigned";
                chatId?: string;
              };

          if (data.type === "new_message" && data.message) {
            const message = data.message;
            if (message.role === "human_agent") {
              setMessages((messages) => {
                if (messages.some((m) => m.id === message.id)) {
                  return messages.map((m) =>
                    m.id === message.id ? convertToUIMessage(message) : m,
                  );
                }
                return [...messages, convertToUIMessage(message)];
              });
              void refreshConversation();
            }
          }

          if (data.type === "human_assigned") {
            void refreshConversation();
          }
        } catch {
          /* empty */
        }
      },
    },
  );

  const closeChatMut = $api.useMutation(
    "post",
    "/conversations/{conversationId}/close",
    {
      onSuccess: () => {
        toast.success("Conversation closed.");
        refreshConversation();
        void queryClient.invalidateQueries({
          queryKey: $api.queryOptions("get", "/conversations", {
            headers: getHeaders(apiKey),
          }).queryKey,
        });
        void navigate("/", { replace: true });
      },
      onError: (error) => {
        console.log(error);
        toast.error("Failed to close conversation.");
      },
    },
  );

  const sendFeedbackMut = $api.useMutation(
    "post",
    "/messages/{messageId}/feedback",
    {
      onMutate: (vars) => {
        setMessages((messages) =>
          messages.map((message) =>
            message.id === vars.params.path.messageId
              ? { ...message, feedback: vars.body?.feedback }
              : message,
          ),
        );
        queryClient.setQueryData(
          $api.queryOptions("get", "/conversations/{conversationId}", {
            params: { path: { conversationId: conversation.id } },
            headers: getHeaders(apiKey),
          }).queryKey,
          (chat: Conversation) =>
            ({
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === vars.params.path.messageId
                  ? ({
                      ...message,
                      feedback: vars.body?.feedback ?? null,
                    } satisfies Message)
                  : message,
              ),
            }) satisfies Conversation,
        );
      },
      onSuccess: (data, vars) => {
        setMessages((messages) =>
          messages.map((message) =>
            message.id === vars.params.path.messageId
              ? { ...message, feedback: data.feedback }
              : message,
          ),
        );
        toast.success("Thank you for your feedback.");
      },
      onError(error) {
        console.error(error);
        toast.error("Failed to send feedback.");
      },
      onSettled: () => {
        refreshConversation();
      },
    },
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      if (!input.trim()) {
        return;
      }

      const context = {
        pageUrl,
      };

      void sendMessage(
        { text: input },
        {
          body: { context },
          headers: getHeaders(apiKey),
        },
      );

      setInput("");
    },
    [apiKey, input, pageUrl, sendMessage],
  );

  const handleFeedback = useCallback(
    (messageId: string, feedback: "like" | "dislike") => {
      const message = allMessages.find((message) => message.id === messageId);
      if (!message) return;

      sendFeedbackMut.mutate({
        params: { path: { messageId } },
        body: {
          feedback: message.feedback === feedback ? null : feedback,
        },
        headers: getHeaders(apiKey),
      });
    },
    [apiKey, allMessages, sendFeedbackMut],
  );

  const handleCloseChat = useCallback(() => {
    if (status === "submitted" || status === "streaming") {
      return;
    }

    closeChatMut.mutate({
      params: { path: { conversationId: conversation.id } },
      headers: getHeaders(apiKey),
    });
  }, [status, apiKey, conversation.id, closeChatMut]);

  const sendInitialMessage = useEffectEvent(() => {
    if (conversation.pendingMessage) {
      void sendMessage(
        {
          id: conversation.pendingMessage.id,
          role: "user",
          parts: [{ type: "text", text: conversation.pendingMessage.content }],
        },
        {
          body: { context: { pageUrl } },
          headers: getHeaders(apiKey),
        },
      );
    }
  });

  // Send the initial pending message
  useEffect(() => {
    sendInitialMessage();
  }, []);

  return (
    <>
      <AppBar
        title={<ChatTitle agent={conversation.humanAgent} />}
        trailing={
          conversation.status === "open" && (
            <>
              <AppBarButton
                onClick={() => navigate(`/?autoFocus=true`)}
                tooltip="New Conversation"
              >
                <MessageCirclePlusIcon />
              </AppBarButton>
              <FullScreenButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={
                      status === "streaming" ||
                      status === "submitted" ||
                      closeChatMut.isPending ||
                      closeChatMut.isSuccess
                    }
                  >
                    <MoreHorizontalIcon className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom">
                  <DropdownMenuItem
                    onClick={() => navigate(`/chats`)}
                    className="cursor-pointer"
                  >
                    <HistoryIcon className="text-popover-foreground" />
                    Conversation History
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowCloseChatWarning(true)}
                    className="cursor-pointer"
                  >
                    <MessageCircleXIcon className="text-popover-foreground" />
                    Close Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )
        }
      />

      {conversation.isHumanHandled && (
        <ConnectonStatus readyState={readyState} />
      )}

      <MessagesView
        messages={allMessages}
        status={status}
        onFeedbackClick={handleFeedback}
        onRegenerateClick={() => regenerate({ headers: getHeaders(apiKey) })}
        isHumanHandled={conversation.isHumanHandled}
      />

      {conversation.status === "closed" ? (
        <div className="bg-card z-50 flex flex-col items-center gap-3 border-t p-4">
          <p className="text-muted-foreground text-center text-sm">
            This conversation has been closed{" "}
            {formatDistanceToNow(
              conversation.closedAt ?? conversation.createdAt,
              { addSuffix: true },
            )}
          </p>
          <Button onClick={() => navigate(`/?autoFocus=true`)}>
            <PlusIcon />
            New Chat
          </Button>
        </div>
      ) : (
        <MessageInputBar
          setInput={setInput}
          onSubmit={handleSubmit}
          input={input}
          error={error}
          status={status}
          autoFocus
          onStop={stop}
        />
      )}

      <AlertDialog
        open={showCloseChatWarning}
        onOpenChange={setShowCloseChatWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this chat? This can not be
              reopenned again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleCloseChat}
            >
              Close Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
