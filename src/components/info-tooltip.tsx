"use client";

import { useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Hover shows the description on desktop; radix's own hover/focus handling covers that. The controlled `open` + click toggle makes it also work with a tap on touch devices, which don't fire hover events. */
export function InfoTooltip({ description, children }: { description: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          className="cursor-help underline decoration-dotted underline-offset-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left whitespace-pre-wrap">
        {description}
      </TooltipContent>
    </Tooltip>
  );
}
