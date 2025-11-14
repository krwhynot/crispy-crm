import React, { useState, useEffect, useCallback } from 'react';
import { PrincipalProvider } from './context/PrincipalContext';
import { DashboardHeader } from './components/DashboardHeader';
import { FiltersSidebar } from './components/FiltersSidebar';
import { OpportunitiesHierarchy } from './components/OpportunitiesHierarchy';
import { TasksPanel } from './components/TasksPanel';
import { QuickLogger } from './components/QuickLogger';
import { RightSlideOver } from './components/RightSlideOver';
import { useResizableColumns } from './hooks/useResizableColumns';
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
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar (Filters) */}
          <FiltersSidebar filters={filterState} onFiltersChange={setFilterState} />

          {/* 3-Column Layout */}
          <div ref={containerRef} className="flex flex-1 overflow-hidden">
            {/* Column 1: Opportunities */}
            <div
              id="col-opportunities"
              className="flex flex-col overflow-y-auto p-4"
              style={{ width: `${widths[0]}%` }}
            >
              <OpportunitiesHierarchy onOpportunityClick={handleOpportunityClick} />
            </div>

            {/* Separator 1 */}
            <button
              type="button"
              className="w-1 bg-border hover:bg-primary cursor-col-resize shrink-0 transition-colors"
              onMouseDown={onMouseDown(0)}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize opportunities column"
              tabIndex={0}
            />

            {/* Column 2: Tasks */}
            <div
              id="col-tasks"
              className="flex flex-col overflow-y-auto p-4"
              style={{ width: `${widths[1]}%` }}
            >
              <TasksPanel />
            </div>

            {/* Separator 2 */}
            <button
              type="button"
              className="w-1 bg-border hover:bg-primary cursor-col-resize shrink-0 transition-colors"
              onMouseDown={onMouseDown(1)}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize tasks column"
              tabIndex={0}
            />

            {/* Column 3: Quick Logger */}
            <div
              id="col-logger"
              className="flex flex-col overflow-y-auto p-4"
              style={{ width: `${widths[2]}%` }}
            >
              <QuickLogger />
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
