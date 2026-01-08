import { useGetOne } from "react-admin";
import { useNavigate } from "react-router-dom";
import { Building2, UserCircle, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidepaneSection, SidepaneEmptyState } from "@/components/layouts/sidepane";
import type { RaRecord } from "react-admin";
import type { TabComponentProps } from "@/components/layouts/ResourceSlideOver";
import type { ActivityRecord, Contact, Organization, Opportunity } from "../../types";
import { getOpportunityStageLabel } from "../../opportunities/constants/stageConstants";

// Helper type to ensure id is required for useGetOne compatibility
type WithRequiredId<T> = T & RaRecord;

interface RelatedEntityCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  name: string;
  subtitle?: string;
  badge?: { label: string; variant?: "default" | "secondary" | "outline" };
  onClick: () => void;
}

function RelatedEntityCard({
  icon: Icon,
  label,
  name,
  subtitle,
  badge,
  onClick,
}: RelatedEntityCardProps) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="size-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
              {badge && (
                <Badge variant={badge.variant || "outline"} className="text-xs">
                  {badge.label}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={onClick}
              className="text-sm font-medium text-primary hover:underline text-left block truncate w-full mt-1"
            >
              {name}
            </button>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RelatedEntitySkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactCard({
  contactId,
  onNavigate,
}: {
  contactId: number;
  onNavigate: (path: string) => void;
}) {
  const { data: contact, isLoading } = useGetOne<Contact>(
    "contacts",
    { id: contactId },
    { enabled: !!contactId }
  );

  if (isLoading) {
    return <RelatedEntitySkeleton />;
  }

  if (!contact) {
    return null;
  }

  const displayName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unknown Contact";

  return (
    <RelatedEntityCard
      icon={UserCircle}
      label="Contact"
      name={displayName}
      subtitle={contact.title || undefined}
      onClick={() => onNavigate(`/contacts?view=${contactId}`)}
    />
  );
}

function OrganizationCard({
  organizationId,
  onNavigate,
}: {
  organizationId: number;
  onNavigate: (path: string) => void;
}) {
  const { data: organization, isLoading } = useGetOne<WithRequiredId<Organization>>(
    "organizations",
    { id: organizationId },
    { enabled: !!organizationId }
  );

  if (isLoading) {
    return <RelatedEntitySkeleton />;
  }

  if (!organization) {
    return null;
  }

  return (
    <RelatedEntityCard
      icon={Building2}
      label="Organization"
      name={organization.name}
      subtitle={organization.organization_type || undefined}
      onClick={() => onNavigate(`/organizations?view=${organizationId}`)}
    />
  );
}

function OpportunityCard({
  opportunityId,
  onNavigate,
}: {
  opportunityId: number;
  onNavigate: (path: string) => void;
}) {
  const { data: opportunity, isLoading } = useGetOne<Opportunity>(
    "opportunities",
    { id: opportunityId },
    { enabled: !!opportunityId }
  );

  if (isLoading) {
    return <RelatedEntitySkeleton />;
  }

  if (!opportunity) {
    return null;
  }

  const stageLabel = getOpportunityStageLabel(opportunity.stage);

  return (
    <RelatedEntityCard
      icon={Target}
      label="Opportunity"
      name={opportunity.name}
      badge={{ label: stageLabel, variant: "secondary" }}
      onClick={() => onNavigate(`/opportunities?view=${opportunityId}`)}
    />
  );
}

export function ActivityRelatedTab({ record, isActiveTab }: TabComponentProps) {
  const navigate = useNavigate();
  const activityRecord = record as ActivityRecord;

  const hasRelationships =
    activityRecord.contact_id ||
    activityRecord.organization_id ||
    activityRecord.opportunity_id;

  if (!isActiveTab) {
    return null;
  }

  if (!hasRelationships) {
    return (
      <SidepaneEmptyState
        title="No linked entities"
        description="This activity is not linked to any contact, organization, or opportunity."
      />
    );
  }

  return (
    <div className="space-y-6">
      <SidepaneSection label="Related Entities">
        <div className="space-y-3">
          {activityRecord.contact_id && (
            <ContactCard
              contactId={activityRecord.contact_id as number}
              onNavigate={navigate}
            />
          )}

          {activityRecord.organization_id && (
            <OrganizationCard
              organizationId={activityRecord.organization_id as number}
              onNavigate={navigate}
            />
          )}

          {activityRecord.opportunity_id && (
            <OpportunityCard
              opportunityId={activityRecord.opportunity_id as number}
              onNavigate={navigate}
            />
          )}
        </div>
      </SidepaneSection>
    </div>
  );
}
