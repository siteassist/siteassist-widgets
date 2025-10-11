import type { ComponentProps } from "react";

import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export type ButtonWithTooltipProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const ButtonWithTooltip = ({
  tooltip,
  children,
  label,
  ...props
}: ButtonWithTooltipProps) => {
  const button = (
    <Button {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};
