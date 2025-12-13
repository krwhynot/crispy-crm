# Consistency Anti-Patterns
Generated: Sat Dec 13 11:48:26 CST 2025

## Hardcoded Tailwind Colors (should use semantic tokens)

## Raw Hex Colors
/home/krwhynot/projects/crispy-crm/src/atomic-crm/reports/README.md:688:- **Code**: `brand600: computedStyles.getPropertyValue('--brand-600') || '#2a2a2a'`
/home/krwhynot/projects/crispy-crm/src/atomic-crm/reports/README.md:690:- **Impact**: Falls back to `#2a2a2a` (acceptable)
/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/hooks/useResourceNamesBase.ts:26: * @param fallbackPrefix - Prefix for fallback names (e.g., "Sales" → "Sales #123")

## Touch Targets Below 44px (h-10 or smaller)
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationListFilter.tsx:58:        <FilterCategory icon={<Tag className="h-4 w-4" />} label="Organization Type">
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationListFilter.tsx:80:        <FilterCategory icon={<Star className="h-4 w-4" />} label="Priority">
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationListFilter.tsx:101:          <FilterCategory icon={<Truck className="h-4 w-4" />} label="Playbook Category">
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationListFilter.tsx:120:          <FilterCategory icon={<Store className="h-4 w-4" />} label="Operator Segment">
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationListFilter.tsx:137:        <FilterCategory icon={<Users className="h-4 w-4" />} label="Account Manager">
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ActivitiesTab.tsx:32:            <Skeleton className="h-4 w-32 mb-2" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ActivitiesTab.tsx:33:            <Skeleton className="h-3 w-full mb-1" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ActivitiesTab.tsx:34:            <Skeleton className="h-3 w-3/4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ActivitiesTab.tsx:52:          <Plus className="h-4 w-4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:125:                <CheckCircle2 className="h-5 w-5 text-success" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:130:                <AlertTriangle className="h-5 w-5 text-warning" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:135:                <CheckCircle2 className="h-5 w-5 text-success" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:157:                <CheckCircle2 className="h-8 w-8 text-success opacity-20" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:169:                <AlertTriangle className="h-8 w-8 text-warning opacity-20" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:181:                <X className="h-8 w-8 text-error opacity-20" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:192:            <div className="h-2 bg-muted rounded-full overflow-hidden">
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:205:              <Clock className="h-4 w-4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:241:                  <AlertCircle className="h-4 w-4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:251:                    <Download className="h-3 w-3" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:293:              <AlertTriangle className="h-4 w-4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx:308:                  <FileText className="h-4 w-4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AuthorizationsTab.tsx:184:            <Skeleton className="h-4 w-32 mb-2" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AuthorizationsTab.tsx:185:            <Skeleton className="h-3 w-full mb-1" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AuthorizationsTab.tsx:186:            <Skeleton className="h-3 w-3/4" />
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AuthorizationsTab.tsx:209:          <Plus className="h-4 w-4 mr-1" />

## Hardcoded Form Defaults (should use schema.partial().parse({}))
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationCreate.tsx:217:            <Form key={formKey} defaultValues={formDefaults}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/sales/SalesCreate.tsx:50:          <SimpleForm onSubmit={onSubmit as SubmitHandler<any>} defaultValues={formDefaults}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/tasks/TaskCreate.tsx:32:  const defaultValues = {
/home/krwhynot/projects/crispy-crm/src/atomic-crm/tasks/TaskCreate.tsx:41:          <Form defaultValues={defaultValues}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactCreate.tsx:48:          <Form defaultValues={formDefaults}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCreate.tsx:46:          <Form defaultValues={formDefaults}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx:43:  const defaultValues = {
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/ActivityNoteForm.tsx:94:    defaultValues: {
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityEdit.tsx:46:      defaultValues={record}
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx:130:        defaultValues={record}
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunityContactsTab.tsx:85:        defaultValues={{ contact_ids: record.contact_ids || [] }}
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunityProductsTab.tsx:94:        defaultValues={{ product_ids: currentProductIds }}
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx:116:              defaultValues={{
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx:156:              defaultValues={{
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx:245:              defaultValues={{
/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx:301:                  defaultValues={{
/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx:76:  const defaultValues = useMemo(() => {
/home/krwhynot/projects/crispy-crm/src/atomic-crm/activities/ActivityCreate.tsx:34:          <Form defaultValues={defaultValues}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/products/ProductEdit.tsx:41:      defaultValues={{
/home/krwhynot/projects/crispy-crm/src/atomic-crm/products/ProductCreate.tsx:28:  const defaultValues = {
/home/krwhynot/projects/crispy-crm/src/atomic-crm/products/ProductCreate.tsx:37:          <Form defaultValues={defaultValues}>
/home/krwhynot/projects/crispy-crm/src/atomic-crm/notes/NoteCreate.tsx:42:      <Form defaultValues={formDefaults}>

## Deprecated: company_id (use junction table)

## Deprecated: archived_at (use deleted_at)

## Forms Missing aria-invalid
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ActivitiesTab.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportResult.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AuthorizationsTab.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/__tests__/BulkReassignButton.test.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/__tests__/AuthorizationsTab.test.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/__tests__/useDuplicateOrgCheck.test.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationImportDialog.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationShow.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationEdit.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/useOrganizationImport.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationType.spec.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/BulkReassignButton.tsx
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/organizationImport.logic.test.ts
/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/OrganizationInputs.tsx

---
Agent 3 complete ✅
