"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TruncatedTextProps {
  children: string;
  className?: string;
  maxLines?: 1 | 2;
}

/**
 * Text component that shows a tooltip only when content is truncated.
 * Detects overflow using scrollWidth/scrollHeight comparison.
 * Keyboard accessible via Tab navigation.
 *
 * @example
 * <TruncatedText className="max-w-[200px]">
 *   This is a very long text that will be truncated
 * </TruncatedText>
 *
 * @example
 * <TruncatedText maxLines={2} className="max-w-[200px]">
 *   Multi-line text that wraps and truncates after two lines
 * </TruncatedText>
 */
function TruncatedText({ children, className, maxLines = 1 }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    if (textRef.current) {
      if (maxLines === 1) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      } else {
        setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    }
  }, [maxLines]);

  useEffect(() => {
    checkTruncation();

    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [children, checkTruncation]);

  const textClasses = cn(
    maxLines === 1 ? "truncate" : "line-clamp-2",
    "block",
    className
  );

  // When not truncated, render plain span without tooltip overhead
  if (!isTruncated) {
    return (
      <span ref={textRef} className={textClasses}>
        {children}
      </span>
    );
  }

  // When truncated, wrap in tooltip with keyboard focus support
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={textRef}
          role="button"
          tabIndex={0}
          className={cn(
            textClasses,
            "cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="max-w-xs break-words">{children}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export { TruncatedText };
export type { TruncatedTextProps };
