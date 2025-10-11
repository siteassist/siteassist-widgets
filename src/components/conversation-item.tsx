import type { ConversationsResponse } from "@/types";
import { useProject } from "@/providers/project-context";
import { formatDistanceToNow } from "date-fns";
import { ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router";

export default function ConversationItem({
  conversation,
}: {
  conversation: ConversationsResponse["data"][number];
}) {
  const project = useProject();
  const navigate = useNavigate();

  return (
    <button
      key={conversation.id}
      onClick={() => navigate(`/chats/${conversation.id}`)}
      className="hover:bg-secondary/50 flex min-h-12 w-full cursor-pointer items-center gap-4 px-4 py-2 text-left"
    >
      <div className="grid min-w-0 flex-1">
        <p className="truncate font-medium">
          {conversation.lastMessage?.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(" ") || conversation.id}
        </p>
        <div className="text-muted-foreground mt-0.5 truncate text-sm">
          {conversation.lastMessage && (
            <>
              <span>
                {conversation.lastMessage.role === "user"
                  ? "You"
                  : (project.chatWidgetConfig.displayName ?? project.name)}
              </span>
              {" • "}
            </>
          )}
          <span>
            {formatDistanceToNow(conversation.createdAt, { addSuffix: true })}
          </span>
        </div>
      </div>
      <ChevronRightIcon className="text-muted-foreground size-5" />
    </button>
  );
}
