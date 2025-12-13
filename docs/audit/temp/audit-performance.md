# Performance Anti-Patterns
Generated: Sat Dec 13 11:48:24 CST 2025

## Form mode:'onChange' (causes re-render on every keystroke)
None found ✓

## watch() without useWatch (full form re-renders)
src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx:51:  // This avoids infinite loops - form.watch() returns new object each render,
src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx:54:    const subscription = form.watch((value) => {

## Inline style={{}} (new object every render)
src/atomic-crm/organizations/OrganizationImportResult.tsx:197:                style={{ width: `${successRate}%` }}
src/atomic-crm/organizations/OrganizationCreate.tsx:89:        style={{ display: "none" }}
src/atomic-crm/organizations/OrganizationEmpty.tsx:11:      style={{
src/atomic-crm/reports/README.md:341:<div style={{ height }}>  {/* height prop: default '300px' */}
src/atomic-crm/pages/WhatsNew.tsx:315:                      style={{
src/atomic-crm/tasks/TaskEmpty.tsx:9:      style={{
src/atomic-crm/utils/contextMenu.tsx:83:      style={{ left: `${position.x}px`, top: `${position.y}px` }}
src/atomic-crm/layout/Header.tsx:45:                style={{
src/atomic-crm/contacts/ContactEmpty.tsx:10:      style={{
src/atomic-crm/contacts/ContactImportResult.tsx:213:                style={{ width: `${successRate}%` }}
src/atomic-crm/opportunities/OpportunityRowListView.tsx:212:                    style={{ backgroundColor: getOpportunityStageColor(opportunity.stage) }}
src/atomic-crm/opportunities/OpportunityEmpty.tsx:21:      style={{
src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx:111:                      style={{
src/atomic-crm/opportunities/BulkActionsToolbar.tsx:172:                      style={{ backgroundColor: getOpportunityStageColor(opp.stage) }}
src/atomic-crm/opportunities/BulkActionsToolbar.tsx:373:                      style={{ backgroundColor: getOpportunityStageColor(opp.stage) }}
src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx:145:                style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
src/atomic-crm/products/ProductGridList.tsx:25:      style={{

## Inline validators (recreated every render)

## Inline onClick handlers (potential memo breakers)
src/atomic-crm/organizations/ActivitiesTab.tsx:51:        <Button variant="outline" className="h-11 gap-2" onClick={() => setIsDialogOpen(true)}>
src/atomic-crm/organizations/AuthorizationsTab.tsx:208:        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="h-11">
src/atomic-crm/organizations/AuthorizationsTab.tsx:494:            onClick={() => setAddExceptionOpen(true)}
src/atomic-crm/organizations/AuthorizationsTab.tsx:562:                    onClick={() => setRemoveException(productAuth)}
src/atomic-crm/organizations/OrganizationImportDialog.tsx:909:                    onClick={() => fileInputRef.current?.click()}
src/atomic-crm/organizations/BranchLocationsSection.tsx:52:          onClick={() => {
src/atomic-crm/organizations/BranchLocationsSection.tsx:143:            onClick={() => setIsExpanded(true)}
src/atomic-crm/organizations/BranchLocationsSection.tsx:152:            onClick={() => setIsExpanded(false)}
src/atomic-crm/organizations/ParentOrganizationSection.tsx:121:                onClick={() => setShowAllSisters(true)}
src/atomic-crm/organizations/ParentOrganizationSection.tsx:130:                onClick={() => setShowAllSisters(false)}
src/atomic-crm/organizations/OrganizationImportPreview.tsx:179:            <CardHeader className="cursor-pointer" onClick={() => toggleSection("mappings")}>
src/atomic-crm/organizations/OrganizationImportPreview.tsx:274:              <CardHeader className="cursor-pointer" onClick={() => toggleSection("duplicates")}>
src/atomic-crm/organizations/OrganizationImportPreview.tsx:360:            <CardHeader className="cursor-pointer" onClick={() => toggleSection("sampleData")}>
src/atomic-crm/organizations/OrganizationImportPreview.tsx:419:              <CardHeader className="cursor-pointer" onClick={() => toggleSection("tags")}>
src/atomic-crm/settings/sections/PersonalSection.tsx:62:            onClick={() => setEditMode(!isEditMode)}
src/atomic-crm/settings/SettingsLayout.tsx:39:                  onClick={() => setActiveSection(section.id)}
src/atomic-crm/simple-list/ListNoResults.tsx:27:            <Button variant="outline" size="sm" onClick={() => setFilters({}, [])}>
src/atomic-crm/reports/CampaignActivity/StaleLeadsView.tsx:161:                            onClick={() => navigate(`/opportunities/${opp.id}/show`)}
src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:574:                      onClick={() => setDatePresetHandler("allTime")}
src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:581:                      onClick={() => setDatePresetHandler("last7")}

## Inline onChange handlers
src/atomic-crm/organizations/AuthorizationsTab.tsx:703:              onChange={(e) => setNotes(e.target.value)}
src/atomic-crm/organizations/AuthorizationsTab.tsx:868:              onChange={(e) => setNotes(e.target.value)}
src/atomic-crm/sales/SalesProfileTab.tsx:148:              onChange={(e) => handleChange("avatar_url", e.target.value)}
src/atomic-crm/sales/SalesProfileTab.tsx:170:                onChange={(e) => handleChange("first_name", e.target.value)}
src/atomic-crm/sales/SalesProfileTab.tsx:189:                onChange={(e) => handleChange("last_name", e.target.value)}
src/atomic-crm/sales/SalesProfileTab.tsx:212:              onChange={(e) => handleChange("email", e.target.value)}
src/atomic-crm/sales/SalesProfileTab.tsx:232:              onChange={(e) => handleChange("phone", e.target.value)}
src/atomic-crm/reports/WeeklyActivitySummary.tsx:180:            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
src/atomic-crm/reports/WeeklyActivitySummary.tsx:187:            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:609:                        onChange={(e) => {
src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx:629:                        onChange={(e) => {
src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx:153:                  onChange={(e) => handleCompletionToggle(e.target.checked)}
src/atomic-crm/opportunities/WorkflowManagementSection.tsx:156:              onChange={(e) => setNewTag(e.target.value)}
src/atomic-crm/opportunities/WorkflowManagementSection.tsx:179:            onChange={(e) => setNextAction(e.target.value)}
src/atomic-crm/opportunities/WorkflowManagementSection.tsx:200:            onChange={(e) => setNextActionDate(e.target.value)}
src/atomic-crm/opportunities/WorkflowManagementSection.tsx:233:                onChange={(e) => setDecisionCriteria(e.target.value)}
src/atomic-crm/opportunities/ActivityTimelineFilters.tsx:185:                    onChange={(e) => setDateFrom(e.target.value)}
src/atomic-crm/opportunities/ActivityTimelineFilters.tsx:197:                    onChange={(e) => setDateTo(e.target.value)}
src/atomic-crm/opportunities/ActivityNoteForm.tsx:157:                onChange={(e) => {
src/atomic-crm/opportunities/ChangeLogTab.tsx:325:                  onChange={(e) => setFilterDateFrom(e.target.value)}

---
Agent 2 complete ✅
