import { Sidebar } from "lucide-react";

import AppBarButton from "./app-bar-button";
import { useSidebar } from "./ui/sidebar";

export default function SidebarButton() {
  const { toggleSidebar, isMobile, open } = useSidebar();

  if (!isMobile && open) return null;

  return (
    <AppBarButton onClick={toggleSidebar} tooltip="Open Sidebar">
      <Sidebar />
    </AppBarButton>
  );
}
