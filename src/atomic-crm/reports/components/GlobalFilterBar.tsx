import { useState } from 'react';
import { Calendar, Download, RotateCcw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGlobalFilters } from '../contexts/GlobalFilterContext';

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

export function GlobalFilterBar() {
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const [datePreset, setDatePreset] = useState('last30');

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    // Date calculation logic would go here
    // For now, keeping the existing filter values
  };

  const handleSalesRepChange = (value: string) => {
    setFilters({
      ...filters,
      salesRepId: value === 'all' ? null : parseInt(value),
    });
  };

  const handleExportAll = () => {
    // Export logic will be implemented later
    console.log('Exporting all reports...');
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-secondary/50 rounded-lg">
      <div className="flex items-center gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={datePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger className="w-[180px]" aria-label="Date Range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sales Rep Filter */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.salesRepId?.toString() || 'all'}
            onValueChange={handleSalesRepChange}
          >
            <SelectTrigger className="w-[180px]" aria-label="Sales Rep">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {/* Sales reps will be loaded dynamically */}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Reset Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>

        {/* Export All */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAll}
        >
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>
    </div>
  );
}
