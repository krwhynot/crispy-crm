import { useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format, isValid, formatDistanceToNow, isPast } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  ShowBase,
  useDataProvider,
  useNotify,
  useRedirect,
  useRefresh,
  useShowContext,
  useUpdate,
} from "ra-core";
import { useMatch, useNavigate } from "react-router-dom";

import { OpportunitiesService } from "../services";
import { DETAIL_FIELD_MIN_WIDTH } from "./constants";

import { ReferenceArrayField } from "@/components/admin/reference-array-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NoteCreate, NotesIterator } from "../notes";
import type { Opportunity } from "../types";
import { ContactList } from "./ContactList";
import { findOpportunityLabel } from "./opportunity";
import { OpportunityHeader } from "./OpportunityHeader";
import { ActivityNoteForm } from "./ActivityNoteForm";
import { ActivitiesList } from "./ActivitiesList";
import { ChangeLogTab } from "./ChangeLogTab";
import { ProductsTable } from "./ProductsTable";
import { OrganizationInfoCard } from "./OrganizationInfoCard";
import { SaleAvatar } from "../sales/SaleAvatar";
import { WorkflowManagementSection } from "./WorkflowManagementSection";
import { ActivityTimelineFilters } from "./ActivityTimelineFilters";
import { RelatedOpportunitiesSection } from "./RelatedOpportunitiesSection";

const OpportunityShow = () => (
  <ShowBase>
    <OpportunityShowContent />
  </ShowBase>
);

