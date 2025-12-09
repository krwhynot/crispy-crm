import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface KPIDrillDownProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function KPIDrillDown({ open, onClose, title, description, children }: KPIDrillDownProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl [&>button]:h-11 [&>button]:w-11"
        data-focus-trap="true"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description || "View detailed information"}</SheetDescription>
        </SheetHeader>
        <div className="mt-section space-y-content overflow-y-auto max-h-[calc(100vh-8rem)]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
