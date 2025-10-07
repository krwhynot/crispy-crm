import { Globe, Linkedin, Phone } from "lucide-react";
import { useRecordContext } from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { ShowButton } from "@/components/admin/show-button";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { UrlField } from "@/components/admin/url-field";
import { SelectField } from "@/components/admin/select-field";

import { AsideSection } from "../misc/AsideSection";
import { SaleName } from "../sales/SaleName";
import type { Company } from "../types";
import { sizes } from "./sizes";

interface OrganizationAsideProps {
  link?: string;
}

export const OrganizationAside = ({
  link = "edit",
}: OrganizationAsideProps) => {
  const record = useRecordContext<Company>();
  if (!record) return null;

  return (
    <div className="hidden sm:block w-[250px] min-w-[250px] space-y-4">
      <div className="flex flex-row space-x-1">
        {link === "edit" ? (
          <EditButton label="Edit Organization" />
        ) : (
          <ShowButton label="Show Organization" />
        )}
      </div>

      <OrganizationInfo record={record} />

      <AddressInfo record={record} />

      <ContextInfo record={record} />

      <AdditionalInfo record={record} />
    </div>
  );
};

const OrganizationInfo = ({ record }: { record: Company }) => {
  if (!record.website && !record.linkedin_url && !record.phone) {
    return null;
  }

  return (
    <AsideSection title="Organization Info">
      {record.website && (
        <div className="flex flex-row items-center gap-1 min-h-[24px]">
          <Globe className="w-4 h-4" />
          <UrlField
            source="website"
            target="_blank"
            rel="noopener"
            content={record.website
              .replace("http://", "")
              .replace("https://", "")}
          />
        </div>
      )}
      {record.linkedin_url && (
        <div className="flex flex-row items-center gap-1 min-h-[24px]">
          <Linkedin className="w-4 h-4" />
          <a
            className="underline hover:no-underline"
            href={record.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            title={record.linkedin_url}
          >
            LinkedIn
          </a>
        </div>
      )}
      {record.phone && (
        <div className="flex flex-row items-center gap-1 min-h-[24px]">
          <Phone className="w-4 h-4" />
          <TextField source="phone" />
        </div>
      )}
    </AsideSection>
  );
};

const ContextInfo = ({ record }: { record: Company }) => {
  const organizationTypeChoices = [
    { id: "customer", name: "Customer" },
    { id: "prospect", name: "Prospect" },
    { id: "partner", name: "Partner" },
    { id: "principal", name: "Principal" },
    { id: "distributor", name: "Distributor" },
    { id: "unknown", name: "Unknown" },
  ];

  const priorityChoices = [
    { id: "A", name: "A - High Priority" },
    { id: "B", name: "B - Medium-High Priority" },
    { id: "C", name: "C - Medium Priority" },
    { id: "D", name: "D - Low Priority" },
  ];

  if (!record.annual_revenue && !record.id) {
    return null;
  }

  return (
    <AsideSection title="Context">
      {record.organization_type && (
        <span>
          Type:{" "}
          <SelectField
            source="organization_type"
            choices={organizationTypeChoices}
          />
        </span>
      )}
      {record.priority && (
        <span>
          Priority: <SelectField source="priority" choices={priorityChoices} />
        </span>
      )}
      {record.segment && (
        <span>
          Segment: <TextField source="segment" />
        </span>
      )}
      {record.industry_id && (
        <span>
          Industry:{" "}
          <ReferenceField source="industry_id" reference="industries" link={false}>
            <TextField source="name" />
          </ReferenceField>
        </span>
      )}
      {record.employee_count && (
        <span>
          Employee Count: <SelectField source="employee_count" choices={sizes} />
        </span>
      )}
      {record.annual_revenue && (
        <span>
          Annual Revenue: <TextField source="annual_revenue" />
        </span>
      )}
    </AsideSection>
  );
};

const AddressInfo = ({ record }: { record: Company }) => {
  if (!record.address && !record.city && !record.postal_code && !record.state) {
    return null;
  }

  return (
    <AsideSection title="Main Address" noGap>
      <TextField source="address" />
      <TextField source="city" />
      <TextField source="postal_code" />
      <TextField source="state" />
    </AsideSection>
  );
};

const AdditionalInfo = ({ record }: { record: Company }) => {
  if (
    !record.created_at &&
    !record.sales_id &&
    !record.description &&
    !record.context_links &&
    !record.parent_organization_id
  ) {
    return null;
  }
  const getBaseURL = (url: string) => {
    const urlObject = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObject.hostname;
  };

  return (
    <AsideSection title="Additional Info">
      {record.description && (
        <p className="text-sm  mb-1">{record.description}</p>
      )}
      {record.parent_organization_id && (
        <div className="inline-flex text-sm text-muted-foreground mb-1">
          Parent organization:&nbsp;
          <ReferenceField
            source="parent_organization_id"
            reference="organizations"
            record={record}
          >
            <TextField source="name" />
          </ReferenceField>
        </div>
      )}
      {record.context_links && (
        <div className="flex flex-col">
          {record.context_links.map((link, index) =>
            link ? (
              <a
                key={index}
                className="text-sm underline hover:no-underline mb-1"
                href={link.startsWith("http") ? link : `https://${link}`}
                target="_blank"
                rel="noopener noreferrer"
                title={link}
              >
                {getBaseURL(link)}
              </a>
            ) : null,
          )}
        </div>
      )}
      {record.sales_id !== null && (
        <div className="inline-flex text-sm text-muted-foreground mb-1">
          Followed by&nbsp;
          <ReferenceField source="sales_id" reference="sales" record={record}>
            <SaleName />
          </ReferenceField>
        </div>
      )}
      {record.created_at && (
        <p className="text-sm text-muted-foreground mb-1">
          Added on{" "}
          <DateField
            source="created_at"
            record={record}
            options={{
              year: "numeric",
              month: "long",
              day: "numeric",
            }}
          />
        </p>
      )}
    </AsideSection>
  );
};
