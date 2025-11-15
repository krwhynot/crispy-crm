import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGetIdentity } from 'react-admin';
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

  // Filter state - persisted to localStorage
  const [filterState, setFilterState] = usePrefs<FilterState>('pd.filters', {
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
    groupByCustomer: true,
  });

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
      groupByCustomer: filterState.groupByCustomer, // Preserve grouping preference
    });
  }, [filterState.groupByCustomer, setFilterState]);

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
          {/* Grid layout with fixed sidebar width */}
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: '18rem 1fr',
              gap: '24px',
            }}
          >
            {/* Left Sidebar (Filters) */}
            <div className="overflow-hidden">
              <FiltersSidebar
                filters={filterState}
                onFiltersChange={setFilterState}
                onClearFilters={handleClearFilters}
                activeCount={activeFilterCount}
              />
            </div>

            {/* 3-Column Layout */}
            <div ref={containerRef} className="flex h-full overflow-hidden">
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
