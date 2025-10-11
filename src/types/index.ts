/* eslint-disable @typescript-eslint/no-explicit-any */

import type { paths } from "./chat-api.gen";

export type Project =
  paths["/projects/current"]["get"]["responses"]["200"]["content"]["application/json"];

export type Visitor =
  paths["/identity/me"]["get"]["responses"]["200"]["content"]["application/json"];

export type ConversationsResponse =
  paths["/conversations"]["get"]["responses"]["200"]["content"]["application/json"];

export type Message =
  paths["/conversations/{conversationId}"]["get"]["responses"]["200"]["content"]["application/json"]["messages"][number];

export type Conversation =
  paths["/conversations/{conversationId}"]["get"]["responses"]["200"]["content"]["application/json"] & {
    pendingMessage?: {
      id: string;
      content: string;
    };
  };

export type QnAsResponse =
  paths["/projects/{projectId}/qnas"]["get"]["responses"]["200"]["content"]["application/json"];

export type QnA =
  paths["/projects/{projectId}/qnas/{qnaId}"]["get"]["responses"]["200"]["content"]["application/json"];

export interface WidgetMessage {
  type: "open" | "close" | "identify" | "focus" | "track";
  payload?: any; // Any additional data passed with the message
}
