import type { ChatStatus } from "@/components/conversation-status-filter";
import type { ConversationsResponse } from "@/types";
import { Fragment, useState } from "react";
import AppBar from "@/components/app-bar";
import AppBarButton from "@/components/app-bar-button";
import ConversationItem from "@/components/conversation-item";
import ConversationStatusFilter from "@/components/conversation-status-filter";
import ScrollArea from "@/components/scrollarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquarePlusIcon } from "lucide-react";
import { useNavigate } from "react-router";

export default function ChatsScreen() {
  const [status, setStatus] = useState<ChatStatus>("open");

  const navigate = useNavigate();

  return (
    <>
      <AppBar
        title="Messages"
        trailing={
          <AppBarButton
            onClick={() => navigate(`/?autoFocus=true`)}
            tooltip="New Chat"
          >
            <MessageSquarePlusIcon />
          </AppBarButton>
        }
      >
        <div className="flex flex-col p-2 pt-0">
          <ConversationStatusFilter status={status} setStatus={setStatus} />
        </div>
      </AppBar>
      <MessagesList />
    </>
  );
}

const EXAMPLE_CONVERSATIONS: ConversationsResponse["data"] = [
  {
    object: "conversation",
    id: "54faad88-ac27-4c64-953b-5fea1fc796cf",
    closedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "open",
    closeReason: null,
    humanAgent: null,
    isHumanHandled: false,
    lastInterationAt: new Date().toISOString(),
    lastMessage: {
      object: "message",
      id: "978f5d62-80f4-47fe-9357-c7726923c04f",
      createdAt: "2025-08-19T09:29:41.469Z",
      parts: [
        {
          text: "Absolutely! You can fully customize colors, fonts, avatar, and even tone of voice so it feels 100% native to your website. 🎨",
          type: "text",
        },
      ],
      chatId: "a9e1d8ba-6bd5-4ac5-a6ac-5fa58abe8095",
      role: "assistant",
      feedback: null,
      feedbackAt: null,
      status: "complete",
      error: null,
      metadata: null,
      humanAgent: null,
    },
  },
];

function MessagesList() {
  return (
    <ScrollArea>
      {EXAMPLE_CONVERSATIONS.map((chat, i) => (
        <Fragment key={chat.id}>
          <ConversationItem conversation={chat} />
          {i < EXAMPLE_CONVERSATIONS.length - 1 && <Separator />}
        </Fragment>
      ))}
    </ScrollArea>
  );
}