const OpportunityShowContent = () => {
  const { record, isPending } = useShowContext<Opportunity>();
  const navigate = useNavigate();
  const [activityFilters, setActivityFilters] = useState<Record<string, any>>({});

  // Memoize the activities filter to prevent infinite re-renders
  // This ensures the filter object reference stays stable unless activityFilters changes
  const activitiesListFilter = useMemo(
    () => ({ activity_type: "interaction", ...activityFilters }),
    [activityFilters]
  );

  // Get tab from URL or default to "details"
  const tabMatch = useMatch("/opportunities/:id/show/:tab");
  const currentTab = tabMatch?.params?.tab || "details";

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === "details") {
      navigate(`/opportunities/${record?.id}/show`);
      return;
    }
    navigate(`/opportunities/${record?.id}/show/${value}`);
  };

  const opportunityStageChoices = [
    { value: "lead", label: "Lead" },
    { value: "qualified", label: "Qualified" },
    { value: "needs_analysis", label: "Needs Analysis" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" },
    { value: "nurturing", label: "Nurturing" },
  ];

  if (isPending || !record) return null;

  return (
    <div className="mt-2">
      {record.deleted_at ? <ArchivedTitle /> : null}
      <Card>
        <CardContent className="p-6">
          <OpportunityHeader
            mode="show"
            ArchiveButton={ArchiveButton}
            UnarchiveButton={UnarchiveButton}
          />

          <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
              <TabsTrigger value="history">Change Log</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="pt-4">
              {/* Organization Info Card - Featured Display */}
              <div className="mb-6">
                <OrganizationInfoCard opportunity={record} />
              </div>

              {/* Workflow Management Section */}
              <div className="mb-6">
                <WorkflowManagementSection />
              </div>

              {/* Related Opportunities Section */}
              <div className="mb-6">
                <RelatedOpportunitiesSection opportunity={record} />
              </div>

              <div className="flex gap-8 mb-4">
                <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                  <span className="text-xs text-muted-foreground tracking-wide uppercase">
                    Expected closing date
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isValid(new Date(record.estimated_close_date))
                        ? format(new Date(record.estimated_close_date), "PP")
                        : "Invalid date"}
                    </span>
                    {isValid(new Date(record.estimated_close_date)) && (
                      <>
                        {isPast(new Date(record.estimated_close_date)) ? (
                          <Badge variant="destructive">
                            {formatDistanceToNow(new Date(record.estimated_close_date), {
                              addSuffix: true,
                            })}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-primary/30"
                          >
                            {formatDistanceToNow(new Date(record.estimated_close_date), {
                              addSuffix: true,
                            })}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                  <span className="text-xs text-muted-foreground tracking-wide uppercase">
                    Stage
                  </span>
                  <span className="text-sm">
                    {findOpportunityLabel(opportunityStageChoices, record.stage)}
                  </span>
                </div>

                <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                  <span className="text-xs text-muted-foreground tracking-wide uppercase">
                    Priority
                  </span>
                  <Badge
                    variant={
                      record.priority === "critical"
                        ? "destructive"
                        : record.priority === "high"
                          ? "default"
                          : record.priority === "medium"
                            ? "secondary"
                            : "outline"
                    }
                    className={
                      record.priority === "high"
                        ? "border-transparent bg-warning text-white hover:bg-warning/90"
                        : ""
                    }
                  >
                    {record.priority}
                  </Badge>
                </div>
              </div>

              {(record.opportunity_owner_id || record.account_manager_id || record.lead_source) && (
                <div className="flex gap-8 mb-4">
                  {record.opportunity_owner_id && (
                    <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">
                        Opportunity Owner
                      </span>
                      <div className="flex items-center gap-2">
                        <ReferenceField
                          source="opportunity_owner_id"
                          reference="sales"
                          link={false}
                        >
                          <SaleAvatar size="sm" />
                        </ReferenceField>
                        <ReferenceField
                          source="opportunity_owner_id"
                          reference="sales"
                          link={false}
                        />
                      </div>
                    </div>
                  )}

                  {record.account_manager_id && (
                    <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">
                        Account Manager
                      </span>
                      <ReferenceField source="account_manager_id" reference="sales" link={false} />
                    </div>
                  )}

                  {record.lead_source && (
                    <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                      <span className="text-xs text-muted-foreground tracking-wide uppercase">
                        Lead Source
                      </span>
                      <span className="text-sm">
                        {record.lead_source
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!!record.contact_ids?.length && (
                <div className="mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground tracking-wide uppercase mb-2">
                      Contacts
                    </span>
                    <ReferenceArrayField source="contact_ids" reference="contacts_summary">
                      <ContactList />
                    </ReferenceArrayField>
                  </div>
                </div>
              )}

              {/* Created Date and Creator */}
              <div className="flex gap-8 mb-4">
                <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                  <span className="text-xs text-muted-foreground tracking-wide uppercase">
                    Created
                  </span>
                  <span className="text-sm">
                    {isValid(new Date(record.created_at))
                      ? format(new Date(record.created_at), "PPp")
                      : "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                  </span>
                </div>

                {record.created_by && (
                  <div className={`flex flex-col ${DETAIL_FIELD_MIN_WIDTH}`}>
                    <span className="text-xs text-muted-foreground tracking-wide uppercase">
                      Created By
                    </span>
                    <div className="flex items-center gap-2">
                      <ReferenceField source="created_by" reference="sales" link={false}>
                        <SaleAvatar size="sm" />
                      </ReferenceField>
                      <ReferenceField source="created_by" reference="sales" link={false} />
                    </div>
                  </div>
                )}
              </div>

              {record.description && (
                <div className="mb-4 whitespace-pre-line">
                  <span className="text-xs text-muted-foreground tracking-wide uppercase mb-2 block">
                    Description
                  </span>
                  <p className="text-sm leading-6">{record.description}</p>
                </div>
              )}

              <div className="mb-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground tracking-wide uppercase mb-2">
                    Products
                  </span>
                  <ProductsTable products={record.products || []} />
                </div>
              </div>
            </TabsContent>

            {/* Notes & Activity Tab */}
            <TabsContent value="notes" className="pt-4">
              <div className="space-y-8">
                {/* Activities Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Activities</h3>

                  {/* Activity Quick Add Form */}
                  <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
                    <h4 className="text-sm font-medium mb-3">Quick Add Activity</h4>
                    <ActivityNoteForm opportunity={record} />
                  </div>

                  {/* Activity Filters */}
                  <ActivityTimelineFilters onFiltersChange={setActivityFilters} />

                  {/* Activities List */}
                  <ReferenceManyField
                    target="opportunity_id"
                    reference="activities"
                    filter={activitiesListFilter}
                    sort={{ field: "activity_date", order: "DESC" }}
                  >
                    <ActivitiesList />
                  </ReferenceManyField>
                </div>

                {/* Notes Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <ReferenceManyField
                    target="opportunity_id"
                    reference="opportunityNotes"
                    sort={{ field: "created_at", order: "DESC" }}
                    empty={<NoteCreate reference={"opportunities"} />}
                  >
                    <NotesIterator reference="opportunities" />
                  </ReferenceManyField>
                </div>
              </div>
            </TabsContent>

            {/* Change Log Tab */}
            <TabsContent value="history" className="pt-4">
              <ChangeLogTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const ArchivedTitle = () => (
  <div className="bg-warning px-6 py-4">
    <h3 className="text-lg font-bold text-white">Archived Opportunity</h3>
  </div>
);

const ArchiveButton = ({ record }: { record: Opportunity }) => {
  const [update] = useUpdate();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();
  const handleClick = () => {
    update(
      "opportunities",
      {
        id: record.id,
        data: { deleted_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          redirect("list", "opportunities");
          notify("Opportunity archived", { type: "info", undoable: false });
          refresh();
        },
        onError: () => {
          notify("Error: opportunity not archived", { type: "error" });
        },
      }
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 min-h-[44px]"
    >
      <Archive className="w-4 h-4" />
      Archive
    </Button>
  );
};

const UnarchiveButton = ({ record }: { record: Opportunity }) => {
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const opportunitiesService = new OpportunitiesService(dataProvider);

  const { mutate } = useMutation({
    mutationFn: () => opportunitiesService.unarchiveOpportunity(record),
    onSuccess: () => {
      redirect("list", "opportunities");
      notify("Opportunity unarchived", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("Error: opportunity not unarchived", { type: "error" });
    },
  });

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 min-h-[44px]"
    >
      <ArchiveRestore className="w-4 h-4" />
      Send back to the board
    </Button>
  );
};

export { OpportunityShow };
export default OpportunityShow;
