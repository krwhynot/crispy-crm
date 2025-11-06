import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Header from "./Header";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { Keyboard } from "lucide-react";
import { KeyboardShortcutsProvider } from "@/providers/KeyboardShortcutsProvider";

export const Layout = ({ children }: { children: ReactNode }) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <KeyboardShortcutsProvider>
      <Header />
      <main className="max-w-screen-xl mx-auto pt-4 px-4 pb-16" id="main-content">
        <ErrorBoundary FallbackComponent={Error}>
          <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} MFB Master Food Brokers. All rights reserved.</p>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              aria-label="View keyboard shortcuts"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Keyboard shortcuts</span>
            </button>
          </div>
        </div>
      </footer>
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <Notification />
    </KeyboardShortcutsProvider>
  );
};
