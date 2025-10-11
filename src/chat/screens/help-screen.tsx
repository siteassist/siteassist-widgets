import type { QnAsResponse } from "@/types";
import { Fragment, useEffect, useMemo } from "react";
import AppBar from "@/components/app-bar";
import ScrollArea from "@/components/scrollarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useChatbot } from "@/providers/chatbot-context";
import { getHeaders } from "@/utils/helpers";
import { $api } from "@/utils/openapi";
import { ChevronRightIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router";

export default function ChatHelpScreen() {
  return (
    <>
      <AppBar title="Help" />
      <QnAList />
    </>
  );
}

function QnAList() {
  const { apiKey, project } = useChatbot();
  const [ref, inView] = useInView();

  const qnasQuery = $api.useInfiniteQuery(
    "get",
    "/projects/{projectId}/qnas",
    {
      params: {
        path: {
          projectId: project.id,
        },
        query: {
          limit: 20,
          offset: 0,
        },
      },
      headers: getHeaders(apiKey),
    },
    {
      pageParamName: "offset",
      initialPageParam: 0,
      getNextPageParam: (lastPage: QnAsResponse) =>
        lastPage.total > lastPage.offset + lastPage.limit
          ? lastPage.offset + lastPage.limit
          : null,
    },
  );

  const qnas = useMemo(
    () => qnasQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [qnasQuery.data?.pages],
  );

  const { isFetchingNextPage, hasNextPage, fetchNextPage } = qnasQuery;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  if (qnasQuery.isPending) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 10 })
          .fill(1)
          .map((_, i) => (
            <Fragment key={i}>
              <QnAListLoadingItem />
              {i < 10 && <Separator />}
            </Fragment>
          ))}
      </div>
    );
  }

  if (qnasQuery.isError) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>Something went wrong!</p>
        <Button
          variant="secondary"
          disabled={qnasQuery.isFetching}
          onClick={() => qnasQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if ((qnasQuery.data.pages[0]?.data.length ?? 0) === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>No QnAs</p>
      </div>
    );
  }

  return (
    <ScrollArea>
      {qnas.map((qna, i) => (
        <Fragment key={qna.id}>
          <QnAListItem qna={qna} />
          {i < qnas.length - 1 && <Separator />}
        </Fragment>
      ))}

      <div className="flex h-24 items-center justify-center" ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </ScrollArea>
  );
}

function QnAListItem({ qna }: { qna: QnAsResponse["data"][number] }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/qnas/${qna.id}`)}
      className="hover:bg-secondary/50 flex min-h-12 w-full cursor-pointer items-center gap-4 px-4 py-2 text-left"
    >
      <div className="grid min-w-0 flex-1">
        <p className="truncate font-medium">{qna.question}</p>
      </div>
      <ChevronRightIcon className="text-muted-foreground size-5" />
    </button>
  );
}

function QnAListLoadingItem() {
  return (
    <div className="flex min-h-12 w-full items-center gap-4 px-4 py-2">
      <div className="flex-1">
        <Skeleton className="h-4 w-[80%]" />
      </div>
      <ChevronRightIcon className="text-muted-foreground size-5" />
    </div>
  );
}
