import { cn } from "@/lib/utils";

interface CompactFormRowProps {
  children: React.ReactNode;
  columns?: string;
  className?: string;
  alignItems?: "start" | "center" | "end";
}

export const CompactFormRow = ({
  children,
  columns,
  className,
  alignItems = "end",
}: CompactFormRowProps) => {
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  }[alignItems];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        columns ?? "md:grid-cols-2",
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
};
