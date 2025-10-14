import { useCallback, useMemo, useState } from "react";
import AppBar from "@/components/app-bar";
import AppBarButton from "@/components/app-bar-button";
import ChatTitle from "@/components/chat-title";
import MessageInputBar from "@/components/message-input-bar";
import MessagesView from "@/components/messages-view";
import { useProject } from "@/providers/project-context";
import { getWelcomeUIMessages } from "@/utils/helpers";
import { HistoryIcon } from "lucide-react";
import { useNavigate } from "react-router";

export default function HomeScreen() {
  const project = useProject();
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const messages = useMemo(
    () => getWelcomeUIMessages(project.chatWidgetConfig),
    [project.chatWidgetConfig],
  );

  const handleSubmit = useCallback(() => {
    void navigate(`/chats/test`);
  }, [navigate]);

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
          </>
        }
      />

      <MessagesView messages={messages} />

      {/* {project.quickPrompts.length > 0 && (
        <div className="mx-auto w-full max-w-screen-lg p-3">
          <Suggestions
            suggestions={project.quickPrompts}
            onSuggestionClick={() => navigate("/chats/test")}
          />
        </div>
      )} */}

      <MessageInputBar
        input={input}
        setInput={setInput}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        status="ready"
      />
    </div>
  );
}
