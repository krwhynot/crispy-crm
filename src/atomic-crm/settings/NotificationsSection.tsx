import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { DigestPreferences } from "./DigestPreferences";

export function NotificationsSection() {
  return (
    <div className="space-y-4">
      <DigestPreferences />

      <SectionCard title="Coming Soon">
        <p className="text-sm text-muted-foreground">
          More notification options coming soon: task reminders, opportunity updates, and @mentions.
        </p>
      </SectionCard>
    </div>
  );
}
