import { useMutation } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  ShowBase,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useUpdate,
} from "ra-core";

import {
  DeleteButton,
  EditButton,
  ReferenceArrayField,
  ReferenceField,
  ReferenceManyField,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { NoteCreate, NotesIterator } from "../notes";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Opportunity } from "../types";
import { ContactList } from "./ContactList";
import { findOpportunityLabel } from "./opportunity";

export const OpportunityShow = ({ open, id }: { open: boolean; id?: string }) => {
  const redirect = useRedirect();
  const handleClose = () => {
    redirect("list", "opportunities");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="lg:max-w-4xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <ShowBase id={id}>
            <OpportunityShowContent />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const OpportunityShowContent = () => {
  const record = useRecordContext<Opportunity>();
  if (!record) return null;

  const opportunityStageChoices = [
    { value: 'lead', label: 'Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'needs_analysis', label: 'Needs Analysis' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
    { value: 'nurturing', label: 'Nurturing' }
  ];

  return (
    <>
      <div className="space-y-2">
        {record.deleted_at ? <ArchivedTitle /> : null}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <ReferenceField
                source="customer_organization_id"
                reference="organizations"
                link="show"
              >
                <OrganizationAvatar />
              </ReferenceField>
              <h2 className="text-2xl font-semibold">{record.name}</h2>
            </div>
            <div className={`flex gap-2 ${record.deleted_at ? "" : "pr-12"}`}>
              {record.deleted_at ? (
                <>
                  <UnarchiveButton record={record} />
                  <DeleteButton />
                </>
              ) : (
                <>
                  <ArchiveButton record={record} />
                  <EditButton />
                </>
              )}
            </div>
          </div>

          <div className="flex gap-8 m-4">
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                Expected closing date
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {isValid(new Date(record.expected_closing_date))
                    ? format(new Date(record.expected_closing_date), "PP")
                    : "Invalid date"}
                </span>
                {new Date(record.expected_closing_date) < new Date() ? (
                  <Badge variant="destructive">Past</Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                Budget
              </span>
              <span className="text-sm">
                {record.amount.toLocaleString("en-US", {
                  notation: "compact",
                  style: "currency",
                  currency: "USD",
                  currencyDisplay: "narrowSymbol",
                  minimumSignificantDigits: 3,
                })}
              </span>
            </div>

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                Probability
              </span>
              <span className="text-sm">{record.probability}%</span>
            </div>

            {record.category && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  Category
                </span>
                <span className="text-sm">{record.category}</span>
              </div>
            )}

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                Stage
              </span>
              <span className="text-sm">
                {findOpportunityLabel(opportunityStageChoices, record.stage)}
              </span>
            </div>

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                Priority
              </span>
              <Badge variant={
                record.priority === 'critical' ? 'destructive' :
                record.priority === 'high' ? 'default' :
                record.priority === 'medium' ? 'secondary' : 'outline'
              }>
                {record.priority}
              </Badge>
            </div>
          </div>

          {/* Organization Details */}
          <div className="flex gap-8 m-4">
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                Customer Organization
              </span>
              <ReferenceField
                source="customer_organization_id"
                reference="organizations"
                link="show"
              >
                <span className="text-sm">{record.customer_organization_id}</span>
              </ReferenceField>
            </div>

            {record.principal_organization_id && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  Principal Organization
                </span>
                <ReferenceField
                  source="principal_organization_id"
                  reference="organizations"
                  link="show"
                >
                  <span className="text-sm">{record.principal_organization_id}</span>
                </ReferenceField>
              </div>
            )}

            {record.distributor_organization_id && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  Distributor Organization
                </span>
                <ReferenceField
                  source="distributor_organization_id"
                  reference="organizations"
                  link="show"
                >
                  <span className="text-sm">{record.distributor_organization_id}</span>
                </ReferenceField>
              </div>
            )}
          </div>

          {!!record.contact_ids?.length && (
            <div className="m-4">
              <div className="flex flex-col min-h-12 mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
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
            <div className="m-4 whitespace-pre-line">
              <span className="text-xs text-muted-foreground tracking-wide">
                Description
              </span>
              <p className="text-sm leading-6">{record.description}</p>
            </div>
          )}

          <div className="m-4">
            <Separator className="mb-4" />
            <ReferenceManyField
              target="opportunity_id"
              reference="opportunityNotes"
              sort={{ field: "date", order: "DESC" }}
              empty={<NoteCreate reference={"opportunities"} />}
            >
              <NotesIterator reference="opportunities" />
            </ReferenceManyField>
          </div>
        </div>
      </div>
    </>
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

  const { mutate } = useMutation({
    mutationFn: () => dataProvider.unarchiveOpportunity(record),
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