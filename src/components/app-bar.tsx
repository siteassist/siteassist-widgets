import type { ReactNode } from "react";

import SidebarButton from "./sidebar-button";

export default function AppBar({
  title,
  trailing,
  children,
}: {
  title: string | ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="z-50 flex shrink-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-center gap-2 px-3">
        <SidebarButton />
        <div className="min-w-0 flex-1">
          {typeof title === "string" ? (
            <p className="truncate font-semibold">{title}</p>
          ) : (
            title
          )}
        </div>
        <div className="-mr-1 flex min-w-10 shrink-0 items-center justify-end">
          {trailing}
        </div>
      </div>
      {children}
    </div>
  );
}
