import { useState } from "react";
import { Form, useUpdate, useNotify, ReferenceInput, useGetOne } from "react-admin";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import { LeadSourceInput } from "../LeadSourceInput";

interface OpportunitySlideOverDetailsTabProps {
  record: any;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  /** Whether this tab is currently active - available for conditional data fetching */
  isActiveTab: boolean;
}

export function OpportunitySlideOverDetailsTab({
  record,
  mode,
  onModeToggle,
  isActiveTab,
}: OpportunitySlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      await update(
        "opportunities",
        {
          id: record.id,
          data,
          previousData: record,
        },
        {
          onSuccess: () => {
            notify("Opportunity updated successfully", { type: "success" });
            if (onModeToggle) {
              onModeToggle(); // Switch back to view mode
            }
          },
          onError: (error: any) => {
            notify(error?.message || "Failed to update opportunity", { type: "error" });
          },
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onModeToggle) {
      onModeToggle();
    }
  };

  if (mode === "edit") {
    return (
      <Form defaultValues={record} onSubmit={handleSave} className="space-y-3">
        <TextInput source="name" label="Opportunity Name" helperText={false} fullWidth />
        <TextInput
          source="description"
          label="Description"
          helperText={false}
          multiline
          rows={3}
          fullWidth
        />
        <SelectInput
          source="stage"
          label="Stage"
          choices={OPPORTUNITY_STAGE_CHOICES}
          helperText={false}
          fullWidth
        />
        <SelectInput
          source="priority"
          label="Priority"
          choices={[
            { id: "low", name: "Low" },
            { id: "medium", name: "Medium" },
            { id: "high", name: "High" },
            { id: "critical", name: "Critical" },
          ]}
          helperText={false}
          fullWidth
        />
        <LeadSourceInput />
        <TextInput
          source="estimated_close_date"
          label="Estimated Close Date"
          type="date"
          helperText={false}
          fullWidth
        />

        {/* Campaign and workflow fields */}
        <TextInput source="campaign" label="Campaign" helperText={false} fullWidth />
        <TextInput source="notes" label="Notes" multiline rows={2} helperText={false} fullWidth />
        <TextInput source="next_action" label="Next Action" helperText={false} fullWidth />
        <TextInput
          source="next_action_date"
          label="Next Action Date"
          type="date"
          helperText={false}
          fullWidth
        />
        <TextInput
          source="decision_criteria"
          label="Decision Criteria"
          multiline
          rows={2}
          helperText={false}
          fullWidth
        />

        {/* Organizations section */}
        <div className="pt-4 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground block mb-4">Organizations</span>
          <div className="space-y-4">
            <ReferenceInput source="customer_organization_id" reference="organizations">
              <AutocompleteInput
                label="Customer Organization *"
                optionText="name"
                filterToQuery={(searchText: string) => ({ q: searchText })}
                helperText="The customer organization for this opportunity"
                fullWidth
              />
            </ReferenceInput>

            <ReferenceInput source="principal_organization_id" reference="organizations">
              <AutocompleteInput
                label="Principal Organization *"
                optionText="name"
                filterToQuery={(searchText: string) => ({ q: searchText })}
                helperText="The principal/manufacturer organization"
                fullWidth
              />
            </ReferenceInput>

            <ReferenceInput source="distributor_organization_id" reference="organizations">
              <AutocompleteInput
                label="Distributor Organization"
                optionText="name"
                filterToQuery={(searchText: string) => ({ q: searchText })}
                helperText="Optional distributor organization"
                fullWidth
              />
            </ReferenceInput>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </Form>
    );
  }

  // View mode
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getStageBadgeVariant = (stage: string) => {
    if (stage === "closed_won") return "default";
    if (stage === "closed_lost") return "destructive";
    return "secondary";
  };

  const getPriorityBadgeVariant = (priority: string) => {
    if (priority === "critical") return "destructive";
    if (priority === "high") return "default";
    if (priority === "medium") return "secondary";
    return "outline";
  };

  // Organization card component for view mode
  const OrganizationCard = ({
    organizationId,
    label,
    required = false,
  }: {
    organizationId: number | null;
    label: string;
    required?: boolean;
  }) => {
    const { data: org, isLoading } = useGetOne(
      "organizations",
      { id: organizationId! },
      { enabled: isActiveTab && !!organizationId }
    );

    if (!organizationId && !required) {
      return null;
    }

    if (isLoading) {
      return (
        <div className="border border-border rounded-lg p-3">
          <label className="text-xs font-medium text-muted-foreground block mb-2">{label}</label>
          <div className="h-5 bg-muted animate-pulse rounded" />
        </div>
      );
    }

    if (!org) {
      return (
        <div className="border border-border rounded-lg p-3">
          <label className="text-xs font-medium text-muted-foreground block mb-2">{label}</label>
          <p className="text-sm text-muted-foreground">Not set</p>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <label className="text-xs font-medium text-muted-foreground block mb-2">{label}</label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/organizations?view=${org.id}`}
              className="text-sm font-medium hover:underline block truncate"
            >
              {org.name}
            </Link>
            {org.type && (
              <p className="text-xs text-muted-foreground capitalize">
                {org.type.replace(/_/g, " ")}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const stageName =
    OPPORTUNITY_STAGE_CHOICES.find((choice) => choice.id === record.stage)?.name || record.stage;

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <span className="text-sm font-medium text-muted-foreground">Name</span>
        <p className="text-base mt-1">{record.name || "N/A"}</p>
      </div>

      {/* Description */}
      {record.description && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Description</span>
          <p className="text-base mt-1 whitespace-pre-wrap">{record.description}</p>
        </div>
      )}

      {/* Stage */}
      <div>
        <span className="text-sm font-medium text-muted-foreground">Stage</span>
        <div className="mt-1">
          <Badge variant={getStageBadgeVariant(record.stage || "")}>{stageName}</Badge>
        </div>
      </div>

      {/* Priority */}
      {record.priority && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Priority</span>
          <div className="mt-1">
            <Badge variant={getPriorityBadgeVariant(record.priority)}>
              {record.priority.charAt(0).toUpperCase() + record.priority.slice(1)}
            </Badge>
          </div>
        </div>
      )}

      {/* Lead Source */}
      {record.lead_source && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Lead Source</span>
          <p className="text-base mt-1">
            {record.lead_source.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
        </div>
      )}

      {/* Estimated Close Date */}
      <div>
        <span className="text-sm font-medium text-muted-foreground">Estimated Close Date</span>
        <p className="text-base mt-1">{formatDate(record.estimated_close_date)}</p>
      </div>

      {/* Campaign */}
      {record.campaign && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Campaign</span>
          <p className="text-base mt-1">{record.campaign}</p>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Notes</span>
          <p className="text-base mt-1 whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}

      {/* Next Action */}
      {record.next_action && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Next Action</span>
          <p className="text-base mt-1">{record.next_action}</p>
        </div>
      )}

      {/* Next Action Date */}
      {record.next_action_date && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Next Action Date</span>
          <p className="text-base mt-1">{formatDate(record.next_action_date)}</p>
        </div>
      )}

      {/* Decision Criteria */}
      {record.decision_criteria && (
        <div>
          <span className="text-sm font-medium text-muted-foreground">Decision Criteria</span>
          <p className="text-base mt-1 whitespace-pre-wrap">{record.decision_criteria}</p>
        </div>
      )}

      {/* Organizations */}
      <div className="pt-4 border-t border-border">
        <span className="text-sm font-medium text-muted-foreground block mb-3">Organizations</span>
        <div className="grid gap-3">
          <OrganizationCard
            organizationId={record.customer_organization_id}
            label="Customer"
            required
          />
          <OrganizationCard
            organizationId={record.principal_organization_id}
            label="Principal"
            required
          />
          <OrganizationCard
            organizationId={record.distributor_organization_id}
            label="Distributor"
          />
        </div>
      </div>

      {/* Timestamps */}
      <div className="pt-4 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created</span>
          <span>{formatDate(record.created_at)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Updated</span>
          <span>{formatDate(record.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
