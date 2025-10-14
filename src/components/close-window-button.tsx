import { useChatbot } from "@/providers/chatbot-context";
import { XIcon } from "lucide-react";

import AppBarButton from "./app-bar-button";

export default function CloseWindowButton() {
  const { isOpened, closeWidget } = useChatbot();

  if (!isOpened) {
    return null;
  }

  return (
    <AppBarButton onClick={closeWidget} tooltip="Close">
      <XIcon />
    </AppBarButton>
  );
}
