# CRM Migration Business Rules & Clarifications

## Organization Role Questions

1. **Can a company be BOTH a customer AND a distributor simultaneously?**
   - **FALSE** - Companies have mutually exclusive primary roles

2. **Can a company be BOTH a principal AND a distributor simultaneously?**
   - **TRUE** - A principal can also distribute other principals' products

3. **Can a company be BOTH a principal AND a customer simultaneously?**
   - **FALSE** - Principals don't buy from other principals in this model

4. **If a company is marked as a Principal, they ONLY manufacture/own products and never buy from other principals?**
   - **TRUE** - Principals are purely manufacturers/owners

5. **Every company must be classified as at least one of: Customer, Principal, or Distributor?**
   - **FALSE** - Additional classifications exist: Customer, Principal, Distributor, Prospect, Unknown

## Contact Relationship Questions

6. **Can a contact belong to multiple organizations simultaneously?**
   - **TRUE** - Contacts can belong to multiple organizations

7. **Can a contact advocate for multiple principals at the same time?**
   - **TRUE** - Contacts can champion multiple principals' products

8. **Must every contact have at least one advocacy relationship with a principal?**
   - **FALSE** - Advocacy relationships are optional

9. **Does a contact's purchase influence (High/Medium/Low) apply globally or vary per principal?**
   - **VARIES** - Purchase influence varies per principal they advocate for

10. **Can a contact at a distributor organization also be a decision maker for purchasing?**
    - **FALSE** - Distributor contacts don't make purchasing decisions

## Deal (Opportunity) Structure Questions

11. **Can a single deal involve multiple principals?**
    - **NO** - Each principal must have a separate deal

12. **Must a deal have exactly one customer organization?**
    - **TRUE** - One customer per deal

13. **Can a deal exist without any products?**
    - **FALSE** - Deals must have products

14. **When a deal is created with multiple principals selected, does the system create separate deals?**
    - **TRUE** - System creates one deal per principal

15. **Can a deal change its principal assignment after creation?**
    - **TRUE** - Principal can be reassigned

## Product & Distribution Questions

16. **Can a product have multiple principals as owners?**
    - **FALSE** - One principal per product

17. **Must a product have at least one distributor assigned?**
    - **FALSE** - Products can exist without distributors

18. **Can a product have multiple primary distributors?**
    - **TRUE** - Multiple primary distributors allowed

19. **Can a distributor refuse to carry certain products from a principal?**
    - **TRUE** - Distributors don't have to carry all products from principals

20. **Can products be sold directly by principals without any distributor?**
    - **TRUE** - Direct sales are allowed

## Interaction & Activity Questions

21. **Must an interaction be linked to an opportunity?**
    - **TRUE** - Interactions must be linked to opportunities

22. **Can an interaction involve multiple contacts from the same organization?**
    - **TRUE** - Multiple contacts per interaction allowed

23. **Can interactions move a deal backward in stages?**
    - **TRUE** - Backward movement is allowed

24. **Can multiple interactions happen on the same day for the same deal?**
    - **TRUE** - Multiple daily interactions allowed

25. **Does an interaction with a contact automatically imply interaction with their organization?**
    - **TRUE** - Contact interaction implies organization interaction

## Data Integrity & Business Rules

26. **When a company is soft-deleted, should all its contacts also be soft-deleted?**
    - **TRUE** - Cascade soft deletion

27. **Can a deal continue if its customer organization is soft-deleted?**
    - **TRUE** - But flagged that customer has been deleted

28. **Should historical deals show product prices at time of deal?**
    - **TRUE** - Price snapshots required

29. **Can a contact be primary decision maker for multiple organizations?**
    - **TRUE** - One contact can be primary for multiple orgs

30. **Should an organization with no contacts be prevented from having deals?**
    - **TRUE** - Contacts required for deals

## Workflow & Process Questions

31. **Should contact advocacy strength changes be tracked historically?**
    - **FALSE** - No historical tracking needed

32. **Must deal stages progress sequentially?**
    - **FALSE** - Can skip stages

33. **Can a "Closed-Won" deal be reopened?**
    - **TRUE** - Deals can be reopened

34. **Do Principal-Distributor relationships have contract periods?**
    - **TRUE** - But not required

35. **Is a distributor's commission rate the same for all products?**
    - **REMOVED** - Commission rate not needed in system

## Reporting & Analytics Questions

