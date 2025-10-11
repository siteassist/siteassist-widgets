import { useMemo } from "react";
import { useProject } from "@/providers/project-context";
import { useTheme } from "@/providers/theme-context";
import Color from "color";

export const useWidgetCSSVariables = (): [string, string][] => {
  const project = useProject();
  const { isDark } = useTheme();

  const brandColor = useMemo(() => {
    if (isDark) {
      return Color(
        project.chatWidgetConfig.brandColorDark ??
          project.chatWidgetConfig.brandColor,
      );
    }
    return Color(project.chatWidgetConfig.brandColor);
  }, [
    isDark,
    project.chatWidgetConfig.brandColor,
    project.chatWidgetConfig.brandColorDark,
  ]);

  const userMessageBubbleColor = useMemo(() => {
    if (isDark) {
      return Color(
        project.chatWidgetConfig.userMessageBubbleColorDark ??
          project.chatWidgetConfig.userMessageBubbleColor,
      );
    }
    return Color(project.chatWidgetConfig.userMessageBubbleColor);
  }, [
    isDark,
    project.chatWidgetConfig.userMessageBubbleColor,
    project.chatWidgetConfig.userMessageBubbleColorDark,
  ]);

  const brandForegroundColor = useMemo(() => {
    if (brandColor.isDark()) {
      return "#ffffff";
    }
    return "#000000";
  }, [brandColor]);

  const userMessageBubbleForegroundColor = useMemo(() => {
    if (userMessageBubbleColor.isDark()) {
      return "#ffffff";
    }
    return "#000000";
  }, [userMessageBubbleColor]);

  return [
    ["--primary", brandColor.hex()],
    ["--primary-foreground", brandForegroundColor],
    ["--user-message-bubble", userMessageBubbleColor.hex()],
    ["--user-message-bubble-foreground", userMessageBubbleForegroundColor],
  ];
};
