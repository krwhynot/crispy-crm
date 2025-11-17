import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGetIdentity } from 'react-admin';
import { ChevronRight } from 'lucide-react';
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
 * - Left sidebar with accordion-style collapsible filter content
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
 * │ (18rem)│               │       │                │
 * └────────┴────────────────────────────────────────┘
 * ```
 */
export function PrincipalDashboardV2() {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  // Filter state - persisted to localStorage
  const [filterState, setFilterState] = usePrefs<FilterState>('filters', {
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
  });

  // Sidebar visibility - persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = usePrefs('sidebarOpen', true);

  // Sidebar ref for accessibility
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Current user identity (id is ALWAYS string in React Admin)
  const { data: identity } = useGetIdentity<{ id: string; fullName: string }>();

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    return (
      filterState.health.length +
      filterState.stages.length +
      (filterState.assignee && filterState.assignee !== 'team' ? 1 : 0) +
      (filterState.lastTouch !== 'any' ? 1 : 0) +
      (filterState.showClosed ? 1 : 0)
    );
  }, [filterState]);

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setFilterState({
      health: [],
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
    });
  }, [setFilterState]);

  const { containerRef, widths, onMouseDown } = useResizableColumns();

  // Reset auto-focus flag after sidebar opens and FiltersSidebar has time to focus
  useEffect(() => {
    if (sidebarOpen && shouldAutoFocus) {
      // Delay reset to ensure FiltersSidebar's useEffect has captured the autoFocus prop
      const timer = setTimeout(() => {
        setShouldAutoFocus(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sidebarOpen, shouldAutoFocus]);

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
        <div className="flex-1 relative px-6 py-6">
          {/* Grid layout with dynamic sidebar collapse */}
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: sidebarOpen ? '18rem 1fr' : '0px 1fr',
              gap: sidebarOpen ? 'var(--spacing-content)' : '0',
              transition: 'grid-template-columns 200ms cubic-bezier(0.4, 0, 0.2, 1), gap 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
            }}
          >
            {/* Left Sidebar (Filters) */}
            <div
              ref={sidebarRef}
              data-testid="filters-sidebar"
              role="complementary"
              aria-label="Filters sidebar"
              aria-hidden={!sidebarOpen}
              className="overflow-hidden"
              style={{
                width: sidebarOpen ? '18rem' : '0',
                opacity: sidebarOpen ? 1 : 0,
                transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {sidebarOpen && (
                <FiltersSidebar
                  filters={filterState}
                  onFiltersChange={setFilterState}
                  onClearFilters={handleClearFilters}
                  activeCount={activeFilterCount}
                  onToggle={() => setSidebarOpen(false)}
                  autoFocus={shouldAutoFocus}
                />
              )}
            </div>

            {/* 3-Column Layout */}
            <div ref={containerRef} className="flex h-full overflow-hidden" style={{ width: '100%' }}>
              {/* Column 1: Opportunities */}
              <div
                id="col-opportunities"
                className="flex flex-col overflow-y-auto pr-2"
                style={{ width: `${widths[0]}%` }}
              >
                <OpportunitiesHierarchy
                  filters={filterState}
                  currentUserId={identity?.id}
                  onOpportunityClick={handleOpportunityClick}
                />
              </div>

              {/* Separator 1 */}
              <button
                type="button"
                className="w-2 bg-border hover:bg-primary cursor-col-resize shrink-0 transition-colors"
                onMouseDown={onMouseDown(0)}
                aria-label="Resize opportunities column"
              />

              {/* Column 2: Tasks */}
              <div
                id="col-tasks"
                className="flex flex-col overflow-y-auto px-2"
                style={{ width: `${widths[1]}%` }}
              >
                <TasksPanel
                  assignee={filterState.assignee}
                  currentUserId={identity?.id}
                />
              </div>

              {/* Separator 2 */}
              <button
                type="button"
                className="w-2 bg-border hover:bg-primary cursor-col-resize shrink-0 transition-colors"
                onMouseDown={onMouseDown(1)}
                aria-label="Resize tasks column"
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

          {/* Collapsed Rail Toggle - WCAG 2.1 AA compliant (44px touch target) */}
          {!sidebarOpen && (
            <div className="fixed left-0 top-32 z-10">
              <button
                onClick={() => {
                  setShouldAutoFocus(true);
                  setSidebarOpen(true);
                }}
                className="relative w-11 h-11 bg-border hover:bg-accent transition-colors duration-200 rounded-r-md focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center"
                aria-label="Open filters sidebar"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />

                {/* Active filter badge */}
                {activeFilterCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                    {activeFilterCount}
                  </div>
                )}
              </button>
            </div>
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
