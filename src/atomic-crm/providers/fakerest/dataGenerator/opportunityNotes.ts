import { datatype, lorem, random } from "faker/locale/en_US";

import type { OpportunityNote } from "../../../types";
import type { Db } from "./types";
import { randomDate } from "./utils";

export const generateOpportunityNotes = (db: Db): OpportunityNote[] => {
  return Array.from(Array(100).keys()).map((id) => {
    const opportunity = random.arrayElement(db.opportunities);
    const created_at = randomDate(
      new Date(opportunity.created_at),
      opportunity.actual_close_date ? new Date(opportunity.actual_close_date) : new Date()
    ).toISOString();

    return {
      id,
      opportunity_id: opportunity.id,
      text: lorem.paragraphs(datatype.number({ min: 1, max: 3 })),
      date: created_at,
      sales_id: opportunity.sales_id,
      attachments: datatype.boolean() ? [
        {
          src: `https://example.com/attachment-${id}.pdf`,
          title: `Document ${id}`,
          rawFile: new File([''], `document-${id}.pdf`),
        }
      ] : undefined,
    };
  });
};