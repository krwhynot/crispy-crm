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
import { TrendingUp, TrendingDown, Minus, AlertCircle, Filter } from 'lucide-react';
import type { PrincipalPipelineRow } from '../types';

// Mock data for testing
const mockData: PrincipalPipelineRow[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    totalPipeline: 5,
    activeThisWeek: 3,
    activeLastWeek: 1,
    momentum: 'increasing',
    nextAction: 'Demo scheduled Friday',
  },
  {
    id: 2,
    name: 'TechCo Industries',
    totalPipeline: 3,
    activeThisWeek: 0,
    activeLastWeek: 2,
    momentum: 'decreasing',
    nextAction: null,
  },
];

export function PrincipalPipelineTable() {
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
              <Switch id="my-principals" defaultChecked />
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
            {mockData.map((row) => (
              <TableRow key={row.id} className="table-row-premium cursor-pointer">
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
    </div>
  );
}
