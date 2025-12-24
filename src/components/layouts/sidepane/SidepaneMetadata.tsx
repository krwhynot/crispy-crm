import { Separator } from "@/components/ui/separator";

interface SidepaneMetadataProps {
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

function formatDate(date: string | Date): string {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

export function SidepaneMetadata({ createdAt, updatedAt }: SidepaneMetadataProps) {
  if (!createdAt && !updatedAt) return null;

  return (
    <>
      <Separator className="my-4" />
      <section className="py-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {createdAt && <span>Created {formatDate(createdAt)}</span>}
          {createdAt && updatedAt && <span>•</span>}
          {updatedAt && <span>Updated {formatDate(updatedAt)}</span>}
        </div>
      </section>
    </>
  );
}
