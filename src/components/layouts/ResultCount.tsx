interface ResultCountProps {
  total: number | undefined;
  isPending: boolean;
}

export function ResultCount({ total, isPending }: ResultCountProps) {
  if (isPending) {
    return (
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Loading...
      </span>
    );
  }

  if (total === undefined) return null;

  return (
    <span className="text-sm text-muted-foreground" aria-live="polite">
      {total} {total === 1 ? "result" : "results"}
    </span>
  );
}
