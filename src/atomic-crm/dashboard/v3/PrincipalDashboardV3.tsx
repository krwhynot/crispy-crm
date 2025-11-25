import { useState, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PrincipalPipelineTable } from "./components/PrincipalPipelineTable";
import { TasksPanel } from "./components/TasksPanel";
import { QuickLoggerPanel } from "./components/QuickLoggerPanel";

const STORAGE_KEY = "principal-dashboard-v3-layout";

export function PrincipalDashboardV3() {
  // Refresh key to force data components to re-mount and re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Client-side-safe localStorage read
  const [sizes, setSizes] = useState<number[]>(() => {
    if (typeof window === "undefined") return [40, 30, 30];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return parsed;
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
    return [40, 30, 30];
  });

  const handleLayoutChange = (newSizes: number[]) => {
    setSizes(newSizes);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSizes));
    }
  };

  // Memoized to prevent child re-renders when passed as prop
  const handleRefresh = useCallback(() => {
    // Increment refresh key to force data components to re-mount and re-fetch
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold">Principal Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handleLayoutChange}
          className="h-full gap-4"
        >
          {/* Panel 1: Pipeline by Principal */}
          <ResizablePanel defaultSize={sizes[0]} minSize={25}>
            <PrincipalPipelineTable key={`pipeline-${refreshKey}`} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Panel 2: My Tasks */}
          <ResizablePanel defaultSize={sizes[1]} minSize={20}>
            <TasksPanel key={`tasks-${refreshKey}`} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Panel 3: Quick Logger */}
          <ResizablePanel defaultSize={sizes[2]} minSize={20}>
            <QuickLoggerPanel onRefresh={handleRefresh} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
