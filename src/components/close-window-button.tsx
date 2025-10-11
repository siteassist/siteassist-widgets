import { useState } from "react";
import { closeWidget } from "@/utils/helpers";
import { XIcon } from "lucide-react";

import AppBarButton from "./app-bar-button";

export default function CloseWindowButton() {
  const [hasParent] = useState(() => window.parent !== window);

  if (!hasParent) {
    return null;
  }

  return (
    <AppBarButton onClick={closeWidget} tooltip="Close">
      <XIcon />
    </AppBarButton>
  );
}
