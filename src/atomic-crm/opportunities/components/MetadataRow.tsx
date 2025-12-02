import { cn } from "@/lib/utils";

export interface MetadataRowProps {
  children: React.ReactNode;
  className?: string;
}

export const MetadataRow = ({ children, className }: MetadataRowProps) => (
  <div className={cn("flex gap-8 mb-4", className)}>
    {children}
  </div>
);
