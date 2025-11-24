import * as React from "react";
import type { Opportunity } from "../types";

const OpportunityList = React.lazy(() => import("./OpportunityList"));
const OpportunityCreate = React.lazy(() => import("./OpportunityCreate"));
const OpportunityEdit = React.lazy(() => import("./OpportunityEdit"));

export default {
  list: OpportunityList,
  create: OpportunityCreate,
  edit: OpportunityEdit,
  recordRepresentation: (record: Opportunity) => record?.name || "Opportunity",
};
