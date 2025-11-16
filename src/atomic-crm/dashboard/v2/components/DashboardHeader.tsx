import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetList } from 'react-admin';
import { ChevronRight, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { usePrincipalContext } from '../context/PrincipalContext';

interface Principal {
  id: number;
  name: string;
}

export function DashboardHeader() {
  const navigate = useNavigate();
  const { selectedPrincipalId, setSelectedPrincipal } = usePrincipalContext();

  const { data: principals, isLoading } = useGetList<Principal>('organizations', {
    filter: { organization_type: 'principal' },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  });

  const selectedPrincipal = principals?.find((p) => p.id === selectedPrincipalId);

  const handlePrincipalChange = (value: string) => {
    setSelectedPrincipal(parseInt(value, 10));
  };

  const handleNewActivity = () => {
    // Navigate to activities create page with pre-filled principal
    if (selectedPrincipalId) {
      navigate(`/activities/create?organization_id=${selectedPrincipalId}`);
    } else {
      navigate('/activities/create');
    }
  };

  const handleNewTask = () => {
    navigate('/tasks/create');
  };

  const handleNewOpportunity = () => {
    // Navigate to opportunities create page with pre-filled principal
    if (selectedPrincipalId) {
      navigate(`/opportunities/create?principal_organization_id=${selectedPrincipalId}`);
    } else {
      navigate('/opportunities/create');
    }
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center justify-between gap-3 px-[var(--spacing-edge-desktop)] py-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate('/')}
            className="h-11 px-2 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            aria-label="Navigate to home"
          >
            Home
          </button>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          <button
            onClick={() => navigate('/principals')}
            className="h-11 px-2 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            aria-label="Navigate to principals list"
          >
            Principals
          </button>
          {selectedPrincipal && (
            <>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-foreground font-medium">{selectedPrincipal.name}</span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Select
            value={selectedPrincipalId?.toString() || ''}
            onValueChange={handlePrincipalChange}
            disabled={isLoading}
          >
            <SelectTrigger data-testid="principal-select-trigger" className="h-11 w-[240px]">
              <SelectValue placeholder="Select principal..." />
            </SelectTrigger>
            <SelectContent>
              {principals?.map((principal) => (
                <SelectItem key={principal.id} value={principal.id.toString()}>
                  {principal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-11 gap-2" aria-label="Create new item">
                <Plus className="size-4" aria-hidden="true" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleNewActivity}>Activity</DropdownMenuItem>
              <DropdownMenuItem onClick={handleNewTask}>Task</DropdownMenuItem>
              <DropdownMenuItem onClick={handleNewOpportunity}>Opportunity</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
