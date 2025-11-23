import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Filter } from 'lucide-react';
import type { PrincipalPipelineRow } from '../types';
import { usePrincipalPipeline } from '../hooks/usePrincipalPipeline';
import { PipelineDrillDownSheet } from './PipelineDrillDownSheet';

export function PrincipalPipelineTable() {
  const [myPrincipalsOnly, setMyPrincipalsOnly] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<{ id: number; name: string } | null>(null);
  const { data, loading, error } = usePrincipalPipeline({ myPrincipalsOnly });

  const handleRowClick = useCallback((row: PrincipalPipelineRow) => {
    setSelectedPrincipal({ id: row.id, name: row.name });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedPrincipal(null);
  }, []);

  const renderMomentumIcon = (momentum: PrincipalPipelineRow['momentum']) => {
    switch (momentum) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-warning" />;
      case 'steady':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      case 'stale':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border pb-4">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex-1 space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load pipeline data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with title and filters */}
      <div className="border-b border-border pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pipeline by Principal</h2>
            <p className="text-sm text-muted-foreground">
              Track opportunity momentum across your customer accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="my-principals"
                checked={myPrincipalsOnly}
                onCheckedChange={setMyPrincipalsOnly}
              />
              <label htmlFor="my-principals" className="text-sm">
                My Principals Only
              </label>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Filter options will be added in next task */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Principal</TableHead>
              <TableHead className="text-right">Pipeline</TableHead>
              <TableHead className="text-center">This Week</TableHead>
              <TableHead className="text-center">Last Week</TableHead>
              <TableHead>Momentum</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                className="table-row-premium cursor-pointer"
                onClick={() => handleRowClick(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(row);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View opportunities for ${row.name}`}
              >
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">
                  <div className="font-semibold">{row.totalPipeline}</div>
                </TableCell>
                <TableCell className="text-center">
                  {row.activeThisWeek > 0 ? (
                    <Badge variant="default" className="bg-success">
                      {row.activeThisWeek}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.activeLastWeek > 0 ? (
                    <Badge variant="secondary">
                      {row.activeLastWeek}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {renderMomentumIcon(row.momentum)}
                    <span className="text-sm capitalize">{row.momentum}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {row.nextAction ? (
                    <span className="text-sm">{row.nextAction}</span>
                  ) : (
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      Schedule follow-up
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Drill-Down Sheet */}
      <PipelineDrillDownSheet
        principalId={selectedPrincipal?.id ?? null}
        principalName={selectedPrincipal?.name ?? ''}
        isOpen={selectedPrincipal !== null}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
