import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Header from "./Header";
import { TutorialProvider } from "../tutorial/TutorialProvider";

/**
 * Root layout component for the CRM application.
 *
 * Keyboard shortcuts are now handled at the component level:
 * - List views: useListKeyboardNavigation hook (Arrow keys, Enter, Cmd+N, Cmd+K)
 * - Slide-overs: useSlideOverState hook (ESC to close)
 * - Toolbar: KeyboardShortcutHints component (tooltip showing available shortcuts)
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  const handleSkipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
    }
  };

  return (
    <TutorialProvider>
      <a
        href="#main-content"
        onClick={handleSkipToContent}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Header />
      <main className="max-w-screen-xl mx-auto pt-4 px-4 pb-16" id="main-content" tabIndex={-1}>
        <ErrorBoundary FallbackComponent={Error}>
          <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-foreground">
            <p>© {new Date().getFullYear()} MFB Master Food Brokers. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <Notification />
    </TutorialProvider>
  );
};
