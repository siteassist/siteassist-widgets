import AppBar from "@/components/app-bar";
import ScrollArea from "@/components/scrollarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatbot } from "@/providers/chatbot-context";
import { useTheme } from "@/providers/theme-context";
import { getHeaders } from "@/utils/helpers";
import { api } from "@/utils/openapi";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { formatDistanceToNow } from "date-fns";
import { UserIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Streamdown } from "streamdown";

export default function QnAScreen() {
  const navigate = useNavigate();
  const { apiKey, project } = useChatbot();
  const { qnaId } = useParams<{ qnaId: string }>();
  const qnaQuery = api.useQuery("get", "/projects/{projectId}/qnas/{qnaId}", {
    params: { path: { qnaId: qnaId ?? "", projectId: project.id } },
    headers: getHeaders(apiKey),
  });
  const theme = useTheme();

  if (qnaQuery.isPending) {
    return (
      <>
        <AppBar title={<Skeleton className="mx-auto h-6 w-[60%]" />} />
        <ScrollArea>
          <div className="mx-auto w-full max-w-screen-md p-4">
            <Skeleton className="h-6 w-[40%]" />

            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 gap-2 space-y-2">
                <Skeleton className="h-4 w-[40%]" />
                <Skeleton className="h-3 w-[60%]" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[85%]" />
            </div>
          </div>
        </ScrollArea>
      </>
    );
  }

  if (qnaQuery.isError) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>QnA not found!</p>
        <Button variant="secondary" onClick={() => navigate("/qnas")}>
          Return to Help
        </Button>
      </div>
    );
  }

  return (
    <>
      <AppBar title={qnaQuery.data.question} />
      <ScrollArea>
        <div className="mx-auto w-full max-w-screen-md p-4">
          <h1 className="text-2xl font-semibold">{qnaQuery.data.question}</h1>
          {qnaQuery.data.createdBy?.name ? (
            <div className="mt-4 flex items-center gap-2">
              <AvatarPrimitive.Root className="bg-secondary inline-flex size-10 overflow-hidden rounded-full select-none">
                {qnaQuery.data.createdBy.image && (
                  <AvatarPrimitive.Image
                    src={qnaQuery.data.createdBy.image}
                    className="size-full rounded-[inherit] object-cover"
                  />
                )}
                <AvatarPrimitive.Fallback className="flex size-full items-center justify-center">
                  <UserIcon className="text-muted-foreground size-5" />
                </AvatarPrimitive.Fallback>
              </AvatarPrimitive.Root>
              <div className="space-y-0.1 min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-sm">
                  Written by {qnaQuery.data.createdBy.name}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  Last updated{" "}
                  {formatDistanceToNow(qnaQuery.data.updatedAt, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground truncate text-sm">
              Last updated{" "}
              {formatDistanceToNow(qnaQuery.data.updatedAt, {
                addSuffix: true,
              })}
            </p>
          )}

          <div className="mt-6">
            <Streamdown
              key={theme.isDark ? "dark" : "light"}
              shikiTheme={[
                theme.isDark ? "github-dark" : "github-light",
                theme.isDark ? "github-dark" : "github-light",
              ]}
              className="[&_.shiki]:bg-secondary!"
            >
              {qnaQuery.data.answer}
            </Streamdown>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
