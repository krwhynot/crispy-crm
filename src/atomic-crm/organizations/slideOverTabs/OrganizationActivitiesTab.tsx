import { RecordContextProvider } from "ra-core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnifiedTimeline } from "../../timeline";
import type { TabComponentProps } from "@/components/layouts/ResourceSlideOver";

export function OrganizationActivitiesTab({ record, isActiveTab }: TabComponentProps) {
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          {isActiveTab && <UnifiedTimeline organizationId={record.id} />}
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
