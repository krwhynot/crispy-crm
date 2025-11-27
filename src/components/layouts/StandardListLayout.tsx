/**
 * StandardListLayout - Unified layout for all resource list views
 *
 * Provides a standardized two-column layout with a filter sidebar and main content area.
 * This component enforces consistent spacing, semantic HTML structure, and accessibility
 * patterns across all resource list pages.
 *
 * @example
 * ```tsx
 * <StandardListLayout
 *   filterComponent={<ContactListFilter />}
 *   resource="contacts"
 * >
 *   <Datagrid>...</Datagrid>
 * </StandardListLayout>
 * ```
 *
 * Design System Compliance:
 * - Uses `.filter-sidebar` and `.card-container` utility classes
 * - Semantic HTML: `<aside>` for filters, `<main>` for content
 * - ARIA labels for screen reader navigation
 * - Sticky positioning for filter sidebar on desktop (remains visible on scroll)
 * - Responsive gap spacing (24px) for comfortable visual separation
 *
 * Responsive Behavior (Desktop-First):
 * - Base (mobile/tablet <1024px): Stacked vertical layout (flex-col)
 * - Desktop (≥1024px): Side-by-side two-column layout (lg:flex-row)
 * - Filter sidebar collapses above content on smaller screens
 *
 * @param filterComponent - React node containing filter UI components
 * @param children - Main content area (typically a Datagrid or table)
 * @param resource - Resource name for ARIA labels (e.g., "contacts", "opportunities")
 */

interface StandardListLayoutProps {
  /** Filter sidebar content (e.g., SearchInput, FilterCategories) */
  filterComponent: React.ReactNode;
  /** Main content area (typically React Admin Datagrid) */
  children: React.ReactNode;
  /** Resource name for accessibility labels */
  resource: string;
}

export function StandardListLayout({
  filterComponent,
  children,
  resource,
}: StandardListLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside
        aria-label={`Filter ${resource}`}
        className="filter-sidebar w-full lg:w-auto lg:sticky lg:top-[var(--spacing-section)] lg:h-fit"
      >
        <div className="card-container p-2">{filterComponent}</div>
      </aside>
      <main role="main" aria-label={`${resource} list`} className="flex-1 min-w-0">
        <div className="card-container">{children}</div>
      </main>
    </div>
  );
}
