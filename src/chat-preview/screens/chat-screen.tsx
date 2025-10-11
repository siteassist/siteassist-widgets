import type { Message } from "@/types";
import type { CustomUIMessage } from "@/types/chat";
import { useMemo, useState } from "react";
import AppBar from "@/components/app-bar";
import ChatTitle from "@/components/chat-title";
import MessageInputBar from "@/components/message-input-bar";
import MessagesView from "@/components/messages-view";
import { useProject } from "@/providers/project-context";
import { convertToUIMessage, getWelcomeUIMessages } from "@/utils/helpers";
import { toast } from "sonner";

const EXAMPLE_MESSAGES: Message[] = [
  {
    object: "message",
    id: "46faad88-ac27-4c64-953b-5fea1fc796cf",
    createdAt: "2025-08-19T09:29:41.425Z",
    parts: [
      {
        text: "Can I customize the assistant to match my brand?",
        type: "text",
      },
    ],
    chatId: "a9e1d8ba-6bd5-4ac5-a6ac-5fa58abe8095",
    role: "user",
    feedback: null,
    feedbackAt: null,
    status: null,
    error: null,
    metadata: null,
    humanAgent: null,
  },
  {
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
];

const uiMessages = EXAMPLE_MESSAGES.map(convertToUIMessage);

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const project = useProject();

  const messages = useMemo(
    (): CustomUIMessage[] => [
      ...getWelcomeUIMessages(project.chatWidgetConfig),
      ...uiMessages,
    ],
    [project.chatWidgetConfig],
  );

  return (
    <>
      <AppBar title={<ChatTitle />} />
      <MessagesView
        messages={messages}
        onFeedbackClick={() => {
          toast.info("Can not send feedback in preview environment.");
        }}
      />
      <MessageInputBar
        setInput={setInput}
        input={input}
        onSubmit={(e) => {
          e.preventDefault();
          setInput("");
          toast.info("Can not send message in preview environment.");
        }}
      />
    </>
  );
}
