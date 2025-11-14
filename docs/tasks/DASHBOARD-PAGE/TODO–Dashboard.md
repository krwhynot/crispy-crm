# TODO – Principal Dashboard Layout Migration (MFB Garden to Table)

**Target Layout:** 1B frame (Top nav + collapsible left sidebar + right slide‑over)
**Columns:** Opportunities (40%) | Tasks (30%) | Quick Logger (30%)
**Design System:** Tailwind v4 CSS‑first, shadcn/ui, OKLCH tokens from `src/index.css` (single source of truth)

---

## 0) Scope & Outcome

* [ ] Replace current Principal Dashboard with new 3‑column layout + filters sidebar + right slide‑over.
* [ ] Preserve existing data provider (React Admin / Supabase) and routes.
* [ ] Apply MFB theme tokens (Forest Green / Clay / Paper Cream) across all widgets.
* [ ] Persist user prefs (column widths, task grouping, right‑panel last tab).
* [ ] Ship keyboard shortcuts and a11y (44px touch targets, focus ring, ARIA tree for hierarchy).

**Definition of Done**

* [ ] No hardcoded hex values; only semantic utilities (e.g., `bg-primary`, `border-border`).
* [ ] Layout responsive: ≥1024px 3‑col; 768–1023px 2‑col; <768px stacked.
* [ ] Opportunities hierarchy (Principal → Customer → Opp); smart expand top 3 customers by recency.
* [ ] Tasks column grouping toggle (Principal / Due / Priority) – persists per user; default **Due**.
* [ ] Quick Logger inline with optional "Create follow‑up task" subform.
* [ ] Right slide‑over (40vw, min 480 / max 720) remembers last tab.
* [ ] Lighthouse a11y score ≥ 95 on dashboard route.

---

## 1) Pre‑flight (Design System & Build)

