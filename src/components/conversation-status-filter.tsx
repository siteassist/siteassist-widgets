import type { Conversation } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChatStatus = Conversation["status"];

const statuses: { value: ChatStatus; name: string }[] = [
  { value: "open", name: "Open" },
  { value: "closed", name: "Closed" },
];

export default function ConversationStatusFilter({
  setStatus,
  status,
}: {
  status: ChatStatus;
  setStatus: (value: ChatStatus) => void;
}) {
  return (
    <div className="bg-secondary dark:bg-secondary/50 flex rounded-lg p-1">
      {statuses.map((s) => (
        <Button
          key={s.value}
          onClick={() => setStatus(s.value)}
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground flex-1 bg-transparent dark:bg-transparent dark:hover:bg-transparent",
            {
              "bg-card! text-card-foreground ring-foreground/10 hover:bg-card! hover:text-card-foreground shadow ring-1":
                status === s.value,
            },
          )}
        >
          {s.name}
        </Button>
      ))}
    </div>
  );
}
