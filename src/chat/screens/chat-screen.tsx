import { useEffect } from "react";
import AppBar from "@/components/app-bar";
import ChatTitle from "@/components/chat-title";
import ConversationView from "@/components/conversation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatbot } from "@/providers/chatbot-context";
import { getHeaders } from "@/utils/helpers";
import { $api } from "@/utils/openapi";
import { useNavigate, useParams } from "react-router";

export default function ChatScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  if (!chatId) {
    throw new Error("chatId not found in params!");
  }
  const { apiKey } = useChatbot();
  const navigate = useNavigate();

  const conversationQuery = $api.useQuery(
    "get",
    "/conversations/{conversationId}",
    {
      params: { path: { conversationId: chatId } },
      headers: getHeaders(apiKey),
    },
  );

  useEffect(() => {
    const key = `sa_active_conv_id_${apiKey}`;

    if (
      conversationQuery.isSuccess &&
      conversationQuery.data.status === "open"
    ) {
      localStorage.setItem(key, chatId);
    }

    return () => {
      localStorage.removeItem(key);
    };
  }, [
    apiKey,
    chatId,
    conversationQuery.data?.status,
    conversationQuery.isSuccess,
  ]);

  if (conversationQuery.isPending) {
    return (
      <>
        <AppBar title={<ChatTitle />} />
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  if (!conversationQuery.data) {
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

  return <ConversationView conversation={conversationQuery.data} />;
}
