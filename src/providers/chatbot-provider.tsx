import type { Project, Visitor } from "@/types";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOnMessage } from "@/hooks/use-on-message";
import { loadProject, loadVisitor, sendMessageToParent } from "@/utils/helpers";
import z from "zod";

import { ChatbotContext } from "./chatbot-context";
import ProjectProvider from "./project-provider";

export default function ChatbotProvider({
  children,
  apiKey,
}: {
  children: ReactNode;
  apiKey: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [pageUrl, setPageUrl] = useState<string | null>(null);

  const loadProjectAndCustomer = useCallback(async (apiKey: string) => {
    setIsLoaded(false);
    try {
      const project = await loadProject(apiKey);
      setProject(project);

      if (!project) {
        setIsLoaded(true);
        return;
      }

      const visitor = await loadVisitor(apiKey);
      setVisitor(visitor ?? null);
      sendMessageToParent("ready");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadProjectAndCustomer(apiKey);
  }, [apiKey, loadProjectAndCustomer]);

  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    sendMessageToParent("get_page_url");

    const timer = setInterval(() => {
      sendMessageToParent("get_page_url");
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useOnMessage((type, payload) => {
    switch (type) {
      case "page_url": {
        const { success, data } = z.string().url().safeParse(payload);
        if (success) {
          return setPageUrl(data);
        }
      }
    }
  });

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>Project not found!</p>
        <Button
          variant="secondary"
          onClick={() => loadProjectAndCustomer(apiKey)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p>Failed to authenticate</p>
        <Button
          variant="secondary"
          onClick={() => loadProjectAndCustomer(apiKey)}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ChatbotContext.Provider value={{ visitor, project, apiKey, pageUrl }}>
      <ProjectProvider project={project}>{children}</ProjectProvider>
    </ChatbotContext.Provider>
  );
}
