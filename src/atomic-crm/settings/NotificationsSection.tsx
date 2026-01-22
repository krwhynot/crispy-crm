import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DigestPreferences } from "./DigestPreferences";

export function NotificationsSection() {
  return (
    <div className="space-y-4">
      <DigestPreferences />

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More notification options coming soon: task reminders, opportunity updates, and
            @mentions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
