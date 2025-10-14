import type { Project, Visitor } from "@/types";
import { createContext, useContext } from "react";

export interface ChatbotContextValue {
  apiKey: string;
  project: Project;
  visitor: Visitor;
  pageUrl?: string | null;
  isOpened: boolean;
  closeWidget: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must use inside ChatbotProvider");
  }
  return context;
};
