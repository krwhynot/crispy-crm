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
  activity: string;
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
      <div className="flex items-center justify-between mb-2 h-7">
        <h2 className="text-sm font-semibold text-gray-900">My Principals</h2>
        <span className="text-xs text-gray-500">{data.length} total</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-600 border-b">
            <th className="pb-1">Principal</th>
            <th className="pb-1 text-center">Activity</th>
            <th className="pb-1 w-24"></th>
          </tr>
        </thead>
        <tbody>
          {displayData.map(principal => (
            <tr
              key={principal.id}
              className="h-9 border-b hover:bg-gray-50 cursor-pointer"
              onMouseEnter={() => setHoveredRow(principal.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => handleRowClick(principal.id, principal.name)}
            >
              <td className="py-1">{principal.name}</td>
              <td className="py-1 text-center text-xs">{principal.activity}</td>
              <td className="py-1">
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
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Show all {data.length} principals
        </button>
      )}
    </div>
  );
};