36. **Should all reporting be Principal-centric?**
    - **FALSE** - But Principal-centric reporting is the main focus

37. **Should contact advocacy success be measurable?**
    - **FALSE** - Not tracking advocacy-to-sales conversion

38. **Should organizations without contacts appear in warnings?**
    - **TRUE** - Flag organizations lacking contacts

39. **Is deal probability manually set or automatic?**
    - **AUTOMATIC** - Calculated based on stage

40. **Does interaction frequency affect deal health scoring?**
    - **TRUE** - Frequency impacts health scores

## Additional Clarifications

41. **Difference between "Primary Contact" and "Primary Decision Maker"?**
    - **NO DIFFERENCE** - Terms are synonymous

42. **What happens when a contact moves organizations?**
    - **KEEP HISTORY** - Maintain historical record

43. **Should the system track competitive principals?**
    - **NO** - Don't track competition

44. **How do exclusive distribution agreements work?**
    - **NO EXCLUSIVITY** - No exclusive agreements

45. **Is there territory/geography limiting distribution?**
    - **NO TERRITORY** - No geographic limitations

## Critical Business Logic: Opportunities, Deals, and Activities

### Fundamental Relationships
- **An opportunity is the reason to have an interaction**
- **You cannot have an interaction without first having an opportunity**
- **A deal is ANY opportunity with stage of "closed-won" OR "closed-lost"** (not just won)
- **Stages track progress for opportunities becoming a deal**

### Activity Classification
- **Activities**: General term for all customer touchpoints (emails, calls, meetings)
- **Engagements**: Activities WITHOUT an opportunity attached
- **Interactions**: Activities WITH an opportunity attached

### Key Rules
1. **Opportunities represent potential business** (TRUE)
2. **Deals are NOT separate entities** - they are opportunities with closed stages
3. **When an opportunity closes, it does NOT create a separate record** - it just updates the stage and tags it as a deal
4. **The atomic CRM "deals" table should be renamed to "opportunities"** (TRUE)
5. **Closed-lost opportunities ARE deals** (just unsuccessful ones)
6. **You MUST create an opportunity before logging interactions** (TRUE)
7. **General check-ins are Engagements** (activities not tied to opportunities)
8. **Every interaction requires an opportunity** but not every activity does
9. **Historical reporting must distinguish** active opportunities from closed deals (TRUE)
10. **One table design**: Use "opportunities" table with stage-based classification

### Progression Flow
- Opportunity Created → Interactions logged → Stages advance → Becomes Deal (closed-won/lost)
- Activities can be: Engagements (no opportunity) OR Interactions (with opportunity)

## Key Implications for Schema Design

### Mutually Exclusive Roles
- Companies are EITHER customers OR distributors (never both)
- Exception: Principals can also be distributors
- Need CHECK constraint or separate table approach

### Contact Advocacy Model
- Contacts can belong to MULTIPLE organizations
- Can advocate for MULTIPLE principals
- Advocacy strength is per-principal, not global
- Not all contacts need advocacy relationships

### Opportunity/Deal Structure
- Strictly one principal per opportunity
- Automatic opportunity creation for multi-principal scenarios
- Probability auto-calculated from stage
- Must have products and customer
- Deals are opportunities with stage 'closed-won' or 'closed-lost' (not separate entities)

### Soft Delete Cascading
- Company deletion cascades to contacts
- Deals continue but are flagged
- Historical data preservation is critical

### No Commission or Territory
- Remove commission tracking
- No geographic constraints
- No exclusive distribution agreements

## CLARIFICATIONS - Conflicts Resolved

### Contact-Organization Relationship
- **CLARIFIED**: Contacts CAN belong to multiple organizations (Q6 changed to TRUE)
- This resolves the conflict with Q29 (contact can be primary decision maker for multiple orgs)
- Implementation: Need many-to-many relationship table between contacts and organizations

### Opportunities vs Deals
- **CLARIFIED**: Deals are NOT separate entities
- Deals are simply opportunities with stage = 'closed-won' or 'closed-lost'
- NO separate deal record is created when an opportunity closes
- The opportunity is just tagged/marked as a deal based on its stage
- Use ONE table: "opportunities" (rename atomic CRM's "deals" table)

### Interactions
- **CLARIFIED**: Interactions must be linked to OPPORTUNITIES (not "deals")
- This is consistent throughout - interactions advance opportunities through stages
- When opportunity reaches closed stage, it becomes a deal (but same record)