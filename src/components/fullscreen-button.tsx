import { useChatbot } from "@/providers/chatbot-context";
import { MaximizeIcon, MinimizeIcon } from "lucide-react";

import AppBarButton from "./app-bar-button";

export default function FullScreenButton() {
  const { isOpened, isFullscreen, toggleFullscreen } = useChatbot();

  if (!isOpened) {
    return null;
  }

  return (
    <AppBarButton
      onClick={toggleFullscreen}
      tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
    >
      {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
    </AppBarButton>
  );
}
