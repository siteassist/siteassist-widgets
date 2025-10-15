import { APP_URL } from "@/utils/constants";

export function SiteAssistBranding() {
  return (
    <div className="z-[99999] px-2 pt-0.5 pb-2">
      <p className="text-muted-foreground text-center text-sm">
        Powered by{" "}
        <a
          href={APP_URL}
          target="_blank"
          className="text-primary font-medium underline-offset-2 hover:underline"
          rel="noopener noreferrer"
        >
          SiteAssist
        </a>
      </p>
    </div>
  );
}
