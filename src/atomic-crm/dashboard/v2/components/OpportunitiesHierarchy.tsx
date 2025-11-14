import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useGetList } from 'react-admin';
import { ChevronRight, AlertCircle, Plus } from 'lucide-react';
import { usePrincipalContext } from '../context/PrincipalContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getOpportunityStageLabel } from '@/atomic-crm/opportunities/stageConstants';
import type { PrincipalOpportunity, HealthStatus } from '../../types';

interface OpportunitiesHierarchyProps {
  onOpportunityClick: (oppId: number) => void;
}

interface CustomerGroup {
  customerId: number;
  customerName: string;
  opportunities: PrincipalOpportunity[];
  mostRecentActivity: string;
  expanded: boolean;
}

export function OpportunitiesHierarchy({ onOpportunityClick }: OpportunitiesHierarchyProps) {
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

  // Group opportunities by customer and calculate recency
  const customerGroups = useMemo<CustomerGroup[]>(() => {
    if (!opportunities || opportunities.length === 0) return [];

    const groups = new Map<number, CustomerGroup>();

    opportunities.forEach((opp) => {
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
  }, [opportunities]);

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
      <div className="bg-card border border-border rounded-lg shadow-sm p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
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
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="text-center space-y-4">
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
