# Charts & Tags

Data visualization and tag color systems for Atomic CRM.

## Tag Colors (V2: Aggressive Contrast)

**High contrast for better readability on cream background:**

```css
/* Warm tones */
--tag-warm-bg: oklch(87% 0.07 80);
--tag-warm-fg: oklch(20% 0.02 85);

/* Nature tones */
--tag-green-bg: oklch(88% 0.06 155);
--tag-green-fg: oklch(20% 0.02 85);

--tag-teal-bg: oklch(86% 0.05 200);
--tag-teal-fg: oklch(20% 0.02 85);

/* Cool tones */
--tag-blue-bg: oklch(85% 0.06 270);
--tag-blue-fg: oklch(20% 0.02 85);

--tag-purple-bg: oklch(87% 0.06 305);
--tag-purple-fg: oklch(20% 0.02 85);

/* Bright accent */
--tag-yellow-bg: oklch(92% 0.1 110);
--tag-yellow-fg: oklch(20% 0.02 85);

--tag-pink-bg: oklch(89% 0.07 15);
--tag-pink-fg: oklch(20% 0.02 85);

/* Neutral */
--tag-gray-bg: oklch(90% 0.015 85);
--tag-gray-fg: oklch(20% 0.02 85);

/* Earth tones (Garden Theme) */
--tag-clay-bg: oklch(85% 0.075 50);
--tag-clay-fg: oklch(20% 0.02 85);

--tag-sage-bg: oklch(87% 0.05 120);
--tag-sage-fg: oklch(20% 0.02 85);

--tag-amber-bg: oklch(90% 0.08 85);
--tag-amber-fg: oklch(20% 0.02 85);

--tag-cocoa-bg: oklch(83% 0.06 75);
--tag-cocoa-fg: oklch(20% 0.02 85);
```

**Usage:**

```tsx
// ✅ CORRECT - Use semantic utilities for tags
// Organization type badge (use success for customer type)
<Badge className="bg-success/15 text-success">
  Customer
</Badge>

// Priority badge (use warning for medium priority)
<Badge className="bg-warning/15 text-warning">
  Priority B
</Badge>

// Generic tag (use muted background)
<Badge className="bg-muted text-muted-foreground">
  Food Service
</Badge>

// Status tag (use semantic status colors)
<Badge className="bg-info/15 text-info">
  In Progress
</Badge>

// ❌ WRONG - Never use inline CSS variable syntax
// <Badge className="bg-[var(--tag-green-bg)] text-[var(--tag-green-fg)]">
```

### Tag Color Best Practices

**DO:**
✅ Use semantic colors for status tags (success/warning/error/info)
✅ Use muted backgrounds with muted-foreground for generic tags
✅ Use opacity modifiers for softer backgrounds (`bg-success/15`)
✅ Maintain consistent contrast (foreground always dark on light bg)
✅ Limit to 3-4 tag colors per screen to avoid visual chaos

**DON'T:**
❌ Use inline CSS variable syntax for tags
❌ Use bright saturated backgrounds (hurts readability)
❌ Use light text on light backgrounds
❌ Create custom tag colors - use semantic system
❌ Use more than 5 different tag colors in a single view

### Tag Color Mapping

| Use Case | Recommended Class | Contrast |
|----------|------------------|----------|
| Success/Active | `bg-success/15 text-success` | 4.8:1 |
| Warning/Pending | `bg-warning/15 text-warning` | 4.7:1 |
| Error/Failed | `bg-destructive/15 text-destructive` | 5.1:1 |
| Info/New | `bg-info/15 text-info` | 4.9:1 |
| Neutral/Generic | `bg-muted text-muted-foreground` | 5.2:1 |
| Accent/Priority | `bg-accent/15 text-accent` | 4.5:1 |

## Chart Colors (Earth-Tone Palette)

**MFB Garden Theme for data visualization:**

```css
/* Chart 1: Warm Tan/Soil (Baseline/Benchmark) */
--chart-1: oklch(55% 0.035 60);
--chart-1-fill: oklch(55% 0.035 60);
--chart-1-stroke: oklch(37% 0.035 60);

/* Chart 2: Forest Green (Primary Data) */
--chart-2: oklch(52% 0.095 142);  /* Brightened from brand-500 */
--chart-2-fill: oklch(52% 0.095 142);
--chart-2-stroke: oklch(35% 0.085 142);

/* Chart 3: Clay Orange (Secondary Data) */
--chart-3: oklch(58% 0.105 72);
--chart-3-fill: oklch(58% 0.105 72);
--chart-3-stroke: oklch(42% 0.095 72);

/* Chart 4: Sage Green (Tertiary) */
--chart-4: oklch(60% 0.065 130);
--chart-4-fill: oklch(60% 0.065 130);
--chart-4-stroke: oklch(44% 0.06 130);

/* Chart 5-8: Extended palette */
--chart-5: oklch(62% 0.08 175);   /* Teal */
--chart-6: oklch(58% 0.09 40);    /* Rust */
--chart-7: oklch(64% 0.075 95);   /* Golden */
--chart-8: oklch(56% 0.07 220);   /* Steel blue */

/* Chart UI elements */
--chart-gridline: oklch(88% 0.005 92);
--chart-axis-text: oklch(55% 0.015 85);
--chart-disabled: oklch(75% 0.01 85);
```

