import { useProject } from "@/providers/project-context";

export default function ChatTitle({
  agent,
}: {
  agent?: { name: string | null; image: string | null } | null;
}) {
  const project = useProject();
  return (
    <div className="flex items-center gap-2">
      {project.chatWidgetConfig.assistantAvatar && (
        <img
          src={agent?.image || project.chatWidgetConfig.assistantAvatar}
          className="size-8 shrink-0 overflow-hidden rounded-full object-cover"
        />
      )}
      <div className="min-w-0 space-y-1">
        <p className="truncate leading-none font-semibold">
          {agent
            ? (agent.name ?? "Human Agent")
            : (project.chatWidgetConfig.displayName ?? project.name)}
        </p>
        {agent && (
          <p className="text-muted-foreground truncate text-xs leading-none">
            Human Agent
          </p>
        )}
      </div>
    </div>
  );
}
