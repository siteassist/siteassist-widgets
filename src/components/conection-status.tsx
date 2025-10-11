import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { ReadyState } from "react-use-websocket";

export default function ConnectonStatus({
  readyState,
}: {
  readyState: ReadyState;
}) {
  const connectionString = {
    [ReadyState.CLOSED]: "Disconnected",
    [ReadyState.CLOSING]: "Disconnecting",
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const connectionIcon = () => {
    switch (readyState) {
      case ReadyState.CLOSED:
      case ReadyState.UNINSTANTIATED:
        return <XIcon className="size-4" />;
      case ReadyState.OPEN:
        return <CheckIcon className="size-4" />;
      case ReadyState.CLOSING:
      case ReadyState.CONNECTING:
        return <Loader2Icon className="size-4 animate-spin" />;
    }
  };

  if (readyState === ReadyState.OPEN || readyState === ReadyState.CLOSED) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-card flex items-center justify-center gap-2 border-b py-1",
        {
          "bg-destructive text-destructive-foreground":
            readyState === ReadyState.UNINSTANTIATED,
        },
      )}
    >
      {connectionIcon()}
      <p className="text-center text-sm font-medium">{connectionString}</p>
    </div>
  );
}
