import type { Conversation } from "@/types";
import { createContext, useContext } from "react";

export const ChatContext = createContext<Conversation | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must use inside ChatProvider");
  }
  return context;
};
