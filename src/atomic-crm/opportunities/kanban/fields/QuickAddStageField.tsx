interface QuickAddStageFieldProps {
  stageLabel: string;
}

/**
 * Read-only stage display field for quick-add opportunity form
 * Stage is pre-determined by the Kanban column
 */
export function QuickAddStageField({ stageLabel }: QuickAddStageFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor="stage" className="block text-sm font-medium mb-1">
        Stage
      </label>
      <input
        id="stage"
        type="text"
        value={stageLabel}
        disabled
        className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
      />
    </div>
  );
}
