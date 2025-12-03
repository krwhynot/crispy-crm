# UX Laws Deep Dive

Comprehensive reference for user experience laws with research foundations, practical applications, and code patterns.

## Table of Contents

1. [Interaction Laws](#interaction-laws)
   - [Jakob's Law](#jakobs-law)
   - [Hick's Law](#hicks-law)
   - [Fitts's Law](#fittss-law)
   - [Tesler's Law](#teslers-law)
   - [Miller's Law](#millers-law)
   - [Doherty Threshold](#doherty-threshold)
2. [Visual & Cognitive Laws](#visual--cognitive-laws)
   - [Aesthetic-Usability Effect](#aesthetic-usability-effect)
   - [Peak-End Rule](#peak-end-rule)
   - [Von Restorff Effect](#von-restorff-effect)
   - [Serial Position Effect](#serial-position-effect)
3. [Gestalt Principles](#gestalt-principles)
4. [Application Matrix](#application-matrix)

---

## Interaction Laws

### Jakob's Law

> "Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know."
> — Jakob Nielsen (2000)

**The Principle:**
Users transfer expectations from familiar interfaces. Breaking conventions increases cognitive load and errors.

**Research Foundation:**
Nielsen Norman Group studies show users form mental models based on aggregate experience across websites. Deviation from these models causes confusion and task abandonment.

**Application:**

| Element | Convention | Why It Works |
|---------|------------|--------------|
| Logo | Top-left, links home | Universal pattern since 1990s |
| Navigation | Top or left sidebar | Consistent information architecture |
| Search | Top-right with magnifying glass icon | Learned pattern |
| CTA buttons | Right side of forms | Western reading flow (left-to-right) |
| Cart icon | Top-right corner | E-commerce standard |

**Code Pattern:**
```tsx
// Familiar navigation structure
<header className="flex items-center justify-between px-6 py-4">
  {/* Logo top-left - always links home */}
  <Link href="/" className="flex items-center gap-2">
    <Logo className="h-8 w-8" />
    <span className="font-semibold">AppName</span>
  </Link>

  {/* Search top-center/right */}
  <SearchBar className="flex-1 max-w-md mx-8" />

  {/* User actions top-right */}
  <nav className="flex items-center gap-4">
    <NotificationBell />
    <UserMenu />
  </nav>
</header>
```

**Anti-Patterns:**
- Logo on the right
- Search in footer
- Navigation at bottom of page
- Unusual button placements

---

### Hick's Law

> "The time it takes to make a decision increases with the number and complexity of choices."
> — William Edmund Hick (1952)

**The Formula:**
```
RT = a + b * log2(n)
```
Where RT is reaction time, n is number of choices.

**Research Foundation:**
Hick and Hyman demonstrated that reaction time increases logarithmically with alternatives. Adding options doesn't just add time linearly—it compounds decision difficulty.

**Optimal Ranges:**

| Context | Max Choices | Strategy |
|---------|-------------|----------|
| Primary navigation | 5-7 items | Group related items |
| Dropdown menus | 7-10 items | Alphabetize or categorize |
| Settings pages | Chunk by category | Progressive disclosure |
| Form fields per section | 5-7 fields | Multi-step forms |

**Code Pattern:**
```tsx
// Progressive disclosure - hide complexity
<div className="space-y-4">
  {/* Show essential options first */}
  <RadioGroup defaultValue="standard">
    <RadioGroupItem value="standard">Standard Shipping</RadioGroupItem>
    <RadioGroupItem value="express">Express Shipping</RadioGroupItem>
  </RadioGroup>

  {/* Hide advanced options */}
  <Collapsible>
    <CollapsibleTrigger className="text-sm text-muted-foreground">
      More options
    </CollapsibleTrigger>
    <CollapsibleContent>
      <RadioGroupItem value="overnight">Overnight</RadioGroupItem>
      <RadioGroupItem value="pickup">Store Pickup</RadioGroupItem>
    </CollapsibleContent>
  </Collapsible>
</div>
```

**Anti-Patterns:**
- 20+ navigation items visible
- All settings on one page
- No default selections
- Equal visual weight for all options

---

### Fitts's Law

> "The time to acquire a target is a function of the distance to and size of the target."
> — Paul Fitts (1954)

**The Formula:**
```
T = a + b * log2(1 + D/W)
```
Where D is distance to target, W is width of target.

**Research Foundation:**
Originally developed for aircraft cockpit design, Fitts's Law has become foundational in HCI. Larger, closer targets are faster to hit.

**Minimum Sizes:**

| Context | Minimum Size | Tailwind Class |
|---------|--------------|----------------|
| Mobile touch target | 44×44px | `h-11 w-11` |
| Desktop click target | 32×32px | `h-8 w-8` |
| Text links (line height) | 24px minimum | `leading-6` |
| Icon buttons | 44×44px (padded) | `p-2.5` on 24px icon |

**Code Pattern:**
```tsx
// Primary action - large and prominent
<Button
  className="h-12 px-8 text-lg font-semibold"
  aria-label="Save changes"
>
  Save Changes
</Button>

// Icon button with adequate touch area
<button
  className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-muted"
  aria-label="Delete item"
>
  <TrashIcon className="h-5 w-5" />
</button>

// Edge/corner positioning for important actions (infinite edge target)
<div className="fixed bottom-0 right-0 p-6">
  <FloatingActionButton className="h-14 w-14 rounded-full shadow-lg">
    <PlusIcon className="h-6 w-6" />
  </FloatingActionButton>
</div>
```

**Pro Tips:**
- Corners and edges are "infinite" targets (can't overshoot)
- Group related actions close together
- Primary actions should be largest
- Destructive actions can be smaller (intentional friction)

---

### Tesler's Law

> "Every application has an inherent amount of complexity that cannot be removed or hidden. This complexity must be dealt with by either the system or the user."
> — Larry Tesler

**The Principle:**
Complexity must exist somewhere. The question is: who handles it—the system or the user?

**Application:**

| Complexity Type | User Handles | System Handles |
|-----------------|--------------|----------------|
| Date formatting | User types "01/15/2024" | System accepts "Jan 15", "1/15", "15 Jan" |
| Address lookup | User types full address | System autocompletes from partial |
| Currency conversion | User does math | System shows both currencies |
| Time zones | User converts | System shows local time |

**Code Pattern:**
```tsx
// System handles complexity - smart date input
<DatePicker
  value={date}
  onChange={setDate}
  // Accepts natural language: "tomorrow", "next friday", "jan 15"
  parseNaturalLanguage={true}
  // Shows relative time: "2 days from now"
  showRelative={true}
  // Auto-detects timezone
  timezone="auto"
/>

// System handles address complexity
<AddressInput
  value={address}
  onChange={setAddress}
  // Autocomplete from postal service
  autoComplete={true}
  // Validate on blur
  validateOnBlur={true}
  // Pre-fill from browser
  autoFill={true}
/>
```

---

### Miller's Law

> "The average person can only keep 7 (±2) items in working memory at once."
> — George Miller (1956)

**Research Foundation:**
Miller's classic paper "The Magical Number Seven" demonstrated short-term memory limitations. This applies to UI elements users must hold in mind while completing tasks.

**Application:**

| Context | Recommendation |
|---------|----------------|
| Navigation items | 5-7 top-level items |
| Form fields visible | 5-7 per section |
| Dashboard widgets | 3-5 key metrics |
| Breadcrumbs | Max 5 levels |
| Multi-step wizard | 3-7 steps visible |

**Code Pattern:**
```tsx
// Chunked form with tabs (Miller's Law applied)
<Tabs defaultValue="contact">
  <TabsList>
    <TabsTrigger value="contact">Contact Info</TabsTrigger>
    <TabsTrigger value="company">Company</TabsTrigger>
    <TabsTrigger value="preferences">Preferences</TabsTrigger>
  </TabsList>

  <TabsContent value="contact">
    {/* Max 5-7 fields */}
    <FormField name="firstName" />
    <FormField name="lastName" />
    <FormField name="email" />
    <FormField name="phone" />
  </TabsContent>

  {/* Additional tabs for remaining fields */}
</Tabs>
```

---

### Doherty Threshold

> "System response times under 400ms maintain user flow state. Delays over 1 second cause context switching."
> — Walter Doherty (1982)

**Response Time Guidelines:**

| Response Time | User Perception | Required Action |
|---------------|-----------------|-----------------|
| < 100ms | Instantaneous | No feedback needed |
| 100-400ms | Slight delay | Show subtle indicator |
| 400ms-1s | Noticeable delay | Show loading state |
| 1-10s | Significant delay | Show progress indicator |
| > 10s | Flow broken | Show progress + allow cancel |

**Code Pattern:**
```tsx
// Optimistic update for instant feedback
async function saveContact(data) {
  // Immediately update UI (optimistic)
  setContact(data);
  toast.success("Saved!");

  // Then sync with server
  try {
    await api.updateContact(data);
  } catch (error) {
    // Rollback on failure
    setContact(previousData);
    toast.error("Save failed. Please try again.");
  }
}

// Skeleton loading for perceived speed
function ContactList({ isLoading, contacts }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return contacts.map(c => <ContactCard key={c.id} contact={c} />);
}
```

---

## Visual & Cognitive Laws

### Aesthetic-Usability Effect

> "Users often perceive aesthetically pleasing design as more usable."
> — Masaaki Kurosu and Kaori Kashimura (1995)

**The Principle:**
Beautiful interfaces create positive emotional responses, making users more tolerant of minor usability issues and more likely to find workarounds.

**Application:**
- Consistent visual language signals reliability
- Clean layouts feel faster
- Attention to detail builds trust
- Polish on primary flows matters most

---

### Peak-End Rule

> "People judge an experience based on how they felt at its most intense point and at its end, rather than the average."
> — Daniel Kahneman

**Application:**

| Flow Stage | Strategy |
|------------|----------|
| Peak moments | Celebrate wins (confetti, success states) |
| Endings | Clear confirmation, next steps |
| Errors (negative peaks) | Helpful recovery, empathetic copy |
| Completion | Satisfying animation, thank you message |

**Code Pattern:**
```tsx
// Positive flow ending
function OrderConfirmation({ order }) {
  return (
    <div className="text-center py-12">
      {/* Celebration animation */}
      <CheckCircleIcon className="h-16 w-16 text-success mx-auto animate-bounce-once" />

      <h1 className="text-2xl font-bold mt-4">Order Confirmed!</h1>
      <p className="text-muted-foreground mt-2">
        We'll email you when it ships.
      </p>

      {/* Clear next step */}
      <Button asChild className="mt-6">
        <Link href="/orders">View Your Orders</Link>
      </Button>
    </div>
  );
}
```

---

### Von Restorff Effect

> "Items that are visually distinct from their surroundings are more memorable."
> — Hedwig von Restorff (1933)

**Application:**
- Use accent color sparingly (10% rule)
- Primary CTA should be visually unique
- Don't make everything "pop"
- Contrast creates hierarchy

---

### Serial Position Effect

> "Items at the beginning (primacy) and end (recency) of a list are remembered best."

**Application:**
- Put most important nav items first and last
- Key actions at start/end of toolbars
- First and last dashboard widgets matter most
- Summary at end of long forms

---

## Gestalt Principles

### Quick Reference

| Principle | Definition | UI Application |
|-----------|------------|----------------|
| **Proximity** | Close items are grouped | Spacing defines relationships |
| **Similarity** | Similar items are related | Consistent button/text styles |
| **Continuity** | Eye follows smooth paths | Alignment guides attention |
| **Closure** | Mind completes incomplete shapes | Cards, containers, progress |
| **Figure-Ground** | Foreground/background separation | Modals, overlays, focus states |
| **Common Region** | Items in same area are grouped | Cards, sections, containers |

---

## Application Matrix

Quick reference for which laws apply to common UI elements:

| Element | Primary Laws | Key Metrics |
|---------|--------------|-------------|
| **Navigation** | Jakob's, Hick's, Miller's | Items ≤7, familiar position |
| **Buttons** | Fitts's, Von Restorff | ≥44px, unique CTA |
| **Forms** | Miller's, Tesler's | ≤7 fields/section, smart defaults |
| **Lists** | Serial Position, Proximity | Key items first/last |
| **Loading** | Doherty | Feedback <400ms |
| **Modals** | Figure-Ground, Peak-End | Clear close, satisfying completion |
| **Search** | Jakob's, Tesler's | Familiar position, smart suggestions |

---

## Further Reading

- Nielsen Norman Group: [Laws of UX](https://lawsofux.com/)
- Don Norman: *The Design of Everyday Things*
- Steve Krug: *Don't Make Me Think*
- A Book Apart: *Designing for Emotion* by Aarron Walter
