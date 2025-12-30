# The 7 Select Components That Became 1

## The Problem No One Talks About

We had seven different ways to render a dropdown. Seven.

Each one looked slightly different. Each one handled edge cases differently. Each one was a landmine for the next developer who needed "just a simple select input."

Here's what we found when we audited our React codebase:

| Component | Lines | What It Did |
|-----------|-------|-------------|
| TimeZoneSelect | 43 | US timezone picker |
| StateComboboxInput | 76 | US state picker with search |
| ContactSelectField | 77 | Contact picker with org filter |
| LeadSourceInput | 18 | Static choices for lead sources |
| OwnerFilterDropdown | 45 | User assignment picker |
| Plus 2 more inline implementations | ~60 | Various one-offs |

That's roughly **320 lines of code** doing essentially the same thing: showing a list, letting users pick one.

## Why This Happens

It's like having seven different remote controls for the same TV.

Someone needed a timezone picker. They built one. Someone else needed a state picker with search. They didn't know the timezone picker existed (or it didn't quite fit), so they built another. Copy, paste, tweak, ship.

Rinse and repeat until your codebase has seven ways to select things.

The insidious part? Each one *works*. There's no bug. No failing test. Just a slow accumulation of maintenance debt that makes every future change harder.

## The Hierarchy That Fixed It

We needed a single source of truth. But not a monolithic "do everything" component—those become their own maintenance nightmare.

Instead, we built a **three-layer hierarchy**:

```
SelectUI (presentation only)
    ↑
GenericSelectInput (React Admin connector)
    ↑
[Domain wrappers: TimeZoneSelect, StateComboboxInput, etc.]
```

Think of it like a power adapter system:

- **SelectUI** is the plug shape—pure presentation, no opinion about where data comes from
- **GenericSelectInput** is the voltage converter—handles the translation between React Admin forms and standalone usage
- **Domain wrappers** are the device-specific tips—just enough customization for each use case

## The Magic: Polymorphic Detection

Here's the part that makes it work. `GenericSelectInput` doesn't force you to declare "I'm in a form" or "I'm standalone." It *detects* which mode you're in:

```tsx
// Inside GenericSelectInput
const inputResult = useInputSafe(source);
const isFormMode = inputResult !== null;

if (isFormMode) {
  // React Admin manages the value via react-hook-form
  // We just wire up the UI
} else {
  // Parent component manages value/onChange
  // We're a controlled component
}
```

It's like a phone charger that automatically switches between USB-C and Lightning. You don't configure it. You just plug it in.

## The Before and After

**TimeZoneSelect** went from this:

```tsx
// BEFORE: 43 lines
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  // ... 6 more items
];

export function TimeZoneSelect({ value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">Time Zone</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder="Select time zone" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

To this:

```tsx
// AFTER: 15 lines
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { US_TIMEZONES } from "@/constants/choices";

export function TimeZoneSelect({ value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Time Zone</label>
      <GenericSelectInput
        value={value}
        onChange={(v) => onChange(v as string)}
        choices={[...US_TIMEZONES]}
        isDisabled={disabled}
        searchable={false}
        placeholder="Select time zone"
      />
    </div>
  );
}
```

**StateComboboxInput** went from 76 lines of Popover/Command/CommandInput/CommandList chaos to 12 lines.

**ContactSelectField**? Deleted entirely. 77 lines gone. It was doing what `ReferenceInput` + `GenericSelectInput` already handles.

## The Numbers

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Components | 7 | 3 | -57% |
| Total lines | ~320 | ~140 | -56% |
| Files touched to add new select | 1-3 | 1 | Predictable |
| "Which component do I use?" questions | Frequent | Never | Priceless |

## The Gotcha

This pattern requires discipline.

When someone needs a new select variant, the temptation is to "just build a quick one." You have to actively resist that and ask: "Can `GenericSelectInput` with the right props handle this?"

Usually, the answer is yes. When it's not, you extend the base component—not duplicate it.

## The Takeaway

The best code is code you don't have to write.

The second best is code that disappears.

Those 180 deleted lines weren't bugs waiting to happen anymore. They weren't tests we had to maintain. They weren't documentation we had to keep current.

They were just... gone.
