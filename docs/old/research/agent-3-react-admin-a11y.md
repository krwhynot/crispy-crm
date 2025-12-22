# Agent 3: React Admin & Accessibility

## Executive Summary

**Key Findings:**
1. React Admin has **built-in WizardForm** (Enterprise Edition only) with step management and optional progress indicator
2. SimpleForm/TabbedForm can be customized with Grid layouts and custom toolbars, but **no native progress indicators**
3. Custom progress bars require **5 critical ARIA attributes**: role, aria-valuenow, aria-valuemin, aria-valuemax, and aria-label
4. Multi-step forms need **aria-current="true"** on current step and **explicit headings** for each step
5. Form validation requires **precise timing**: aria-invalid only after validation, aria-describedby for error association

---

## React Admin Capabilities

### Built-in Features

| Feature | Available | How to Use |
|---------|-----------|------------|
| Progress indicator | No (built-in) | Custom component using Material UI LinearProgress or Stepper |
| Multi-step wizard | Yes (Enterprise) | `<WizardForm>` with `<WizardForm.Step>` children |
| Custom toolbar | Yes | Pass `toolbar` prop to SimpleForm/TabbedForm with custom `<Toolbar>` component |
| Real-time validation | Yes | Set `mode="onBlur"` or `mode="onChange"` on form component |

### SimpleForm vs TabbedForm

**SimpleForm:**
- When to use: Single-page forms with logical sections that can be viewed simultaneously
- Layout: Vertical stack (Material UI `<Stack>`) with one child per row by default
- Customization: Supports nested `<Grid>`, `<Box>`, `<Stack>` for complex layouts
- Sections: Use `<Typography>` headers and custom separators to group inputs

**TabbedForm:**
- When to use: Forms with many fields that benefit from categorization into tabs
- Layout: Material UI `<Tabs>` with `<TabbedForm.Tab>` children
- Validation: Automatically highlights tabs containing validation errors
- Navigation: Users can jump between tabs non-linearly

**WizardForm (Enterprise Edition):**
- When to use: Multi-step processes requiring linear progression (create flows)
- Layout: One step visible at a time with navigation buttons
- Progress: Optional stepper (can be hidden or customized via `progress` prop)
- **Not recommended**: "Considered as a bad practice to provide a wizard form for existing resources" (edit views)

**Recommendation for Crispy CRM:**
- **For Contact/Organization Create:** Use **SimpleForm with custom progress component** (not Enterprise WizardForm)
- **Rationale:** Pre-launch velocity demands over Enterprise licensing; SimpleForm provides full control over layout/validation; progress bar can be custom-built meeting exact accessibility needs

### Custom Components Needed

1. **FormProgressBar Component:**
   - Why needed: No built-in progress indicator in SimpleForm
   - Must implement: All ARIA progressbar requirements (role, value attributes, accessible name)
   - Integration: Place above form content or in custom toolbar

2. **Custom Toolbar with Navigation:**
   - Why needed: Default toolbar only has Save/Delete buttons
   - Must implement: Previous/Next buttons for section navigation, conditional rendering based on current section
   - Integration: Pass to SimpleForm via `toolbar` prop

3. **Section Wrapper Component:**
   - Why needed: Manage visibility of form sections and integrate with FormGroupContextProvider
   - Must implement: Conditional rendering based on active section, proper heading hierarchy
   - Integration: Wrap groups of inputs in SimpleForm

---

## Accessibility Requirements

### Progress Bar ARIA

**Required attributes:**
```jsx
// Minimal compliant implementation
<div
  role="progressbar"
  aria-valuenow={33}      // Current percentage (0-100)
  aria-valuemin={0}       // Always 0
  aria-valuemax={100}     // Always 100
  aria-label="Form completion progress"  // Or use aria-labelledby
>
  {/* Visual progress indicator */}
</div>
```

**Optional but recommended:**
```jsx
aria-valuetext="Step 1 of 3: Contact Information"  // Override percentage announcement
aria-describedby="progress-status"                 // Link to status text
```

**Critical rules:**
- `aria-valuenow` must be between `aria-valuemin` and `aria-valuemax`
- Omit `aria-valuenow` entirely for indeterminate/loading states
- Screen readers announce `aria-valuenow` as percentage by default
- Use `aria-valuetext` if percentage would be misleading (e.g., "Step 2 of 5")

### Wizard/Multi-Step ARIA

**Step announcement:**
- Use ordered list (`<ol>`) with `role="progressbar"` on list wrapper
- Set `aria-valuetext="Step X of Y: [Step Name]"` for clear context
- Alternative: Use `aria-live="polite"` region to announce step changes

**Focus management:**
- On step change: Focus first input in new step OR focus step heading
- On validation error: Focus first invalid field OR error summary
- On completion: Focus confirmation message OR redirect with notification

**Navigation:**
- Current step: `aria-current="true"` on list item representing active step
- Completed steps: Use visually hidden text `<span class="sr-only">completed</span>`
- Each step: **Must have explicit `<h2>`/`<h3>` heading** (step labels not sufficient)

### Validation Messages

**aria-describedby usage:**
```jsx
<input
  id="email"
  aria-describedby="email-hint email-error"  // Space-separated IDs
  aria-invalid={hasError}
/>
<div id="email-hint">Enter your work email address</div>
{hasError && <div id="email-error">Please enter a valid email</div>}
```

