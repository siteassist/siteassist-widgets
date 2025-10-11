import type { Conversation, ConversationsResponse } from "@/types";
import { Fragment, useEffect, useMemo, useState } from "react";
import AppBar from "@/components/app-bar";
import AppBarButton from "@/components/app-bar-button";
import ConversationItem from "@/components/conversation-item";
import ConversationStatusFilter from "@/components/conversation-status-filter";
import ScrollArea from "@/components/scrollarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useChatbot } from "@/providers/chatbot-context";
import { getHeaders } from "@/utils/helpers";
import { $api } from "@/utils/openapi";
import {
  ChevronRightIcon,
  MessageCirclePlusIcon,
  PlusIcon,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router";

type ChatStatus = Conversation["status"];

export default function ChatsScreen() {
  const [status, setStatus] = useState<ChatStatus>("open");
  const navigate = useNavigate();

  return (
    <>
      <AppBar
        title="Conversations"
        trailing={
          <AppBarButton
            onClick={() => navigate(`/?autoFocus=true`)}
            tooltip="New Conversation"
          >
            <MessageCirclePlusIcon />
          </AppBarButton>
        }
      >
        <div className="flex flex-col p-2 pt-0">
          <ConversationStatusFilter status={status} setStatus={setStatus} />
        </div>
      </AppBar>
      <MessagesList status={status} />
    </>
  );
}

function MessagesList({ status }: { status: ChatStatus }) {
  const { apiKey } = useChatbot();
  const navigate = useNavigate();
  const [ref, inView] = useInView();

  const messagesQuery = $api.useInfiniteQuery(
    "get",
    "/conversations",
    {
      params: {
        query: {
          status,
          orderBy: "lastInterationAt",
          orderDir: "desc",
          limit: 20,
          offset: 0,
        },
      },
      headers: getHeaders(apiKey),
    },
    {
      pageParamName: "offset",
      initialPageParam: 0,
      getNextPageParam: (lastPage: ConversationsResponse) =>
        lastPage.total > lastPage.offset + lastPage.limit
          ? lastPage.offset + lastPage.limit
          : null,
    },
  );

  const { isFetchingNextPage, hasNextPage, fetchNextPage } = messagesQuery;
  const conversatoins = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [messagesQuery.data?.pages],
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  if (messagesQuery.isPending) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 10 })
          .fill(1)
          .map((_, i) => (
            <Fragment key={i}>
              <MessageLoadingItem />
              {i < 10 && <Separator />}
            </Fragment>
          ))}
      </div>
    );
  }

  if (messagesQuery.isError) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>Something went wrong!</p>
        <Button
          variant="secondary"
          disabled={messagesQuery.isFetching}
          onClick={() => messagesQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if ((messagesQuery.data.pages[0]?.data.length ?? 0) === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>No Conversations</p>
        <Button onClick={() => navigate(`/?autoFocus=true`)}>
          <PlusIcon />
          New Conversation
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea>
      {conversatoins.map((chat, i) => (
        <Fragment key={chat.id}>
          <ConversationItem conversation={chat} />
          {i < conversatoins.length - 1 && <Separator />}
        </Fragment>
      ))}

      <div className="flex h-24 items-center justify-center" ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </ScrollArea>
  );
}

function MessageLoadingItem() {
  return (
    <div className="flex min-h-12 w-full items-center gap-4 px-4 py-2">
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-3 w-[50%]" />
      </div>
      <ChevronRightIcon className="text-muted-foreground size-5" />
    </div>
  );
}
