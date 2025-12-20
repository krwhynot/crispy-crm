/**
 * Kanban Board Components
 *
 * This module contains all components related to the Kanban board view
 * of opportunities. The main entry point is OpportunityListContent.
 *
 * Component hierarchy:
 * - OpportunityListContent (main board with drag-drop context)
 *   - ColumnCustomizationMenu (visibility controls)
 *   - OpportunityColumn (stage column with droppable area)
 *     - QuickAddOpportunity (inline create form)
 *     - OpportunityCard (draggable card)
 *       - StageStatusDot (days in stage indicator)
 *       - OpportunityCardActions (action menu)
 */

export { OpportunityListContent } from "./OpportunityListContent";
export { OpportunityColumn } from "./OpportunityColumn";
export { OpportunityCard } from "./OpportunityCard";
export { OpportunityCardActions } from "./OpportunityCardActions";
export { QuickAddOpportunity } from "./QuickAddOpportunity";
export { ColumnCustomizationMenu } from "./ColumnCustomizationMenu";
export { StageStatusDot } from "./StageStatusDot";
