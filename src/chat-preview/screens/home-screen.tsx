import { useCallback, useMemo, useState } from "react";
import AppBar from "@/components/app-bar";
import ChatTitle from "@/components/chat-title";
import MessageInputBar from "@/components/message-input-bar";
import MessagesView from "@/components/messages-view";
import { useProject } from "@/providers/project-context";
import { getWelcomeUIMessages } from "@/utils/helpers";
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
      <AppBar title={<ChatTitle />} />

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
