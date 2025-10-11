import { APP_URL } from "@/utils/constants";
import { Outlet } from "react-router";

export default function ChatRootLayout() {
  return (
    <div className="bg-background text-foreground relative flex h-svh w-svw flex-col overflow-hidden antialiased">
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
      <SiteAssistBranding />
    </div>
  );
}

function SiteAssistBranding() {
  return (
    <div className="z-[99999] px-2 pt-0.5 pb-2">
      <p className="text-muted-foreground text-center text-sm">
        Powered by{" "}
        <a
          href={APP_URL}
          target="_blank"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          SiteAssist
        </a>
      </p>
    </div>
  );
}
