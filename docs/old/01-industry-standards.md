# Industry Standards for CRM Dashboard & Reports

## Executive Summary

This document synthesizes best practices from Ant Design, React Admin, and Chart.js for building accessible, data-dense dashboard interfaces. Key principles include information hierarchy (summary → filters → details), cognitive load management (5-9 modules maximum), and WCAG 2.1 AA compliance for canvas-based visualizations.

---

## Dashboard Layout Standards

### Organizational Principles (Ant Design)

**Visual Priority**: Top-to-bottom, left-to-right flow
- Most critical KPIs and charts occupy top-left quadrant
- Supporting details appear below or to the right
- Vertical scroll acceptable; horizontal scroll avoided

**Module Limit**: 5-9 modules per view
- Prevents cognitive overload
- Groups related metrics using visual hierarchy (cards, sections)
- Uses progressive disclosure for drill-down data

**Information Hierarchy**:
1. **Summary** — High-level KPIs (top of page)
2. **Filters** — Date range, user selection, view controls (below summary)
3. **Details** — Charts, tables, granular data (main content area)

### Focus & Accuracy
- Each chart must have a clear purpose explained via title/subtitle
- Use correct chart type for data relationship (see Chart Selection Guidelines)
- Avoid decorative charts that don't drive decision-making

---

## KPI Card Anatomy

Standard elements for metric cards (based on Ant Design Pro StatisticCard):

| Element | Purpose | Example |
|---------|---------|---------|
| **Title** | Metric name | "Pipeline Value" |
| **Value** | Primary number | "$1.2M" |
| **Trend** | Change indicator | "+12% vs last month" |
| **Subtitle** | Context/explanation | "Total weighted opportunities" |
| **Variant** | Status badge | success, processing, error, warning |
| **Icon** | Visual identifier | Chart icon, dollar sign |

### Advanced Patterns
- **Chart Placement**: Mini sparklines left/right/bottom of value
- **Grouping**: Use Divider component between related KPIs
- **Interactive States**: Hover reveals detailed tooltip, click drills into filtered view

---

## Chart Selection Guidelines

Choose chart types based on data relationship:

| Data Type | Recommended Chart | Use Case |
|-----------|-------------------|----------|
| **Proportions** | Doughnut/Pie | Opportunities by stage (%), revenue by principal |
| **Trends over time** | Line/Area | Pipeline value weekly, activity count monthly |
| **Comparisons** | Bar (horizontal) | Top 10 distributors by revenue, rep performance ranking |
| **Multi-series** | Grouped Bar | Quarterly revenue by principal, stage conversion by rep |
| **Part-to-whole** | Stacked Bar | 100% stacked stages, cumulative activity types |

### Chart Best Practices
- Always provide axis labels and units
- Use consistent color palette across dashboard
- Limit data series to 5-7 per chart (cognitive load)
- Show data labels for small datasets (<10 points)

---

## Filter UX Conventions

### Filter Bar Layout
- **Position**: Top of content area, below page header
- **Left-to-right priority**:
  1. Date range picker (leftmost — most common filter)
  2. Category filters (rep, principal, stage)
  3. Action buttons (Export, Reset)

### Filter State Visibility
- **Applied Filters**: Show chips/badges indicating active filters
- **Clear Action**: "Reset all" button when filters applied
- **Defaults**: Sensible defaults (e.g., "Last 30 days") shown on load

### Responsive Behavior
- Filters collapse to dropdown menu on narrow screens
- Date range picker remains visible (critical control)

---

## Accessibility Requirements (WCAG 2.1 AA)

### Canvas Chart Accessibility
Canvas elements require alternative text and fallback content:

```html
<canvas role="img" aria-label="Pipeline value by stage: Discovery $250K, Proposal $500K, Negotiation $300K">
  <p>Pipeline breakdown: Discovery accounts for 25% ($250K), Proposal 50% ($500K), Negotiation 25% ($300K)</p>
</canvas>
```

**Requirements**:
- `role="img"` — Announces canvas as image to screen readers
- `aria-label` — Describes chart data in text form
- Fallback content inside `<canvas>` tags for non-visual users

### Interactive Elements
- **Keyboard Navigation**: All filters, legends, tooltips accessible via Tab/Enter/Space
- **Focus Indicators**: Visible outline on focused elements (min 2px contrast ratio 3:1)
- **Touch Targets**: Minimum 44x44px for mobile/tablet (Crispy CRM standard)

### Color & Contrast
- Text meets 4.5:1 contrast ratio (normal text), 3:1 for large text (≥18pt)
- Do not rely solely on color to convey information (use patterns, labels, icons)

---

## Sources

- [Ant Design Visualization Page Specification](https://github.com/ant-design/ant-design/blob/master/docs/spec/visualization-page.en-US.md)
- [Ant Design Pro StatisticCard Component](https://github.com/ant-design/pro-components/blob/master/site/components/card/StatisticCard/index.en-US.md)
- [Chart.js Accessibility Documentation](https://github.com/chartjs/Chart.js/blob/master/docs/general/accessibility.md)
- [React Admin Dashboard Guide](https://github.com/marmelab/react-admin/blob/master/docs/Admin.md)