**Usage with Recharts:**

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-gridline)" />
  <XAxis stroke="var(--chart-axis-text)" />
  <YAxis stroke="var(--chart-axis-text)" />
  <Tooltip />
  <Legend />
  <Bar dataKey="baseline" fill="var(--chart-1)" stroke="var(--chart-1-stroke)" />
  <Bar dataKey="actual" fill="var(--chart-2)" stroke="var(--chart-2-stroke)" />
  <Bar dataKey="target" fill="var(--chart-3)" stroke="var(--chart-3-stroke)" />
</BarChart>
```

### Chart Color Characteristics

- **Earth-tone palette:** Harmonizes with Garden to Table theme
- **Lightness range:** 52-64% (mid-range for visibility on cream)
- **Chroma:** 0.035-0.105 (muted but distinct)
- **Stroke variants:** ~17% darker for definition

### Chart Color Assignment

| Data Type | Chart Variable | Color | Use Case |
|-----------|---------------|-------|----------|
| Baseline/Benchmark | --chart-1 | Tan | Previous period, industry average |
| Primary Data | --chart-2 | Forest Green | Current period, primary metric |
| Secondary Data | --chart-3 | Clay Orange | Comparison, secondary metric |
| Tertiary Data | --chart-4 | Sage Green | Additional dimension |
| Comparison 1 | --chart-5 | Teal | Extended data series |
| Comparison 2 | --chart-6 | Rust | Extended data series |
| Comparison 3 | --chart-7 | Golden | Extended data series |
| Comparison 4 | --chart-8 | Steel Blue | Extended data series |

### Chart Best Practices

**DO:**
✅ Use chart-1 for baseline/benchmark data (tan)
✅ Use chart-2 for primary data series (forest green)
✅ Use chart-3 for secondary data series (clay orange)
✅ Use stroke variants for better definition
✅ Keep gridlines subtle (--chart-gridline)
✅ Limit to 4 colors per chart for clarity
✅ Use consistent colors across dashboard for same metrics

**DON'T:**
❌ Use more than 8 data series in a single chart
❌ Use bright neon colors (breaks theme)
❌ Use pure black or gray for chart elements
❌ Mix cool and warm palettes
❌ Use chart colors for non-chart UI elements

## Accessibility Considerations

### Color Blindness for Charts

Charts must be perceivable without relying on color alone:

```tsx
// ✅ GOOD: Uses patterns + color
<Bar dataKey="actual" fill="var(--chart-2)">
  <LabelList dataKey="actual" position="top" />
</Bar>

// ✅ GOOD: Uses direct labels
<Tooltip content={<CustomTooltip />} />

// ❌ BAD: Color only (no labels, no patterns)
<Area dataKey="metric1" fill="var(--chart-2)" />
<Area dataKey="metric2" fill="var(--chart-3)" />
```

### Tag Accessibility

Tags must have sufficient contrast:

```tsx
// ✅ GOOD: High contrast (4.8:1)
<Badge className="bg-success/15 text-success">Active</Badge>

// ❌ BAD: Low contrast (<3:1)
<Badge className="bg-success/5 text-success">Active</Badge>
```

## Common Issues & Solutions

### Issue: Chart colors look muddy on cream background

**Solution:** Use mid-lightness values (52-64%)

```tsx
// ❌ BAD: Too dark (L=30%)
<Bar fill="oklch(30% 0.09 142)" />

// ✅ GOOD: Mid-range (L=52%)
<Bar fill="var(--chart-2)" />
```

### Issue: Too many tag colors create visual noise

**Solution:** Consolidate to semantic categories

```tsx
// ❌ BAD: 8 different tag colors
<Badge className="bg-tag-green-bg">Type A</Badge>
<Badge className="bg-tag-blue-bg">Type B</Badge>
<Badge className="bg-tag-purple-bg">Type C</Badge>
{/* ... 5 more colors */}

// ✅ GOOD: 3 semantic categories
<Badge className="bg-success/15 text-success">Active</Badge>
<Badge className="bg-warning/15 text-warning">Pending</Badge>
<Badge className="bg-muted text-muted-foreground">Inactive</Badge>
```

### Issue: Chart legend is hard to read

**Solution:** Use proper text colors and spacing

```tsx
// ✅ GOOD: Clear legend with semantic colors
<Legend
  wrapperStyle={{
    color: 'var(--foreground)',
    fontSize: '14px',
    paddingTop: '20px'
  }}
/>
```

### Issue: Tags blend into background

**Solution:** Use opacity modifiers for sufficient contrast

```tsx
// ❌ BAD: Too transparent
<Badge className="bg-success/5 text-success">Active</Badge>

// ✅ GOOD: Clear distinction
<Badge className="bg-success/15 text-success">Active</Badge>
```
