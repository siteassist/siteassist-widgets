import type { ForwardedRef, ReactNode } from "react";
import * as SA from "@radix-ui/react-scroll-area";

export default function ScrollArea({
  children,
  ref,
}: {
  ref?: ForwardedRef<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <SA.Root
      type="auto"
      className="group/scroll-root relative -mb-6 flex-1 overflow-hidden"
    >
      <SA.Viewport ref={ref} className="size-full min-w-0">
        {children}
      </SA.Viewport>
      <SA.Scrollbar
        orientation="vertical"
        className="flex w-3 touch-none p-0.5 select-none"
      >
        <SA.Thumb className="bg-border group-hover/scroll-root:bg-foreground/20 relative flex-1 rounded-full transition-colors before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2" />
      </SA.Scrollbar>
    </SA.Root>
  );
}
