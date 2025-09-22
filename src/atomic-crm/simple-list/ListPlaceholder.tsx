import { cn } from "@/lib/utils.ts";

interface ListPlaceholderProps {
  className?: string;
}

export const ListPlaceholder = ({ className }: ListPlaceholderProps) => {
  return <span className={cn("bg-loading-pulse flex", className)}>&nbsp;</span>;
};
