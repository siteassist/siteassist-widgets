import type { UIMessage } from "ai";


export type UIMessageMetadata = {
  pageContext?: {
    textSelection?: string | null;
    pageTitle?: string | null;
    pageUrl?: string | null;
  };
};

export type CustomUIMessage = UIMessage<UIMessageMetadata> & {
  assistantType?: "ai" | "human";
  humanAgent?: {
    name: string | null;
    image: string | null;
  } | null;
  sentAt?: string;
  feedback?: "like" | "dislike" | null;
  hideActions?: boolean;
  // textSelection?: string | null;
  // pageUrl?: string | null;
  // pageTitle?: string | null;
};
