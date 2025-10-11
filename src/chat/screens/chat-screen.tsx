import type { Conversation, Message } from "@/types";
import type { CustomUIMessage } from "@/types/chat";
import type { TextPart } from "ai";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { ChatContext, useChat } from "@/providers/chat-context";
import { useChatbot } from "@/providers/chatbot-context";
import { useProject } from "@/providers/project-context";
import { API_URL } from "@/utils/constants";
import {
  convertToUIMessage,
  getHeaders,
  getWelcomeUIMessages,
} from "@/utils/helpers";
import { api } from "@/utils/openapi";
import { useChat as useAIChat } from "@ai-sdk/react";
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
import { useNavigate, useParams } from "react-router";
import useWebSocket from "react-use-websocket";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function ChatScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  if (!chatId) {
    throw new Error("chatId not found in params!");
  }
  const navigate = useNavigate();

  const { apiKey } = useChatbot();
  const chatQuery = api.useQuery(
    "get",
    "/conversations/{conversationId}",
    {
      params: { path: { conversationId: chatId } },
      headers: getHeaders(apiKey),
    },
    {
      retry: false,
      refetchInterval: false,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    const key = `sa_active_conv_id_${apiKey}`;

    if (chatQuery.isSuccess) {
      localStorage.setItem(key, chatId);
    }

    return () => {
      localStorage.removeItem(key);
    };
  }, [apiKey, chatId, chatQuery.isSuccess]);

  if (chatQuery.isPending) {
    return (
      <>
        <AppBar title={<ChatTitle />} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  if (!chatQuery.data) {
    return (
      <>
        <AppBar title={<ChatTitle />} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-center">
            Conversation not found!
          </p>
          <Button onClick={() => navigate("/?autoFocus=true")}>
            Start New Conversation
          </Button>
        </div>
      </>
    );
  }

  return (
    <ChatContext.Provider value={chatQuery.data}>
      <InnerChat />
    </ChatContext.Provider>
  );
}

function InnerChat() {
  const [showCloseChatWarning, setShowCloseChatWarning] = useState(false);
  const { apiKey, pageUrl } = useChatbot();
  const project = useProject();
  const chat = useChat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const startedRef = useRef<boolean>(false);
  const lastMessageTime = useRef<number>(Date.now());

  const refreshConversation = () => {
    void queryClient.invalidateQueries(
      api.queryOptions("get", "/conversations/{conversationId}", {
        params: { path: { conversationId: chat.id } },
      }),
    );
  };

  const aiChat = useAIChat<CustomUIMessage>({
    id: chat.id,
    experimental_throttle: 50,
    generateId: () => uuidv4(),
    messages: chat.messages.map(convertToUIMessage),
    transport: new DefaultChatTransport({
      api: `${API_URL}/v2/conversations/${chat.id}/messages`,
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

  const { readyState } = useWebSocket(
    `${API_URL}/v2/conversations/${chat.id}/ws?apiKey=${apiKey}`,
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
        lastMessageTime.current = Date.now();
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
              aiChat.setMessages((messages) => {
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

  const sendMessageMut = api.useMutation(
    "post",
    "/conversations/{conversationId}/messages",
    {
      onMutate: (vars) => {
        queryClient.setQueryData(
          api.queryOptions("get", "/conversations/{conversationId}", {
            params: { path: { conversationId: chat.id } },
            headers: getHeaders(apiKey),
          }).queryKey,
          (chat: Conversation) =>
            ({
              ...chat,
              messages: [
                ...chat.messages,
                {
                  object: "message",
                  id: uuidv4(),
                  role: "user",
                  parts: [{ type: "text", text: vars.body?.content ?? "" }],
                  chatId: vars.params.path.conversationId,
                  createdAt: new Date().toISOString(),
                  error: null,
                  feedback: null,
                  feedbackAt: null,
                  humanAgent: null,
                  metadata: null,
                  status: "complete",
                },
              ],
            }) satisfies Conversation,
        );
      },
    },
  );

  const closeChatMut = api.useMutation(
    "post",
    "/conversations/{conversationId}/close",
    {
      onSuccess: () => {
        refreshConversation();
        void queryClient.invalidateQueries(
          api.queryOptions("get", "/conversations", {}),
        );
        void navigate("/", { replace: true });
        toast.success("Conversation closed.");
      },
      onError: (error) => {
        console.log(error);
        toast.error("Failed to close conversation.");
      },
    },
  );

  const sendFeedbackMut = api.useMutation(
    "post",
    "/messages/{messageId}/feedback",
    {
      onMutate: (vars) => {
        aiChat.setMessages((messages) =>
          messages.map((message) =>
            message.id === vars.params.path.messageId
              ? { ...message, feedback: vars.body?.feedback }
              : message,
          ),
        );
        queryClient.setQueryData(
          api.queryOptions("get", "/conversations/{conversationId}", {
            params: { path: { conversationId: chat.id } },
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
        aiChat.setMessages((messages) =>
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

  const allMessages = useMemo(
    () => [
      ...getWelcomeUIMessages(project.chatWidgetConfig),
      ...(chat.isHumanHandled
        ? chat.messages.map(convertToUIMessage)
        : aiChat.messages),
    ],
    [
      chat.isHumanHandled,
      chat.messages,
      aiChat.messages,
      project.chatWidgetConfig,
    ],
  );

  const handleCloseChat = useCallback(() => {
    if (aiChat.status === "submitted" || aiChat.status === "streaming") {
      return;
    }

    closeChatMut.mutate({
      params: {
        path: { conversationId: chat.id },
      },
      headers: getHeaders(apiKey),
    });
  }, [aiChat.status, apiKey, chat.id, closeChatMut]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim()) {
        return;
      }

      const context = {
        pageUrl,
      };

      if (chat.isHumanHandled) {
        // send it manually
        sendMessageMut.mutate({
          params: { path: { conversationId: chat.id } },
          headers: getHeaders(apiKey),
          body: {
            content: input,
            context,
          },
        });
      } else {
        // Let useChat Send it.
        void aiChat.sendMessage(
          { text: input },
          {
            body: {
              context,
            },
            headers: getHeaders(apiKey),
          },
        );
      }
      setInput("");
    },
    [
      aiChat,
      apiKey,
      chat.id,
      chat.isHumanHandled,
      input,
      pageUrl,
      sendMessageMut,
    ],
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

  // Check if inital message is pending
  useEffect(() => {
    if (!chat.pendingMessage) return;
    if (startedRef.current) return;
    startedRef.current = true;
    console.log("Send Initial Message");

    aiChat.setMessages([]);

    void aiChat.sendMessage(
      {
        id: chat.pendingMessage.id,
        role: "user",
        parts: [{ type: "text", text: chat.pendingMessage.content }],
      },
      {
        body: { context: { pageUrl } },
        headers: getHeaders(apiKey),
      },
    );
  }, [aiChat, apiKey, chat.pendingMessage, pageUrl]);

  return (
    <>
      <AppBar
        title={<ChatTitle agent={chat.humanAgent} />}
        trailing={
          chat.status === "closed" ? null : (
            <>
              <AppBarButton
                onClick={() => navigate(`/?autoFocus=true`)}
                tooltip="New Conversation"
              >
                <MessageCirclePlusIcon />
              </AppBarButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={
                      aiChat.status === "streaming" ||
                      aiChat.status === "submitted" ||
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

      {chat.isHumanHandled && <ConnectonStatus readyState={readyState} />}

      <MessagesView
        messages={allMessages}
        status={aiChat.status}
        onFeedbackClick={handleFeedback}
        onRegenerateClick={() =>
          aiChat.regenerate({ headers: getHeaders(apiKey) })
        }
      />

      {chat.status === "closed" ? (
        <div className="bg-card z-50 flex flex-col items-center gap-3 border-t p-4">
          <p className="text-muted-foreground text-center text-sm">
            This conversation has been closed{" "}
            {formatDistanceToNow(chat.closedAt ?? chat.createdAt, {
              addSuffix: true,
            })}
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
          error={aiChat.error}
          status={aiChat.status}
          autoFocus
          onStop={aiChat.stop}
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
