import type { UIMessage } from "ai";

export type CustomUIMessage = UIMessage & {
  assistantType?: "ai" | "human";
  humanAgent?: {
    name: string | null;
    image: string | null;
  } | null;
  sentAt?: string;
  feedback?: "like" | "dislike" | null;
  hideActions?: boolean;
};
