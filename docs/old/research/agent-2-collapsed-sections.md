# Agent 2: Collapsed Sections Decision

## Executive Summary
**VERDICT:** REMOVE collapsed sections for Crispy CRM forms
**Confidence:** High
**Key Reason:** For desktop-first enterprise CRM forms with 4-12 fields, research consistently shows that collapsed sections add unnecessary interaction cost, reduce field visibility, and can confuse users—while providing minimal space-saving benefit on large screens.

## Research Findings

### Studies Against Collapsed Sections

#### UK Government Digital Service - "No More Accordions" Policy
The UK Government Digital Service (GDS) discontinued recommending accordion forms entirely after extensive user research revealed critical usability problems:

- **Unpredictable behavior with dynamic sections**: "If the accordion includes a branching question, then it can suddenly appear to 'grow' a new section - or lose one. That's often very disconcerting for users."
- **Even worse**: When an answer hidden within one section affects a completely different section
- **New recommendation**: One question per page as starting point, with simple grouping where user research validates it
- **Real-world validation**: Carer's Allowance form showed removing progress indicators made no difference to completion rates

**Source**: [No more accordions: how to choose a form structure – User research in government](https://userresearch.blog.gov.uk/2015/08/13/no-more-accordions-how-to-choose-a-form-structure/)

#### Nielsen Norman Group - Desktop Accordion Research
NN/g research identifies when accordions actively hurt usability:

- **Core principle**: "It is easier to scroll down the page than to decide which heading to click on"
- **Primary problem**: Each accordion decision adds cognitive load and increases interaction cost
- **Content awareness**: Hidden information gets ignored despite descriptive headings
- **Avoid accordions when**: Users need most or all content to answer their questions
- **Space myth debunked**: Users scroll long pages effectively when content is relevant and well-formatted; 20% of eyetracking attention goes below the fold

**Source**: [Accordions for Complex Website Content on Desktops - NN/G](https://www.nngroup.com/articles/accordions-complex-content/)

#### Baymard Institute - Form Field Research
Extensive e-commerce checkout research with quantitative data:

- **18% abandonment rate** due to forms perceived as too long or complicated
- **Users become intimidated** by forms with 10-15+ fields displayed at once
- **Average checkout**: 12.8 form fields (too high—can be reduced to 6-8)
- **26% of users abandoned** purchases due to checkout complexity
- **Critical finding**: "Perceived checkout effort impacts users far more than the number of steps"
- **Hidden field problems**: Tab and inline accordion layouts "muddy the relationship between visible and hidden fields," creating uncertainty about which fields will be submitted

**Sources**:
- [Baymard Institute form design checkout accordion hidden fields research data](https://baymard.com/research/checkout-usability)
- [Checkout Optimization: Minimize Form Fields – Baymard](https://baymard.com/blog/checkout-flow-average-form-fields)
- [Accordion UX: The Pitfalls of Inline Accordion and Tab Designs – Baymard](https://baymard.com/blog/accordion-and-tab-design)

### Studies Supporting Collapsed Sections

#### Mobile Context (NN/g Mobile Research)
Accordions work well on mobile specifically:

- **Space conservation**: Critical on small screens to reduce excessive scrolling
- **Overview benefit**: "Get the big picture before focusing on details"
- **Verdict**: "While the use of accordions on desktop is debatable, on mobile, accordions are one of the most useful design elements"
- **User behavior**: Mobile users "stop scrolling and navigate away" when unable to quickly assess page contents

**Conditions where accordions help on mobile:**
- Severe space constraints (phone screens)
- Users need only specific pieces of information (not all fields)
- Content is loosely related rather than sequential
- Forms convey workflow without multiple page loads

**Source**: [Accordions on Mobile - NN/G](https://www.nngroup.com/articles/mobile-accordions/)

#### E-commerce Checkout Accordions (Baymard)
Limited support with caveats:

- **14% of top 100 e-commerce sites** use accordion-style checkouts
- **User perception**: Users experience accordions as multi-step processes regardless of technical implementation
- **Critical caveat**: "Accordion checkouts aren't a magic bullet—they neither add nor subtract significantly from the usability of your checkout form"
- **Best practice**: Collapse COMPLETED steps into summaries (not uncompleted sections)

**Source**: [Always Collapse Completed Accordion Checkout Steps into Summaries – Baymard](https://baymard.com/blog/accordion-checkout-usability)

### Progressive Disclosure Research

#### When Progressive Disclosure Works (NN/g)
Progressive disclosure is a related but distinct pattern:

- **Core concept**: Show essential options initially, advanced features on request
- **Benefits**: Improves learnability for novices, efficiency for experts, reduces errors
- **Research confirms**: "People understand a system better when you help them prioritize features"
- **Critical requirements**:
  - Correct feature split (core vs. advanced genuinely reflects frequency of use)
  - Clear progression mechanics with strong "information scent"
- **Limitation**: Designs exceeding two disclosure levels typically have poor usability

**Important distinction**: Progressive disclosure reveals ADVANCED features, not required form fields.

**Source**: [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)

#### Form-Specific Progressive Disclosure
Research on conditional field display:

- **Effective technique**: Reducing visible fields increases completion likelihood
- **Cognitive load reduction**: Users only see information relevant to current step
- **Best practices**:
  - Hide fields that aren't applicable yet (reveal when triggered)
  - Keep disclosure levels below three
  - Implement for complex workflows, not simple data entry
- **Accessibility**: Hidden content must not be reachable by keyboard/screen readers

**Sources**:
- [Progressive disclosure | Mirakl Design](https://design.mirakl.com/design/patterns/progressive-disclosure)
- [What is Progressive Disclosure? Show & Hide the Right Information | UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)

### Device-Specific Findings

#### Desktop (1440px+)
- **Accordions questionable**: NN/g states desktop accordion use is "debatable"
- **Space is not limited**: Scrolling is easier than clicking accordion headers
- **User expectation**: Desktop users handle substantial content when well-structured
- **Research finding**: "Users do scroll long pages when content is relevant and properly formatted"
- **Eye-tracking data**: 20% of attention goes below the fold; users see bottom-of-page content

#### Mobile/Tablet (iPad)
- **Accordions beneficial**: "One of the most useful design elements" (NN/g)
- **Space constraint**: Real limitation on small screens makes collapse worthwhile
- **User behavior**: Quick content scanning to determine relevance before scrolling
- **Best practice**: Sticky accordion headers when content is long
- **Form-specific**: Accordions help convey workflow without page loads

### Eye-Tracking Form Research

#### Field Visibility Findings
From Luke Wroblewski's eye-tracking study:

- **Label alignment matters**: Top or right-aligned labels = lower eye fixations and faster completion (short forms only)
- **Context dependency**: Left-aligned labels better for long forms with optional fields where users need to scan
- **Bold labels**: Can compete with input fields for visual attention; normal font provides better contrast
- **Key principle**: Visual contrast between labels and fields supports scannability

**Source**: [LukeW | Eyetracking Web Forms](https://www.lukew.com/ff/entry.asp?374=)

#### General Form Layout
From CX Partners eye-tracking research:

- **Vertical layout wins**: Users complete forms top to bottom; single-column layouts always better than multi-column
- **Help text**: Large amounts of always-visible text "proves to be a real distraction from main task of form-filling"
- **Optional fields**: "Increasing opportunities for errors, frustration and abandonment"
- **Recommendation**: Seriously consider merits of having optional fields

**Source**: [Web form design guidelines: an eyetracking study | cxpartners](https://www.cxpartners.co.uk/our-thinking/web_forms_design_guidelines_an_eyetracking_study/)

## Application to Crispy CRM

### Context Analysis
- **6 account managers**: Small, trained user base (not general public)
- **Desktop-first (1440px+)**: Ample screen space available
- **iPad secondary support**: 10.2" to 12.9" screens (1620-2048px wide)
- **Forms: 4-12 fields each**: Well below the intimidation threshold (10-15+ fields)
- **Field sales use case**: Quick data entry is critical ("<30 sec per entry")
- **Pre-launch MVP**: Prioritizing adoption over space optimization
- **Goal**: 100% adoption, cessation of Excel usage within 30 days

### Why Collapsed Sections Don't Fit

1. **Form length is NOT a problem**: 4-12 fields is well below Baymard's intimidation threshold
2. **Desktop space is abundant**: At 1440px+ width, collapsed sections solve a non-existent problem
3. **Interaction cost hurts speed**: Every click to expand adds friction to quick data entry goal
4. **Field visibility matters**: Sales reps need to see all required data at a glance
5. **iPad screens are large enough**: 1620-2048px wide is comparable to small desktop displays
6. **Training burden**: Teaching when to expand/collapse sections adds complexity
7. **No branching logic**: CRM forms are straightforward data entry, not conditional workflows

### Research-Backed Concerns

**From GDS research**: Accordions with any complexity "can be very tricky to get these things right" and create disconcerting user experiences.

**From NN/g**: "It is easier to scroll down the page than to decide which heading to click on." For Crispy CRM's goal of <30 second data entry, this decision friction is unacceptable.

**From Baymard**: Forms with accordion layouts create "unpredictability and fear of potential data loss" when users are "uncertain about which fields will actually be submitted."

**From eye-tracking research**: Always-visible content is easier to scan than content requiring interaction to reveal.

### When Accordions WOULD Make Sense

Based on research, collapsed sections would be appropriate if Crispy CRM had:
- Mobile-phone interface (not tablet)
- 20+ field forms causing genuine intimidation
- Complex branching workflows where sections are mutually exclusive
- Advanced/expert features that novices shouldn't see
- Extremely limited screen real estate

**None of these conditions apply to Crispy CRM.**

## Recommendation: REMOVE Collapsed Sections

### Rationale
1. **Desktop-first context**: Research clearly shows accordions are "debatable" on desktop but "useful" on mobile. Crispy CRM is desktop-first (1440px+) with iPad (1620-2048px) secondary support—both contexts where accordions provide minimal benefit.

2. **Field count**: At 4-12 fields per form, Crispy CRM is well below the 10-15+ field threshold where users become intimidated. The space-saving benefit is negligible.

3. **Interaction cost**: Every accordion click adds friction. For a "quick activity logging (<30 sec per entry)" goal, this directly contradicts the speed objective.

4. **Visibility trumps space**: Research consistently shows hidden fields get ignored, create uncertainty, and reduce form completion confidence.

5. **Adoption priority**: Pre-launch MVP prioritizing "100% adoption within 30 days" needs maximum simplicity. Accordions add conceptual complexity without benefit.

### Alternative Approaches

#### 1. Single-Column Vertical Layout (RECOMMENDED)
- **Research support**: Eye-tracking shows single columns complete faster than multi-column
- **Implementation**: Stack all 4-12 fields vertically with clear visual hierarchy
- **Benefit**: Eliminates decision-making; users simply scroll top-to-bottom
- **Crispy CRM fit**: Perfect for desktop (1440px+) and iPad (1620-2048px) screens

#### 2. Visual Grouping with Headers (NOT Accordions)
- **Research support**: NN/g confirms users handle substantial content when well-structured
- **Implementation**: Use visible section headers (e.g., "Contact Details", "Sales Information") without collapse functionality
- **Benefit**: Provides organization without hiding content
- **Crispy CRM fit**: Helps categorize fields for scanning without interaction cost

#### 3. Conditional Field Display (Limited Use)
- **Research support**: Progressive disclosure works when fields are genuinely inapplicable
- **Implementation**: Hide truly optional/advanced fields behind clear triggers (e.g., "Add custom terms" checkbox reveals terms field)
- **Benefit**: Reduces clutter for common cases while making advanced options discoverable
- **Crispy CRM fit**: Only for genuinely optional fields that <50% of users need

#### 4. Multi-Step Forms with Progress Indicators
- **Research support**: Multi-step forms convert 86% higher than single-step forms; perceived effort matters more than step count
- **Implementation**: Split CREATE forms (especially those with 10-12 fields) into 2-3 logical steps
- **Benefit**: Reduces cognitive load without hiding information within current step
- **Crispy CRM fit**: Could work for Complex Create forms (Opportunity, Organization); NOT for quick activity logging

## Sources

1. [No more accordions: how to choose a form structure – User research in government](https://userresearch.blog.gov.uk/2015/08/13/no-more-accordions-how-to-choose-a-form-structure/)
2. [Accordions for Complex Website Content on Desktops - NN/G](https://www.nngroup.com/articles/accordions-complex-content/)
3. [Accordions on Mobile - NN/G](https://www.nngroup.com/articles/mobile-accordions/)
4. [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)
5. [Always Collapse Completed Accordion Checkout Steps into Summaries – Baymard](https://baymard.com/blog/accordion-checkout-usability)
6. [Accordion Style Checkouts – The Holy Grail of Checkout Usability? – Baymard](https://baymard.com/blog/accordion-style-checkout)
7. [Checkout Optimization: Minimize Form Fields – Baymard](https://baymard.com/blog/checkout-flow-average-form-fields)
8. [Accordion UX: The Pitfalls of Inline Accordion and Tab Designs – Baymard](https://baymard.com/blog/accordion-and-tab-design)
9. [E-Commerce Checkout Usability: An Original Research Study – Baymard](https://baymard.com/research/checkout-usability)
10. [LukeW | Eyetracking Web Forms](https://www.lukew.com/ff/entry.asp?374=)
11. [Web form design guidelines: an eyetracking study | cxpartners](https://www.cxpartners.co.uk/our-thinking/web_forms_design_guidelines_an_eyetracking_study/)
12. [Progressive disclosure | Mirakl Design](https://design.mirakl.com/design/patterns/progressive-disclosure)
13. [What is Progressive Disclosure? Show & Hide the Right Information | UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)
14. [5 Studies on How Form Length Impacts Conversions | Venture Harbour](https://ventureharbour.com/how-form-length-impacts-conversion-rates/)
15. [150 Online Form Statistics: Usage, Abandonment, Conversion Rates and More](https://www.feathery.io/blog/online-form-statistics)
16. [Top 10 CRM Design Best Practices for Success - Aufait UX](https://www.aufaitux.com/blog/crm-ux-design-best-practices/)
17. [How to Design UI Forms in 2025: Your Best Guide | IxDF](https://www.interaction-design.org/literature/article/ui-form-design)
18. [Designing effective accordion UIs: Best practices for UX and implementation - LogRocket Blog](https://blog.logrocket.com/ux-design/designing-accordion-menus-complex-content/)
19. [How to Add Accordion and Tab Sections in WordPress Forms - Fluent Forms](https://fluentforms.com/accordion-and-tab-sections-in-wordpress-forms/)
20. [Accordion Design: UI Best Practices & Examples for 2025 - Marketing Scoop](https://www.marketingscoop.com/website/accordion-design-ui-best-practices-examples-for-2024/)

---

**Document completed**: 2025-12-15
**Searches conducted**: 10+ queries
**Sources reviewed**: 20+ URLs
**Recommendation confidence**: High
