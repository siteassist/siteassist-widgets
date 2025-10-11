import type { Project } from "@/types";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { pickTextColorYIQ } from "@/utils/helpers";
import * as Portal from "@radix-ui/react-portal";

import { ProjectContext } from "./project-context";

export interface ProjectProviderProps {
  project: Project;
  children: ReactNode;
}

export default function ProjectProvider({
  project,
  children,
}: ProjectProviderProps) {
  return (
    <ProjectContext.Provider value={project}>
      <Styles chatWidgetConfig={project.chatWidgetConfig} />
      {children}
    </ProjectContext.Provider>
  );
}

function Styles({
  chatWidgetConfig,
}: {
  chatWidgetConfig: Project["chatWidgetConfig"];
}) {
  const styles = useMemo(() => {
    return `
:root {
  --user-message-bubble: ${chatWidgetConfig.userMessageBubbleColor};
  --user-message-bubble-foreground: ${pickTextColorYIQ(chatWidgetConfig.userMessageBubbleColor)};
  --primary: ${chatWidgetConfig.brandColor};
  --primary-foreground: ${pickTextColorYIQ(chatWidgetConfig.brandColor)};
}
.dark {
  --user-message-bubble: ${chatWidgetConfig.userMessageBubbleColorDark ?? chatWidgetConfig.userMessageBubbleColor};
  --user-message-bubble-foreground: ${pickTextColorYIQ(chatWidgetConfig.userMessageBubbleColorDark ?? chatWidgetConfig.userMessageBubbleColor)};
  --primary: ${chatWidgetConfig.brandColorDark ?? chatWidgetConfig.brandColor};
  --primary-foreground: ${pickTextColorYIQ(chatWidgetConfig.brandColorDark ?? chatWidgetConfig.brandColor)};
}
html {
  font-size: ${chatWidgetConfig.baseFontSize}px;
}

${chatWidgetConfig.customCSSStyles}
    `.trim();
  }, [
    chatWidgetConfig.baseFontSize,
    chatWidgetConfig.brandColor,
    chatWidgetConfig.brandColorDark,
    chatWidgetConfig.customCSSStyles,
    chatWidgetConfig.userMessageBubbleColor,
    chatWidgetConfig.userMessageBubbleColorDark,
  ]);

  return (
    <Portal.Root container={document.head} asChild>
      <style
        id="custom-siteassist-style"
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </Portal.Root>
  );
}
