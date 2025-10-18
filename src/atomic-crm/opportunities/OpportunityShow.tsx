import { useMutation } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
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

const OpportunityShow = () => (
  <ShowBase>
    <OpportunityShowContent />
  </ShowBase>
);

const OpportunityShowContent = () => {
  const { record, isPending } = useShowContext<Opportunity>();
  const navigate = useNavigate();

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
        <CardContent className="pt-6">
          <OpportunityHeader
            mode="show"
            ArchiveButton={ArchiveButton}
            UnarchiveButton={UnarchiveButton}
          />

          <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="pt-4">
              <div className="flex gap-8 mb-4">
                <div className="flex flex-col min-w-[150px]">
                  <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                    Expected closing date
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isValid(new Date(record.estimated_close_date))
                        ? format(new Date(record.estimated_close_date), "PP")
                        : "Invalid date"}
                    </span>
                    {new Date(record.estimated_close_date) < new Date() ? (
                      <Badge variant="destructive">Past</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col min-w-[150px]">
                  <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                    Stage
                  </span>
                  <span className="text-sm">
                    {findOpportunityLabel(opportunityStageChoices, record.stage)}
                  </span>
                </div>

                <div className="flex flex-col min-w-[150px]">
                  <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
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
                        ? "border-transparent bg-[var(--warning-default)] text-white hover:bg-[var(--warning-hover)]"
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
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                        Opportunity Owner
                      </span>
                      <ReferenceField
                        source="opportunity_owner_id"
                        reference="sales"
                        link={false}
                      />
                    </div>
                  )}

                  {record.account_manager_id && (
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                        Account Manager
                      </span>
                      <ReferenceField
                        source="account_manager_id"
                        reference="sales"
                        link={false}
                      />
                    </div>
                  )}

                  {record.lead_source && (
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                        Lead Source
                      </span>
                      <span className="text-sm">
                        {record.lead_source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Organization Details */}
              <div className="flex gap-8 mb-4">
                <div className="flex flex-col min-w-[150px]">
                  <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                    Customer Organization
                  </span>
                  <ReferenceField
                    source="customer_organization_id"
                    reference="organizations"
                    link="show"
                  />
                </div>

                {record.principal_organization_id && (
                  <div className="flex flex-col min-w-[150px]">
                    <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                      Principal Organization
                    </span>
                    <ReferenceField
                      source="principal_organization_id"
                      reference="organizations"
                      link="show"
                    />
                  </div>
                )}

                {record.distributor_organization_id && (
                  <div className="flex flex-col min-w-[150px]">
                    <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase">
                      Distributor Organization
                    </span>
                    <ReferenceField
                      source="distributor_organization_id"
                      reference="organizations"
                      link="show"
                    />
                  </div>
                )}
              </div>

              {!!record.contact_ids?.length && (
                <div className="mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase mb-2">
                      Contacts
                    </span>
                    <ReferenceArrayField
                      source="contact_ids"
                      reference="contacts_summary"
                    >
                      <ContactList />
                    </ReferenceArrayField>
                  </div>
                </div>
              )}

              {record.description && (
                <div className="mb-4 whitespace-pre-line">
                  <span className="text-xs text-[color:var(--text-subtle)] tracking-wide uppercase mb-2 block">
                    Description
                  </span>
                  <p className="text-sm leading-6">{record.description}</p>
                </div>
              )}
            </TabsContent>

            {/* Notes & Activity Tab */}
            <TabsContent value="notes" className="pt-4">
              <ReferenceManyField
                target="opportunity_id"
                reference="opportunityNotes"
                sort={{ field: "created_at", order: "DESC" }}
                empty={<NoteCreate reference={"opportunities"} />}
              >
                <NotesIterator reference="opportunities" />
              </ReferenceManyField>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const ArchivedTitle = () => (
  <div className="bg-orange-500 px-6 py-4">
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
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
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
      className="flex items-center gap-2 h-9"
    >
      <ArchiveRestore className="w-4 h-4" />
      Send back to the board
    </Button>
  );
};

export { OpportunityShow };
export default OpportunityShow;
