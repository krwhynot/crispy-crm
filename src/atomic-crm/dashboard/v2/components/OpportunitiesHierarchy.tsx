import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useGetList } from 'react-admin';
import { ChevronRight, AlertCircle, Plus } from 'lucide-react';
import { usePrincipalContext } from '../context/PrincipalContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getOpportunityStageLabel } from '@/atomic-crm/opportunities/stageConstants';
import type { FilterState, PrincipalOpportunity } from '../types';

interface OpportunitiesHierarchyProps {
  filters: FilterState;           // NEW - from shared types
  currentUserId?: string;         // NEW - string (React Admin identity.id is always string)
  onOpportunityClick: (oppId: number) => void;
}

interface CustomerGroup {
  customerId: number;
  customerName: string;
  opportunities: PrincipalOpportunity[];
  mostRecentActivity: string;
  expanded: boolean;
}

export function OpportunitiesHierarchy({
  filters,
  currentUserId,
  onOpportunityClick
}: OpportunitiesHierarchyProps) {
  const { selectedPrincipalId } = usePrincipalContext();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const treeRef = useRef<HTMLDivElement>(null);

  const { data: opportunities, isLoading, error, refetch } = useGetList<PrincipalOpportunity>(
    'principal_opportunities',
    {
      filter: selectedPrincipalId
        ? { principal_id: selectedPrincipalId }
        : {},
      sort: { field: 'last_activity', order: 'DESC' },
      pagination: { page: 1, perPage: 500 },
    },
    {
      enabled: !!selectedPrincipalId,
    }
  );

  // Client-side filtering
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];

    return opportunities.filter(opp => {
      // Health filter (empty array = show all)
      if (filters.health.length > 0 && !filters.health.includes(opp.health_status)) {
        return false;
      }

      // Stage filter (empty array = show all)
      if (filters.stages.length > 0 && !filters.stages.includes(opp.stage)) {
        return false;
      }

      // Last touch filter
      if (filters.lastTouch !== 'any') {
        const dayThreshold = filters.lastTouch === '7d' ? 7 : 14;
        if (opp.days_since_activity > dayThreshold) {
          return false;
        }
      }

      // Show closed filter
      if (!filters.showClosed && ['closed_won', 'closed_lost'].includes(opp.stage)) {
        return false;
      }

      // Assignee filter - COMMENTED OUT (requires sales_id in database view)
      // TODO: Uncomment after migration adds sales_id to principal_opportunities view
      // if (filters.assignee === 'me' && currentUserId && opp.sales_id !== currentUserId) {
      //   return false;
      // }
      // if (filters.assignee !== null && filters.assignee !== 'me' && filters.assignee !== 'team' && opp.sales_id !== filters.assignee) {
      //   return false;
      // }

      return true;
    });
  }, [opportunities, filters, currentUserId]);

  // Group opportunities by customer and calculate recency
  const customerGroups = useMemo<CustomerGroup[]>(() => {
    if (!filteredOpportunities || filteredOpportunities.length === 0) return [];

    const groups = new Map<number, CustomerGroup>();

    filteredOpportunities.forEach((opp) => {
      const customerId = opp.customer_organization_id;
      const customerName = opp.customer_name;

      if (!groups.has(customerId)) {
        groups.set(customerId, {
          customerId,
          customerName,
          opportunities: [],
          mostRecentActivity: opp.last_activity,
          expanded: false,
        });
      }

      const group = groups.get(customerId)!;
      group.opportunities.push(opp);

      // Track most recent activity across all opportunities for this customer
      if (new Date(opp.last_activity) > new Date(group.mostRecentActivity)) {
        group.mostRecentActivity = opp.last_activity;
      }
    });

    // Convert to array and sort by recency (most recent first)
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      return new Date(b.mostRecentActivity).getTime() - new Date(a.mostRecentActivity).getTime();
    });

    return sortedGroups;
  }, [filteredOpportunities]);

  // Auto-expand top 3 customers on initial render
  useEffect(() => {
    if (customerGroups.length > 0 && expandedCustomers.size === 0) {
      const topThree = new Set(
        customerGroups.slice(0, 3).map((group) => group.customerId)
      );
      setExpandedCustomers(topThree);
    }
  }, [customerGroups, expandedCustomers.size]);

  const toggleCustomer = useCallback((customerId: number) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, customerId?: number) => {
    if (customerId !== undefined) {
      // Customer row keyboard handling
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (!expandedCustomers.has(customerId)) {
          toggleCustomer(customerId);
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (expandedCustomers.has(customerId)) {
          toggleCustomer(customerId);
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCustomer(customerId);
      }
    }
  }, [expandedCustomers, toggleCustomer]);

  const getHealthDotColor = (health: HealthStatus): string => {
    switch (health) {
      case 'active':
        return 'bg-success';
      case 'cooling':
        return 'bg-warning';
      case 'at_risk':
        return 'bg-destructive';
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-3 space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-3">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error loading opportunities</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Failed to load opportunities for this principal.</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-3">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            {selectedPrincipalId
              ? 'No opportunities for this principal'
              : 'Select a principal to view opportunities'}
          </p>
          {selectedPrincipalId && (
            <Button className="h-11 gap-2">
              <Plus className="size-4" />
              Create Opportunity
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={treeRef}
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
      role="tree"
      aria-label="Opportunities hierarchy"
    >
      {customerGroups.map((group) => {
        const isExpanded = expandedCustomers.has(group.customerId);

        return (
          <div key={group.customerId}>
            {/* Customer Header Row */}
            <div
              role="treeitem"
              aria-expanded={isExpanded}
              aria-selected={false}
              tabIndex={0}
              className="h-11 px-3 flex items-center gap-2 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => toggleCustomer(group.customerId)}
              onKeyDown={(e) => handleKeyDown(e, group.customerId)}
            >
              <ChevronRight
                className="size-4 text-muted-foreground transition-transform shrink-0"
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
                aria-hidden="true"
              />
              <span className="text-foreground font-medium truncate">
                {group.customerName}
              </span>
              <Badge variant="secondary" className="ml-auto shrink-0">
                {group.opportunities.length}
              </Badge>
            </div>

            {/* Opportunity Rows (Children) */}
            {isExpanded &&
              group.opportunities.map((opp) => (
                <div
                  key={opp.opportunity_id}
                  role="treeitem"
                  aria-selected={false}
                  tabIndex={0}
                  className="h-11 px-6 flex items-center gap-3 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onOpportunityClick(opp.opportunity_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpportunityClick(opp.opportunity_id);
                    }
                  }}
                >
                  {/* Health Dot */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${getHealthDotColor(opp.health_status)}`}
                    aria-label={`Health: ${opp.health_status}`}
                  />

                  {/* Opportunity Name */}
                  <span className="text-foreground truncate flex-1">
                    {opp.opportunity_name}
                  </span>

                  {/* Stage Badge */}
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {getOpportunityStageLabel(opp.stage)}
                  </Badge>

                  {/* Estimated Close Date */}
                  {opp.estimated_close_date && (
                    <span className="text-muted-foreground text-sm shrink-0 hidden md:inline">
                      {formatDate(opp.estimated_close_date)}
                    </span>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
