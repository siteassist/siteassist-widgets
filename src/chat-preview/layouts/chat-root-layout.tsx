import { SiteAssistBranding } from "@/components/siteassist-branding";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";

import ChatSidebar from "./chat-sidebar";

export default function ChatRootLayout() {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <div className="relative flex h-svh w-svw flex-col overflow-hidden antialiased">
        <div className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
        <SiteAssistBranding />
      </div>
    </SidebarProvider>
  );
}
