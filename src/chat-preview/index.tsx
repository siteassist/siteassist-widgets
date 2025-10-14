import "@/styles/globals.css";

import type { Theme } from "@/providers/theme-context";
import type { Project } from "@/types";
import { useEffect, useState } from "react";
import NotFoundScreen from "@/components/screens/not-found-screen";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useOnMessage } from "@/hooks/use-on-message";
import ProjectProvider from "@/providers/project-provider";
import ThemeProvider from "@/providers/theme-provider";
import { sendMessageToParent } from "@/utils/helpers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";

import ChatRootLayout from "./layouts/chat-root-layout";
import ChatScreen from "./screens/chat-screen";
import HomeScreen from "./screens/home-screen";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ChatPreviewApp />
  </QueryClientProvider>,
);

const router = createMemoryRouter([
  {
    Component: ChatRootLayout,
    children: [
      {
        index: true,
        Component: HomeScreen,
      },
      {
        path: "chats/:chatId",
        Component: ChatScreen,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundScreen,
  },
]);

export default function ChatPreviewApp() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [project, setProject] = useState<Project | null>(null);

  useOnMessage((type, payload) => {
    if (type === "preview-project" && payload) {
      setProject(payload as Project);
    }
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const theme = searchParams.get("theme");

    setTheme(theme === "light" ? "light" : theme === "dark" ? "dark" : "auto");

    void router.navigate("/chats/test");
  }, []);

  useEffect(() => {
    sendMessageToParent("ready");
  }, []);

  if (!project) {
    return (
      <div className="flex h-screen w-screen flex-1 items-center justify-center antialiased">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden antialiased">
      <ThemeProvider theme={theme}>
        <TooltipProvider>
          <ProjectProvider project={project}>
            <RouterProvider router={router} />
          </ProjectProvider>
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>

      <div className="pointer-events-none fixed top-6 -right-26 z-50 flex h-4 w-32 origin-center -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center bg-red-500 text-sm font-medium text-white">
        <p>Preview</p>
      </div>
    </div>
  );
}
