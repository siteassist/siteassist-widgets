import "@/styles/globals.css";

import type { Theme } from "@/providers/theme-context";
import { lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatbotProvider from "@/providers/chatbot-provider";
import ThemeProvider from "@/providers/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";

const ChatRootLayout = lazy(() => import("@/layouts/chat-root-layout"));
const NotFoundScreen = lazy(
  () => import("@/components/screens/not-found-screen"),
);
const ChatScreen = lazy(() => import("./screens/chat-screen"));
const ChatsScreen = lazy(() => import("./screens/chats-screen"));
const HelpScreen = lazy(() => import("./screens/help-screen"));
const ChatHomeScreen = lazy(() => import("./screens/home-screen"));
const QnAScreen = lazy(() => import("./screens/qna-screen"));

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ChatApp />
  </QueryClientProvider>,
);

const router = createMemoryRouter([
  {
    Component: ChatRootLayout,
    children: [
      {
        index: true,
        Component: ChatHomeScreen,
      },
      {
        path: "chats",
        Component: ChatsScreen,
      },
      {
        path: "chats/:chatId",
        Component: ChatScreen,
      },
      {
        path: "qnas",
        Component: HelpScreen,
      },
      {
        path: "qnas/:qnaId",
        Component: QnAScreen,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundScreen,
  },
]);

export default function ChatApp() {
  const [, setAppUserId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const apiKey = searchParams.get("apiKey");
    const appUserId = searchParams.get("externalId");
    const theme = searchParams.get("theme");

    setTheme(theme === "light" ? "light" : theme === "dark" ? "dark" : "auto");
    setAppUserId(appUserId?.trim() || null);
    setApiKey(apiKey);

    if (apiKey) {
      const key = `sa_active_conv_id_${apiKey}`;
      const chatId = localStorage.getItem(key);
      if (chatId) {
        void router.navigate(`/chats/${chatId}`);
      }
    }
  }, []);

  if (!apiKey) {
    return (
      <div className="flex h-screen w-screen flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <TooltipProvider>
        <div className="flex h-screen w-screen flex-col overflow-hidden antialiased">
          <ChatbotProvider apiKey={apiKey}>
            <RouterProvider router={router} />
          </ChatbotProvider>
        </div>
        <Toaster position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
