import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PrincipalProvider } from './context/PrincipalContext';
import { DashboardHeader } from './components/DashboardHeader';
import { FiltersSidebar } from './components/FiltersSidebar';
import { OpportunitiesHierarchy } from './components/OpportunitiesHierarchy';
import { TasksPanel } from './components/TasksPanel';
import { QuickLogger } from './components/QuickLogger';
import { RightSlideOver } from './components/RightSlideOver';
import { useResizableColumns } from './hooks/useResizableColumns';
import { usePrefs } from './hooks/usePrefs';
import type { FilterState } from './types';

/**
 * Principal Dashboard V2 - Main Layout
 *
 * Features:
 * - Header with principal selector and breadcrumbs
 * - Left sidebar with collapsible filters
 * - 3-column resizable layout (Opportunities | Tasks | Quick Logger)
 * - Right slide-over panel for opportunity details
 * - Global keyboard shortcuts (/, 1, 2, 3, H, Esc)
 *
 * Layout Structure:
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │ Header                                          │
 * ├────────┬────────────────────────────────────────┤
 * │ Filter │ Opportunities │ Tasks │ Quick Logger   │
 * │ Sidebar│ (col 1)       │(col 2)│ (col 3)        │
 * │        │               │       │                │
 * └────────┴────────────────────────────────────────┘
 * ```
 */
export function PrincipalDashboardV2() {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
    groupByCustomer: true,
  });

  // Sidebar state with localStorage persistence
  const [sidebarOpen, setSidebarOpen] = usePrefs<boolean>('pd.sidebarOpen', true);

  const { containerRef, widths, onMouseDown } = useResizableColumns();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          document.getElementById('global-search')?.focus();
          break;
        case '1':
          e.preventDefault();
          document.getElementById('col-opportunities')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case '2':
          e.preventDefault();
          document.getElementById('col-tasks')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case '3':
          e.preventDefault();
          document.getElementById('col-logger')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'H':
        case 'h':
          e.preventDefault();
          if (selectedOpportunityId) {
            setSlideOverOpen(true);
          }
          break;
        case 'Escape':
          if (slideOverOpen) {
            e.preventDefault();
            setSlideOverOpen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideOverOpen, selectedOpportunityId]);

  const handleOpportunityClick = useCallback((oppId: number) => {
    setSelectedOpportunityId(oppId);
    setSlideOverOpen(true);
  }, []);

  const handleSlideOverClose = useCallback(() => {
    setSlideOverOpen(false);
  }, []);

  return (
    <PrincipalProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <DashboardHeader />

        {/* Main Content Area */}
        <div className="flex-1 relative px-[var(--spacing-edge-desktop)] py-6">
          {/* Grid layout with dynamic sidebar width */}
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: sidebarOpen ? '18rem 1fr' : '0px 1fr',
              gap: '24px',
            }}
          >
            {/* Left Sidebar (Filters) - Conditional rendering */}
            {sidebarOpen && (
              <div className="overflow-hidden">
                <FiltersSidebar
                  filters={filterState}
                  onFiltersChange={setFilterState}
                  open={sidebarOpen}
                  onOpenChange={setSidebarOpen}
                />
              </div>
            )}

            {/* 3-Column Layout */}
            <div ref={containerRef} className="flex h-full overflow-hidden">
              {/* Column 1: Opportunities */}
              <div
                id="col-opportunities"
                className="flex flex-col overflow-y-auto pr-2"
                style={{ width: `${widths[0]}%` }}
              >
                <OpportunitiesHierarchy onOpportunityClick={handleOpportunityClick} />
              </div>

              {/* Separator 1 */}
              <button
                type="button"
                className="w-2 bg-border hover:bg-primary cursor-col-resize shrink-0 transition-colors"
                onMouseDown={onMouseDown(0)}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize opportunities column"
                tabIndex={0}
              />

              {/* Column 2: Tasks */}
              <div
                id="col-tasks"
                className="flex flex-col overflow-y-auto px-2"
                style={{ width: `${widths[1]}%` }}
              >
                <TasksPanel />
              </div>

              {/* Separator 2 */}
              <button
                type="button"
                className="w-2 bg-border hover:bg-primary cursor-col-resize shrink-0 transition-colors"
                onMouseDown={onMouseDown(1)}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize tasks column"
                tabIndex={0}
              />

              {/* Column 3: Quick Logger */}
              <div
                id="col-logger"
                className="flex flex-col overflow-y-auto pl-2"
                style={{ width: `${widths[2]}%` }}
              >
                <QuickLogger />
              </div>
            </div>
          </div>

          {/* Rail Toggle - appears when sidebar is closed */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-0 top-28 h-11 w-6 rounded-r-lg border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Open filters sidebar"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Right Slide-Over */}
        <RightSlideOver
          isOpen={slideOverOpen}
          onClose={handleSlideOverClose}
          opportunityId={selectedOpportunityId}
        />
      </div>
    </PrincipalProvider>
  );
}
