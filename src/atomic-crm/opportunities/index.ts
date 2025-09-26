import * as React from "react";
const OpportunityList = React.lazy(() => import("./OpportunityList"));
const OpportunityCreate = React.lazy(() => import("./OpportunityCreate"));
const OpportunityEdit = React.lazy(() => import("./OpportunityEdit"));
const OpportunityShow = React.lazy(() => import("./OpportunityShow"));

export default {
  list: OpportunityList,
  create: OpportunityCreate,
  edit: OpportunityEdit,
  show: OpportunityShow,
};