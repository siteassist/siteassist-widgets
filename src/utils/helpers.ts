import type { Message, Project } from "@/types";
import type { CustomUIMessage } from "@/types/chat";
import type { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";

import { fetchClient } from "./openapi";

export const makePorojectKey = (apiKey: string) => `sa_project_${apiKey}`;
export const makeVisitorKey = (apiKey: string) => `sa_visitor_${apiKey}`;

export const sendMessageToParent = (type: string, payload?: unknown) => {
  if (window.parent !== window) {
    window.parent.postMessage({ __SA: { type, payload } }, "*");
  }
};


export function pickTextColorYIQ(hex: string) {
  // strip leading “#” and expand shorthand like #09C to #0099CC
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // YIQ perceived brightness
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? "#000000" : "#ffffff";
}

export function getHeaders(apiKey: string): Record<string, string> {
  const sessionToken = getSessionToken(apiKey);

  if (sessionToken) {
    return {
      Authorization: `Bearer ${sessionToken}`,
    };
  }

  return {};
}

export function convertToUIMessage(message: Message): CustomUIMessage {
  return {
    id: message.id,
    parts: message.parts as UIMessage["parts"],
    role: message.role === "user" ? "user" : "assistant",
    assistantType:
      message.role === "human_agent"
        ? "human"
        : message.role === "assistant"
          ? "ai"
          : undefined,
    sentAt: message.createdAt,
    humanAgent: message.humanAgent,
    feedback: message.feedback,
    metadata: message.metadata,
  };
}

export function getWelcomeUIMessages(
  chatWidgetConfig: Project["chatWidgetConfig"],
): CustomUIMessage[] {
  return [
    {
      id: `welcome-message`,
      parts: [{ type: "text", text: chatWidgetConfig.welcomeMessage }],
      role: "assistant",
      assistantType: "ai",
      hideActions: true,
    },
  ];
}

export interface StoredProject {
  storedAt: number;
  project: Project;
}

async function getProjectFromAPI(apiKey: string) {
  const res = await fetchClient.GET("/projects/current", {
    params: { query: { apiKey } },
  });

  return res.data ?? null;
}

export function storeProjectToStorage(apiKey: string, project: Project | null) {
  const key = makePorojectKey(apiKey);
  if (project) {
    const payload: StoredProject = { storedAt: Date.now(), project };
    localStorage.setItem(key, JSON.stringify(payload));
  } else {
    localStorage.removeItem(key);
  }
}

export async function loadProject(apiKey: string): Promise<Project | null> {
  const projectKey = makePorojectKey(apiKey);
  const projectFromStorage = localStorage.getItem(projectKey);

  if (projectFromStorage) {
    const storedProject = JSON.parse(projectFromStorage) as StoredProject;

    // expire after 1 day
    if (Date.now() < storedProject.storedAt + 1000 * 60 * 60 * 24) {
      void getProjectFromAPI(apiKey).then((project) =>
        storeProjectToStorage(apiKey, project),
      );
      return storedProject.project;
    }
  }

  const project = await getProjectFromAPI(apiKey);
  storeProjectToStorage(apiKey, project);

  return project;
}

export function getSessionToken(apiKey: string) {
  return localStorage.getItem(`sa_session_token_${apiKey}`);
}
export function storeSessionToken(apiKey: string, token: string | null) {
  if (token) {
    localStorage.setItem(`sa_session_token_${apiKey}`, token);
  } else {
    return localStorage.removeItem(`sa_session_token_${apiKey}`);
  }
}

export function getOrCreateSaVid(apiKey: string) {
  const key = `sa_vid_${apiKey}`;
  const storedId = localStorage.getItem(key);
  if (storedId) {
    return storedId;
  }
  const saVid = uuidv4();
  localStorage.setItem(key, saVid);
  return saVid;
}

export async function loadVisitor(apiKey: string) {
  const sessionToken = getSessionToken(apiKey);
  if (sessionToken) {
    const res = await fetchClient.GET("/identity/me", {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    if (res.data) {
      return res.data;
    }
  }
  const res = await fetchClient.POST("/identity/init", {
    body: {
      apiKey,
      saVid: getOrCreateSaVid(apiKey),
    },
  });
  if (res.data) {
    storeSessionToken(apiKey, res.data.sessionToken);
  }
  return res.data?.visitor;
}
