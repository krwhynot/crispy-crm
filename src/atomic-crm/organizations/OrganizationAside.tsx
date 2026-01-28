import { Globe, Linkedin, Phone } from "lucide-react";
import { useRecordContext } from "ra-core";
import { EditButton } from "@/components/ra-wrappers/edit-button";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { ShowButton } from "@/components/ra-wrappers/show-button";
import { TextField } from "@/components/ra-wrappers/text-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { UrlField } from "@/components/ra-wrappers/url-field";
import { SelectField } from "@/components/ra-wrappers/select-field";

import { AsideSection } from "@/components/ui";
import { SaleName } from "../sales/SaleName";
import type { Company } from "../types";
import { ParentOrganizationSection } from "./ParentOrganizationSection";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES } from "./constants";

interface OrganizationAsideProps {
  link?: string;
}

export const OrganizationAside = ({ link = "edit" }: OrganizationAsideProps) => {
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

      <ParentOrganizationSection />

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
        <div className="flex flex-row items-center gap-1 min-h-11">
          <Globe className="w-4 h-4" />
          <UrlField
            source="website"
            target="_blank"
            rel="noopener"
            content={record.website.replace("http://", "").replace("https://", "")}
          />
        </div>
      )}
      {record.linkedin_url && (
        <div className="flex flex-row items-center gap-1 min-h-11">
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
        <div className="flex flex-row items-center gap-1 min-h-11">
          <Phone className="w-4 h-4" />
          <a href={`tel:${record.phone}`} className="underline hover:no-underline">
            {record.phone}
          </a>
        </div>
      )}
    </AsideSection>
  );
};

const ContextInfo = ({ record }: { record: Company }) => {
  if (!record.id) {
    return null;
  }

  return (
    <AsideSection title="Context">
      {record.organization_type && (
        <span>
          Type: <SelectField source="organization_type" choices={[...ORGANIZATION_TYPE_CHOICES]} />
        </span>
      )}
      {record.priority && (
        <span>
          Priority: <SelectField source="priority" choices={[...PRIORITY_CHOICES]} />
        </span>
      )}
      {record.segment_id && (
        <span>
          Segment:{" "}
          <ReferenceField source="segment_id" reference="segments" link={false}>
            <TextField source="name" />
          </ReferenceField>
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
      {record.description && <p className="text-sm  mb-1">{record.description}</p>}
      {record.parent_organization_id && (
        <div className="text-sm text-muted-foreground mb-1">
          Parent organization:{" "}
          <ReferenceField source="parent_organization_id" reference="organizations" record={record}>
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
            ) : null
          )}
        </div>
      )}
      {record.sales_id !== null && (
        <div className="text-sm text-muted-foreground mb-1">
          Followed by{" "}
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
