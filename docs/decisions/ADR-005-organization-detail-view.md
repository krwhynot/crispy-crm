# ADR-005: Organization Detail View Pattern

## Status
Accepted

## Date
2025-12-02

## Context
The Organizations module currently has two competing detail view patterns:

1. **OrganizationShow.tsx** - Full page detail view at `/organizations/:id/show`
2. **OrganizationSlideOver.tsx** - Sheet/drawer pattern triggered from list

This violates Jakob's Law: *"Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know."*

Modern CRMs (Salesforce Lightning, HubSpot, Pipedrive) have converged on the slide-over/drawer pattern for detail views because:
- Maintains list context (user can see where they came from)
- Faster navigation between records
- Better mobile responsiveness
- Reduces cognitive load of full page transitions

## Decision
Consolidate on the **SlideOver pattern** as the primary organization detail view.

## Deprecation Plan
| Phase | Sprint | Action |
|-------|--------|--------|
| A | Current | Add deprecation notice to OrganizationShow |
| B | Next | Redirect `/organizations/:id/show` to list with SlideOver open |
| C | Future | Remove OrganizationShow.tsx entirely |

## Consequences

### Positive
- Single pattern to maintain
- Consistent user experience
- Reduced bundle size
- Faster perceived navigation

### Negative
- Users with bookmarks to `/organizations/:id/show` will need redirect handling
- External links from emails/documents will change behavior
- Some power users may prefer full-page view (mitigated by SlideOver's expand option)

## Implementation Notes
- Add `@deprecated` JSDoc comment to OrganizationShow component
- Create redirect handler in routes (Phase B)
- Consider adding "Open in new tab" option to SlideOver header
- Track analytics on SlideOver vs Show usage before Phase C

## References
- [Jakob's Law - Laws of UX](https://lawsofux.com/jakobs-law/)
- [Salesforce Lightning Experience](https://www.salesforce.com/products/platform/lightning/)
