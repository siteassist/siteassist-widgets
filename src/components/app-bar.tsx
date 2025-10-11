import type { ReactNode } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";

import AppBarButton from "./app-bar-button";

export default function AppBar({
  title,
  hideBackButton,
  trailing,
  children,
}: {
  title: string | ReactNode;
  hideBackButton?: boolean;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="z-50 flex shrink-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-center gap-2 px-3">
        {hideBackButton !== true ? (
          <div className="-ml-1">
            <AppBarButton onClick={() => navigate(-1)} tooltip="Back">
              <ChevronLeftIcon />
            </AppBarButton>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {typeof title === "string" ? (
            <p className="truncate font-semibold">{title}</p>
          ) : (
            title
          )}
        </div>
        <div className="-mr-1 flex min-w-10 shrink-0 items-center justify-end gap-1">
          {trailing}
        </div>
      </div>
      {children}
    </div>
  );
}
