import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Phone, Mail, Calendar, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DashboardWidget } from "./DashboardWidget";

interface PrincipalRowData {
  principalId: string;
  principalName: string;
  opportunityCount: number;
  activeStages?: Record<string, number>;
  weeklyActivities: number;
  assignedReps: string[];
}

interface Props {
  data?: PrincipalRowData[];
}

export const OpportunitiesByPrincipalDesktop = ({ data = [] }: Props) => {
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleQuickLog = useCallback((principalId: string, type: 'call' | 'email' | 'meeting') => {
    window.dispatchEvent(new CustomEvent('quick-log-activity', {
      detail: { principalId, type }
    }));
  }, []);

  const handleExportPrincipal = useCallback((principalId: string, principalName: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${principalName.replace(/[^a-z0-9]/gi, '_')}_report_${timestamp}.csv`;
    console.log(`Exporting ${filename}`);
    // TODO: Implement actual export
  }, []);

  const handleAssignTask = useCallback((principalId: string) => {
    navigate(`/tasks/create?principal_id=${principalId}`);
  }, [navigate]);

  return (
    <DashboardWidget
      title={
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" />
          <span>Principal Performance Command Center</span>
        </div>
      }
      className="col-span-full"
    >
      <div className="relative overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Principal</th>
              <th className="text-center px-2 py-2 w-20">Pipeline</th>
              <th className="text-center px-2 py-2 w-24">This Week</th>
              <th className="text-center px-2 py-2 w-32">Reps</th>
              <th className="w-40 px-2 py-2">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border [&>tr:nth-child(even)]:bg-muted/30">
            {data.map(row => (
              <tr
                key={row.principalId}
                className={`
                  h-8 transition-all cursor-pointer
                  ${hoveredRow === row.principalId ? 'bg-accent/5' : 'hover:bg-muted/30'}
                `}
                onMouseEnter={() => setHoveredRow(row.principalId)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Principal name */}
                <td
                  className="px-3 py-1 font-medium text-sm cursor-pointer"
                  onClick={() => {
                    const filter = JSON.stringify({ principal_organization_id: [row.principalId] });
                    navigate(`/opportunities?filter=${encodeURIComponent(filter)}`);
                  }}
                >
                  {row.principalName}
                </td>

                {/* Opportunity count */}
                <td className="text-center px-2">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                    {row.opportunityCount}
                  </span>
                </td>

                {/* Weekly activity count */}
                <td className="text-center text-sm">
                  <span className={`
                    ${row.weeklyActivities < 3 ? 'text-destructive' : 'text-muted-foreground'}
                  `}>
                    {row.weeklyActivities}
                  </span>
                </td>

                {/* Assigned reps avatars */}
                <td className="px-2">
                  <div className="flex -space-x-2 justify-center">
                    {row.assignedReps.slice(0, 3).map(rep => (
                      <div
                        key={rep}
                        className="w-6 h-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs"
                        title={rep}
                      >
                        {rep[0]}
                      </div>
                    ))}
                    {row.assignedReps.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                        +{row.assignedReps.length - 3}
                      </div>
                    )}
                  </div>
                </td>

                {/* Inline quick actions (visible on hover) */}
                <td className="px-2">
                  <div className={`
                    flex gap-1 justify-end transition-opacity
                    ${hoveredRow === row.principalId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                  `}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLog(row.principalId, 'call');
                      }}
                      title="Log Call (Alt+C)"
                    >
                      <Phone className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLog(row.principalId, 'email');
                      }}
                      title="Log Email (Alt+E)"
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignTask(row.principalId);
                      }}
                      title="Assign Task (Alt+T)"
                    >
                      <Calendar className="w-3 h-3" />
                    </Button>

                    {/* More actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportPrincipal(row.principalId, row.principalName)}>
                          <FileText className="w-3 h-3 mr-2" />
                          Export Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/organizations/${row.principalId}`)}>
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
      </div>
    </DashboardWidget>
  );
};
