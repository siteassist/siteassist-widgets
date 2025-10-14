import type { Project, Visitor } from "@/types";
import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext } from "react";
import z from "zod";

export const pageContextSchema = z.object({
  url: z.string().url().nullish(),
  title: z.string().nullish(),
  content: z.string().nullish(),
  textSelection: z.string().nullish(),
});

export type PageContext = z.infer<typeof pageContextSchema>;

export interface ChatbotContextValue {
  apiKey: string;
  project: Project;
  visitor: Visitor;
  pageUrl?: string | null;
  isOpened: boolean;
  closeWidget: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  pageContext: PageContext | null;
  setPageContext: Dispatch<SetStateAction<PageContext | null>>;
}

export const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must use inside ChatbotProvider");
  }
  return context;
};