* [ ] Confirm Tailwind v4 CSS‑first is active; **no** `tailwind.config.*`. Tokens reside in `src/index.css`.
* [ ] Verify semantic utility classes are available (e.g., `bg-background`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`).
* [ ] Ensure OKLCH tokens map to brand identity (Forest Green / Clay / Paper Cream). Do **not** import external color libs.
* [ ] Confirm shadcn/ui base components exist (Card, Button, Dialog/Sheet, Input, Select, Textarea, Skeleton).
* [ ] Run type checks and Storybook/Playroom if available to preview tokens on cards and buttons.

---

## 2) Routing & Shell

* [ ] Keep dashboard route unchanged (e.g., `<Admin dashboard={PrincipalDashboard} />` or app route alias).
* [ ] Add a feature flag (env or URL query `?layout=v2`) to toggle new layout during rollout.
* [ ] Create a migration branch `feat/dashboard-v2`.

---

## 3) Files to Add / Modify

**Add**

* [ ] `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`
* [ ] `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`
* [ ] `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`
* [ ] `src/atomic-crm/dashboard/v2/components/QuickLogger.tsx`
* [ ] `src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx`
* [ ] `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`
* [ ] `src/atomic-crm/dashboard/v2/hooks/useResizableColumns.ts`
* [ ] `src/atomic-crm/dashboard/v2/hooks/usePrefs.ts` (wrapper around `react-admin` store or localStorage)
* [ ] `src/atomic-crm/dashboard/v2/types.ts` (narrow UI types)

**Modify**

* [ ] `src/atomic-crm/dashboard/index.ts` (export V2 behind flag)
* [ ] `src/providers/dataProvider.ts` (ensure views exposure & select filters supported)

---

## 4) Header & Global Frame (Top Nav + Breadcrumbs)

* [ ] Integrate breadcrumbs: `Home / Principals / {PrincipalName}` under top bar.
* [ ] Principal selector (shadcn Select) in header; selection sets global context.
* [ ] Global search input `id="global-search"` for `/` hotkey focus.
* [ ] "New ▾" menu: Activity / Task / Opportunity (modal or slidesheet).

**Tokens**: `bg-background`, `text-foreground`, `border-border`, `h-11`, `rounded-lg`.

---

## 5) Columns & Resizing (3C)

* [ ] Create 3 flex children with widths 40/30/30 by default.
* [ ] Implement draggable separators using `useResizableColumns`:

  * [ ] Constraints: each column min 15%, max 70%.
  * [ ] Persist widths via `usePrefs('pd.colWidths')`.
  * [ ] Provide "Reset widths" in column menu.

**Snippet (TS) – `useResizableColumns.ts`**

```ts
export function useResizableColumns(initial = [40,30,30]) {
  const [widths, setWidths] = usePrefs<number[]>('pd.colWidths', initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ idx:number; startX:number; rect:DOMRect; start:number[] }|null>(null);
  const onMouseDown = (idx:number) => (e:React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    startRef.current = { idx, startX: e.clientX, rect, start: widths };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const onMove = (e:MouseEvent) => { /* compute %, clamp [15,70], setWidths */ };
  const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  return { containerRef, widths, onMouseDown, setWidths };
}
```

---

## 6) Left Sidebar Filters (5B)

Component: `FiltersSidebar.tsx`

* [ ] Health: checkboxes 🟢 active, 🟡 cooling, 🔴 at‑risk.
* [ ] Stage: multi‑select (from `opportunities.stage`, enum).
* [ ] Assignee: `me|team` (wire up to filter if backend supports; otherwise local filter for MVP).
* [ ] Last touch: select `Last 7d | Last 14d | Any` (client filter by `last_activity`).
* [ ] Principal search: typeahead list (updates header selector).
* [ ] Saved Views list (static for MVP, serialize filters later).
* [ ] Utilities: ☐ Show closed opps (applies `stage != 'closed_lost'`) | ☐ Group opps by customer (on by default).

**Tokens**: `bg-card`, `border-border`, `shadow-sm`, `rounded-lg`, `space-y-content`, `h-11`.

---

## 7) Opportunities Column (4D + 9D)

Component: `OpportunitiesHierarchy.tsx`

* [ ] Data source: `principal_opportunities` view via `useGetList` (React Admin).
* [ ] Client‑side group by **customer** within selected **principal**; tree = Principal → Customers → Opps.
* [ ] Smart expand: expand top 3 customers by **recency** (max `last_activity` per customer).
* [ ] Row content: health dot (by recency), opp name, stage, est close; amount (optional).
* [ ] Row click: opens right slide‑over; pass `{ type:'opp', oppId }`.
* [ ] A11y: ARIA tree pattern, keyboard left/right to expand/collapse.

**Optional DB view (recommended for performance)**
`supabase/migrations/xxxx_principal_customer_recency.sql`

```sql
create or replace view principal_customer_recency as
select
  p.id as principal_id,
  o.customer_organization_id as customer_id,
  max(coalesce(a.activity_date, o.updated_at)) as last_touch
from opportunities o
join organizations p on p.id = o.principal_organization_id and p.organization_type = 'principal'
left join activities a on a.opportunity_id = o.id and a.deleted_at is null
where o.deleted_at is null and o.stage != 'closed_lost'
group by p.id, o.customer_organization_id;
-- grant
grant select on principal_customer_recency to authenticated;
```

* [ ] Use this view to pre‑compute per‑customer recency; fallback to client calc if view not available.

**Tokens**: health colors map → `bg-success`, `bg-warning`, `bg-destructive`; rows `h-11`, card `shadow-sm`.

---

## 8) Tasks Column (6D)

Component: `TasksPanel.tsx`

* [ ] Data source: `priority_tasks` view via `useGetList`.
* [ ] Header toggle `Group:` Principal / Due / Priority (select); default **Due**.
* [ ] Grouping logic:

  * Principal → group by `principal_name`.
  * Due → Overdue / Today / Tomorrow / This Week / Later.
  * Priority → Critical / High / Medium / Low.
* [ ] Quick complete: checkbox removes task (optimistic `update` to `completed=true`).
* [ ] Filters: respect sidebar selections when applicable.

**Tokens**: priority badges → `bg-destructive`(critical), `bg-warning`(high), `bg-accent`(med), `bg-muted`(low); `text-foreground`.

---

## 9) Quick Logger Column (10D)

Component: `QuickLogger.tsx`

* [ ] Type buttons: ☎ / ✉ / 📅 / ✍ with `variant` states.
* [ ] Principal * (prefill from header context).
* [ ] Opportunity (progressive: show after principal chosen; list opps for that principal).
* [ ] Subject *, Description optional.
* [ ] ☐ Create follow‑up task → reveal title, due date, priority.
* [ ] Submit → `useCreate('activities')`; if follow‑up, `useCreate('tasks')`.
* [ ] On success: notify, clear fields (keep principal), refresh `principal_opportunities` & `priority_tasks`.

**Tokens**: `bg-card`, `border-border`, `rounded-lg`, `h-11`, primary button `bg-primary text-primary-foreground`.

---

## 10) Right Slide‑over (8C + 12C)

Component: `RightSlideOver.tsx`

* [ ] Width = `40vw` (min 480 / max 720). ESC closes.
* [ ] Tabs: Details | Activity History | Files; remember last via `usePrefs('pd.rightTab')`.
* [ ] Details: if an Opportunity is selected → fields (stage change action, amount, close date, contacts, latest notes).
* [ ] Activity History: `useGetList('activities', { filter:{ organization_id: principalId } })` sorted DESC.
* [ ] Inline log at bottom (contextual) → quick post to `activities`.

**Tokens**: `bg-card`, `shadow-md`, `border-border`, tab active underline `bg-primary`.

---

## 11) Persistence & Preferences

* [ ] Implement `usePrefs` using React Admin’s `useStore` or `localStorage` fallback:

  * Keys: `pd.colWidths`, `pd.taskGrouping`, `pd.rightTab`, `pd.sidebarOpen`.

**Snippet (TS) – `usePrefs.ts`**

```ts
import { useStore } from 'react-admin';
export function usePrefs<T>(key: string, def: T): [T, (v: T) => void] {
  const [value, setValue] = useStore<T>(key, def);
  return [value, setValue];
}
```

---

## 12) Keyboard & Accessibility

* [ ] `/` focuses `#global-search`.
* [ ] `1/2/3` scroll to columns; `H` opens slide‑over on History tab.
* [ ] ARIA: tree roles on hierarchy; `aria-expanded` for customer nodes; `role="separator"` for drag handles; proper labels.
* [ ] 44px minimum touch targets (`h-11`), visible focus ring using `ring` token.

---

## 13) Styling & Tokens Enforcement

* [ ] Replace any inline hex with semantic classes.
* [ ] Use **Paper Cream** page background: `bg-background`.
* [ ] Cards: `bg-card border border-border shadow-sm rounded-lg`.
* [ ] Primary actions: `bg-primary text-primary-foreground hover:bg-primary/90`.
* [ ] Warnings/errors: use `bg-warning`, `bg-destructive` + `*-Bg` for subtle states.
* [ ] Shadow ink uses warm hue; ensure `shadow-sm|md|lg` map to `--elevation-*`.

---

## 14) Data Wiring (React Admin + Supabase)

* [ ] Ensure `dataProvider.getList('principal_opportunities')` supports sort/pagination.
* [ ] Ensure `dataProvider.getList('priority_tasks')` filters by due/priority (server side) + principal if provided.
* [ ] Add `principal_customer_recency` view (optional) and expose via Supabase REST; otherwise compute in client.
* [ ] On activity/task create: call `useRefresh()` on both columns to reflect changes.

**Security**

* [ ] Ensure RLS permits `select` on views for authenticated role.
* [ ] Limit insert into `activities`/`tasks` per user (if applicable).

---

## 15) QA Checklist

Functional

* [ ] Changing principal updates all three columns.
* [ ] Filters actually reduce rows (Health/Stage/Last touch).
* [ ] Column resizing persists after reload; Reset works.
* [ ] Row click opens slide‑over; Details/History tabs persist.
* [ ] Quick Logger validates required fields; follow‑up creates a task.
* [ ] Tasks quick‑complete removes task and persists on refresh.

Visual & A11y

* [ ] No color banding on Paper Cream; shadows feel warm (no “soot”).
* [ ] All interactive controls ≥44px height; focus ring visible.
* [ ] Empty, loading, error states present for each column.

Performance

* [ ] Virtualized long lists in Opportunities/Tasks (if >200 rows).
* [ ] P95 data load < 300ms on cached views.

---

## 16) Rollout Plan

* [ ] Ship behind `?layout=v2` flag for internal testing.
* [ ] Add "Try New Dashboard" CTA in current page; remember preference.
* [ ] Gather feedback; remove flag and set v2 as default after sign‑off.
* [ ] Keep v1 route available for one release as fallback; remove after stability verified.

---

## 17) Nice‑to‑Have (Post‑MVP)

* [ ] Opportunities **List/Kanban** toggle with drag‑to‑change stage.
* [ ] Saved Views: serialize filters + widths + task grouping per user.
* [ ] Principal Overview KPI chips (Health, Open Opps, Tasks Due) in header.
* [ ] Offline draft logging for activities.

---

## 18) References (Theme & Tokens)

Use only semantic utilities; source of truth is `src/index.css`.

* Colors: Primary `#336600`, Accent `#D97E1F`, Background `#F9F8F6`, Border `#E8E7E3`, Foreground `#27271F`.
* Semantics: success `#10B981`, warning `#F59E0B`, error `#E5593D`, info `#3B82F6`.
* Density: Comfortable rows = 40–44px; Compact available later.
* Radius: 8px; Elevation: warm‑tinted shadows (`--shadow-ink`).

---

## 19) Owner Matrix (RACI)

* **UX/Visual (A/R):** You
* **Frontend (R):** Frontend dev(s)
* **DB Views (R):** Data engineer
* **QA (R):** QA lead
* **Approve (A):** PM/Founder

---

## 20) Cut/Paste Stubs

**Card Header**

```tsx
function ColumnHeader({ title, right }: {title:string; right?:React.ReactNode}){
  return (
    <div className="border-b border-border px-3 py-2 flex items-center justify-between bg-card rounded-t-lg">
      <div className="font-semibold text-foreground">{title}</div>
      {right}
    </div>
  );
}
```

**Health Dot**

```tsx
function HealthDot({status}:{status:'active'|'cooling'|'at_risk'}){
  const cls = status==='active'?'bg-success':status==='cooling'?'bg-warning':'bg-destructive';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} aria-hidden/>;
}
```

**Keyboard Shortcuts**

```ts
useEffect(()=>{
  const h=(e:KeyboardEvent)=>{
    if(e.key==='/'){e.preventDefault(); (document.getElementById('global-search') as HTMLInputElement)?.focus();}
    if(e.key==='1') document.getElementById('col-opps')?.scrollIntoView({behavior:'smooth'});
    if(e.key==='2') document.getElementById('col-tasks')?.scrollIntoView({behavior:'smooth'});
    if(e.key==='3') document.getElementById('col-log')?.scrollIntoView({behavior:'smooth'});
    if(e.key.toLowerCase()==='h') {/* open right panel on History tab */}
  };
  window.addEventListener('keydown', h);
  return ()=>window.removeEventListener('keydown', h);
},[]);
```
