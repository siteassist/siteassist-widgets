import type { ConversationsResponse } from "@/types";
import { useEffect } from "react";
import AppBarButton from "@/components/app-bar-button";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useChatbot } from "@/providers/chatbot-context";
import { getHeaders } from "@/utils/helpers";
import { $api } from "@/utils/openapi";
import { EditIcon, SidebarIcon, XIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useLocation, useNavigate } from "react-router";

export default function ChatSidebar() {
  const navigate = useNavigate();
  const { setOpenMobile, setOpen, isMobile } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-end">
          {isMobile ? (
            <AppBarButton
              tooltip="Close Sidebar"
              onClick={() => setOpenMobile(false)}
              className="text-muted-foreground"
            >
              <XIcon className="size-5" />
            </AppBarButton>
          ) : (
            <AppBarButton
              tooltip="Close Sidebar"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              <SidebarIcon className="size-5" />
            </AppBarButton>
          )}
        </div>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  navigate("/?autoFocus=true");
                  setOpenMobile(false);
                }}
                className="cursor-pointer"
                isActive={location.pathname === "/"}
              >
                <EditIcon />
                <span>New Conversation</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <Conversations />
      </SidebarContent>
    </Sidebar>
  );
}

function Conversations() {
  const { apiKey } = useChatbot();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const [ref, inView] = useInView();

  const conversationsQuery = $api.useInfiniteQuery(
    "get",
    "/conversations",
    {
      params: {
        query: {
          orderBy: "lastInteractionAt",
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

  const { isFetchingNextPage, hasNextPage, fetchNextPage } = conversationsQuery;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      <SidebarGroupContent>
        {conversationsQuery.isPending ? (
          <SidebarMenu>
            {Array.from({ length: 20 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : conversationsQuery.isError ? (
          <div className="flex flex-col items-center p-2">
            <p className="text-muted-foreground text-sm">
              Something went wrong!
            </p>
            <Button
              variant="secondary"
              onClick={() => conversationsQuery.refetch()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : (conversationsQuery.data.pages[0]?.data.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center p-2">
            <p className="text-muted-foreground text-sm">No conversations</p>
          </div>
        ) : (
          <SidebarMenu>
            {conversationsQuery.data.pages.map((page) =>
              page.data.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <SidebarMenuButton
                    onClick={() => {
                      navigate(`/chats/${conversation.id}`);
                      setOpenMobile(false);
                    }}
                    className="cursor-pointer"
                    isActive={location.pathname === `/chats/${conversation.id}`}
                  >
                    <span className="flex-1 truncate">
                      {conversation.title || (
                        <span className="text-muted-foreground">
                          Untitled Chat
                        </span>
                      )}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )),
            )}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
      <div className="flex h-24 items-center justify-center" ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </SidebarGroup>
  );
}
