import { cn } from "@/lib/utils";
import { DETAIL_FIELD_MIN_WIDTH } from "./constants";

export interface MetadataFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const MetadataField = ({ label, children, className }: MetadataFieldProps) => (
  <div className={cn("flex flex-col", DETAIL_FIELD_MIN_WIDTH, className)}>
    <span className="paper-micro-label">{label}</span>
    {children}
  </div>
);
