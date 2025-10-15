import AppBarButton from "@/components/app-bar-button";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { EditIcon, SidebarIcon, XIcon } from "lucide-react";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                navigate(`/chats/test`);
                setOpenMobile(false);
              }}
              className="cursor-pointer"
              isActive={location.pathname === `/chats/test`}
            >
              <span className="flex-1 truncate">Test</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
