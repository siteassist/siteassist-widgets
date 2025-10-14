import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function AppBarButton({
  children,
  onClick,
  tooltip,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  tooltip?: string;
  label?: string;
  className?: string;
}) {
  const button = (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "cursor-pointer [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
    >
      {children}
      <div className="sr-only">{label || tooltip}</div>
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