**aria-live usage:**
```jsx
// For error summaries or dynamic validation messages
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

**Error association pattern:**
1. Set `aria-invalid="true"` on input when validation fails
2. Use `aria-describedby` to link input to error message element
3. Include `role="alert"` on error message for immediate screen reader announcement
4. **Timing critical**: Only set aria-invalid **after** validation occurs, never before user input

### Focus Management

**On step change:**
- **Recommended**: Focus first input in new section
- **Alternative**: Focus section heading (if interactive or has `tabindex="-1"`)
- **Avoid**: Leaving focus on Previous/Next button (disorienting)

**On error:**
- **Short forms**: Auto-focus first invalid field
- **Long forms**: Focus error summary at top with links to invalid fields
- **Screen reader**: Announce "X errors found" via `role="alert"` or `aria-live="assertive"`

**On completion:**
- **Same page**: Focus confirmation message with `role="status"` or `role="alert"`
- **Redirect**: Use React Admin's `useNotify()` hook for accessible toast notification
- **Avoid**: Silent redirects without announcement

---

## Implementation Patterns

### Adding Progress to SimpleForm

**Pattern description from React Admin docs:**

React Admin's SimpleForm does not include a built-in progress indicator. To add one:

1. **Create custom progress component** that calculates completion percentage based on filled fields or section index
2. **Place progress component** as first child of SimpleForm or in page header above form
3. **Implement ARIA attributes** per progressbar role requirements
4. **Use Material UI components** like `<LinearProgress>` or `<Stepper>` as visual foundation
5. **Subscribe to form state** using `useFormState()` from react-hook-form to track field completion

Alternative approach: Use `<FormGroupContextProvider>` to track completion per section and display section-level progress.

### Creating Wizard Form

**Pattern description from React Admin docs (WizardForm - Enterprise Edition):**

The `<WizardForm>` component provides multi-step form functionality:

1. **Define steps** using `<WizardForm.Step label="Step Name">` children
2. **One step renders at a time** with automatic Previous/Next navigation
3. **Progress stepper** displays by default (customizable via `progress` prop)
4. **Validation occurs per step** before allowing navigation to next step
5. **Final step submission** triggers form save when user clicks Save button

Navigation managed via `useWizardFormContext()` hook providing:
- `currentStep`: Current step index
- `goToNextStep()`, `goToPreviousStep()`: Navigation methods
- `hasNextStep`, `hasPreviousStep`: Boolean flags

**Custom implementation without WizardForm (for SimpleForm):**

1. **Manage section state** with `useState()` hook tracking active section index
2. **Conditional rendering** of input groups based on active section
3. **Custom toolbar** with Previous/Next buttons calling section state setters
4. **Validation per section** using form state to prevent navigation if current section invalid
5. **Progress calculation** based on section index (e.g., section 2 of 4 = 50%)

---

## Sources

### React Admin Documentation

1. [React-admin - Forms in React-Admin](https://marmelab.com/react-admin/Forms.html)
2. [React-admin - SimpleForm](https://marmelab.com/react-admin/SimpleForm.html)
3. [React-admin - TabbedForm](https://marmelab.com/react-admin/TabbedForm.html)
4. [React-admin - WizardForm](https://marmelab.com/react-admin/WizardForm.html)
5. [React-admin - The Toolbar Component](https://marmelab.com/react-admin/Toolbar.html)
6. [React-admin - The SaveButton Component](https://marmelab.com/react-admin/SaveButton.html)
7. [React-admin - Form Validation](https://marmelab.com/react-admin/Validation.html)
8. [React-admin - useNotify](https://marmelab.com/react-admin/useNotify.html)
9. [Creating Custom Form Layouts With React Admin](https://marmelab.com/blog/2023/03/22/creating-custom-form-layouts-with-react-admin.html)
10. [ra-form-layout@latest Documentation](https://react-admin-ee.marmelab.com/documentation/ra-form-layout)

### WCAG & ARIA Standards

11. [ARIA: progressbar role - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role)
12. [WAI-ARIA: ROLE=PROGRESSBAR - DigitalA11Y](https://www.digitala11y.com/progressbar-role/)
13. [ARIA progressbar must have an accessible name - Deque Rules](https://dequeuniversity.com/rules/axe/4.1/aria-progressbar-name)
14. [ARIA21: Using aria-invalid to Indicate An Error Field - W3C](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA21)
15. [aria-errormessage - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage)
16. [aria-invalid attribute - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)

### Accessible Form Validation Guides

17. [A Guide To Accessible Form Validation - Smashing Magazine](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/)
18. [Accessible Form Validation: Best Practices - Reform](https://www.reform.app/blog/accessible-form-validation-best-practices)
19. [WebAIM: Usable and Accessible Form Validation](https://webaim.org/techniques/formvalidation/)
20. [Technique: Form error communication - Harvard Digital Accessibility](https://accessibility.huit.harvard.edu/technique-form-error-communication)

### Multi-Step Form Accessibility

21. [Step indicator - U.S. Web Design System (USWDS)](https://designsystem.digital.gov/components/step-indicator/)
22. [Understanding Accessibility: Forms - Seth Lopez](https://sethlopez.me/article/understanding-accessibility-forms/)
