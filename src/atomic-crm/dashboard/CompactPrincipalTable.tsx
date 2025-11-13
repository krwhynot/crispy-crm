import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Principal {
  id: number;
  name: string;
  opportunityCount: number;
  weeklyActivities?: number;
  assignedReps?: string[];
}

interface Props {
  data: Principal[];
}

export const CompactPrincipalTable: React.FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const displayData = expanded ? data : data.slice(0, 5);
  const hasMore = data.length > 5;

  // Handle quick log activity (dispatches custom event for modal)
  const handleQuickLog = useCallback((principalId: number, activityType: string) => {
    window.dispatchEvent(new CustomEvent('quick-log-activity', {
      detail: { principalId, activityType }
    }));
  }, []);

  // Handle task assignment
  const handleAssignTask = useCallback((principalId: number) => {
    navigate(`/tasks/create?principal_id=${principalId}`);
  }, [navigate]);

  // Handle row click to navigate to opportunities
  const handleRowClick = useCallback((principalId: number, principalName: string) => {
    const filter = JSON.stringify({
      principal_organization_id: principalId
    });
    navigate(`/opportunities?filter=${encodeURIComponent(filter)}`);
  }, [navigate]);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-compact h-7">
        <h2 className="text-sm font-semibold text-foreground">My Principals</h2>
        <span className="text-xs text-muted-foreground">{data.length} total</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b">
            <th className="pb-compact px-compact">Principal</th>
            <th className="pb-compact px-compact text-center w-16">Pipeline</th>
            <th className="pb-compact px-compact text-center w-16">This Week</th>
            <th className="pb-compact px-compact text-center w-20">Reps</th>
            <th className="pb-compact w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map(principal => (
            <tr
              key={principal.id}
              className="h-9 border-b hover:bg-muted cursor-pointer"
              onMouseEnter={() => setHoveredRow(principal.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => handleRowClick(principal.id, principal.name)}
            >
              {/* Principal name */}
              <td className="py-compact px-compact font-medium text-sm">{principal.name}</td>

              {/* Opportunity count (Pipeline) */}
              <td className="py-compact px-compact text-center">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] px-compact py-0.5 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
                  {principal.opportunityCount}
                </span>
              </td>

              {/* Weekly activity count */}
              <td className="py-compact px-compact text-center text-xs">
                <span className={principal.weeklyActivities && principal.weeklyActivities < 3 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                  {principal.weeklyActivities ?? 0}
                </span>
              </td>

              {/* Assigned reps */}
              <td className="py-compact px-compact">
                <div className="flex -space-x-1.5 justify-center">
                  {principal.assignedReps && principal.assignedReps.length > 0 ? (
                    <>
                      {principal.assignedReps.slice(0, 2).map((rep, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full bg-muted border border-white flex items-center justify-center text-xs font-medium"
                          title={rep}
                        >
                          {rep[0]}
                        </div>
                      ))}
                      {principal.assignedReps.length > 2 && (
                        <div className="w-5 h-5 rounded-full bg-muted border border-white flex items-center justify-center text-xs">
                          +{principal.assignedReps.length - 2}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </td>

              {/* Quick actions */}
              <td className="py-compact">
                {/* Quick actions (visible on hover) */}
                <div className={`
                  flex gap-0.5 justify-end transition-opacity
                  ${hoveredRow === principal.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLog(principal.id, 'call');
                    }}
                    title="Log Call"
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLog(principal.id, 'email');
                    }}
                    title="Log Email"
                  >
                    <Mail className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignTask(principal.id);
                    }}
                    title="Assign Task"
                  >
                    <Calendar className="w-3 h-3" />
                  </Button>

                  {/* More actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/organizations/${principal.id}`)}>
                        View Organization
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-compact text-xs text-primary hover:underline"
        >
          Show all {data.length} principals
        </button>
      )}
    </div>
  );
};
