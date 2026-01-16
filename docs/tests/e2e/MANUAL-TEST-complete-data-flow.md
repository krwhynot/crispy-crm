# Manual E2E Test: Complete Data Flow

**Feature:** Full business workflow from Principal to Closed Won
**Priority:** High
**User Role:** Admin (`admin@test.com`)
**Estimated Time:** 45-60 minutes

---

## Prerequisites

- [ ] Local dev server running (`npm run dev`)
- [ ] Database reset with seed data (`npx supabase db reset`)
- [ ] Complete flow seed data loaded (`psql ... -f supabase/seed-complete-flow.sql`)
- [ ] Logged in as Admin user

**Test Environment:**
- [ ] Local Development
- [ ] Staging
- [ ] Production (read-only verification)

---

## Test Data Summary

| Entity | Value | Notes |
|--------|-------|-------|
| Principal | Sunrise Spice Co. | Create new |
| Products | Curry Blend, Turmeric Paste, Garam Masala | 3 products |
| Distributor | Valley Foods Distribution | Create new |
| Customer | Downtown Bistro | Restaurant in Detroit |
| Contact | Lisa Park | Purchasing Manager |
| Opportunity | Spice Program - Downtown Bistro | Full flow test |

---

## Section 1: Verify Seed Data Loaded

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 1.1 | Navigate to Organizations | List view loads | [ ] | [ ] | |
| 1.2 | Search for "Acme Food" | "Acme Food Manufacturing" appears (from seed) | [ ] | [ ] | |
| 1.3 | Navigate to Products | List view loads | [ ] | [ ] | |
| 1.4 | Verify products exist | 6+ products from Acme visible | [ ] | [ ] | |
| 1.5 | Navigate to Opportunities | List view loads | [ ] | [ ] | |
| 1.6 | Search for "BBQ Sauce Program" | Seed opportunity visible, stage=closed_won | [ ] | [ ] | |

---

## Section 2: Create Principal Organization

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 2.1 | Navigate to Organizations list | List view displays | [ ] | [ ] | |
| 2.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 2.3 | Fill Name: "Sunrise Spice Co." | Name field populated | [ ] | [ ] | |
| 2.4 | Select Organization Type: "vendor" | Type dropdown shows vendor | [ ] | [ ] | |
| 2.5 | Check "This is a Principal/Manufacturer" | is_principal checkbox ON | [ ] | [ ] | |
| 2.6 | Fill City: "Cincinnati", State: "OH" | Location populated | [ ] | [ ] | |
| 2.7 | Fill Website: "https://sunrisespice.example.com" | Website populated | [ ] | [ ] | |
| 2.8 | Click "Save" | Form submits, redirects to edit view | [ ] | [ ] | |
| 2.9 | Verify success notification | Toast shows "Organization created" | [ ] | [ ] | |

---

## Section 3: Create Products for Principal

### 3.1 Create First Product
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 3.1.1 | Navigate to Products list | List view displays | [ ] | [ ] | |
| 3.1.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 3.1.3 | Fill Name: "Curry Blend" | Name field populated | [ ] | [ ] | |
| 3.1.4 | Fill SKU: "SUN-CRY-001" | SKU populated | [ ] | [ ] | |
| 3.1.5 | Select Category: "spices_seasonings" | Category dropdown | [ ] | [ ] | |
| 3.1.6 | Select Principal: "Sunrise Spice Co." | Principal autocomplete | [ ] | [ ] | |
| 3.1.7 | Fill Description: "Traditional Indian curry blend" | Description populated | [ ] | [ ] | |
| 3.1.8 | Click "Save" | Product created | [ ] | [ ] | |

### 3.2 Create Second Product
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 3.2.1 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 3.2.2 | Fill Name: "Turmeric Paste" | Name populated | [ ] | [ ] | |
| 3.2.3 | Fill SKU: "SUN-TUR-002" | SKU populated | [ ] | [ ] | |
| 3.2.4 | Select Category: "spices_seasonings" | Category selected | [ ] | [ ] | |
| 3.2.5 | Select Principal: "Sunrise Spice Co." | Principal selected | [ ] | [ ] | |
| 3.2.6 | Click "Save" | Product created | [ ] | [ ] | |

### 3.3 Create Third Product
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 3.3.1 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 3.3.2 | Fill Name: "Garam Masala" | Name populated | [ ] | [ ] | |
| 3.3.3 | Fill SKU: "SUN-GAR-003" | SKU populated | [ ] | [ ] | |
| 3.3.4 | Select Category: "spices_seasonings" | Category selected | [ ] | [ ] | |
| 3.3.5 | Select Principal: "Sunrise Spice Co." | Principal selected | [ ] | [ ] | |
| 3.3.6 | Click "Save" | Product created | [ ] | [ ] | |

---

## Section 4: Create Distributor Organization

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 4.1 | Navigate to Organizations list | List view displays | [ ] | [ ] | |
| 4.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 4.3 | Fill Name: "Valley Foods Distribution" | Name populated | [ ] | [ ] | |
| 4.4 | Select Organization Type: "distributor" | Type shows distributor | [ ] | [ ] | |
| 4.5 | Check "This is a Distributor" | is_distributor checkbox ON | [ ] | [ ] | |
| 4.6 | Fill City: "Detroit", State: "MI" | Location populated | [ ] | [ ] | |
| 4.7 | Click "Save" | Form submits successfully | [ ] | [ ] | |

---

## Section 5: Authorize Distributor for Principal

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 5.1 | Navigate to "Sunrise Spice Co." edit view | Principal org loads | [ ] | [ ] | |
| 5.2 | Look for "Authorized Distributors" section | Section visible (may be in sidebar) | [ ] | [ ] | |
| 5.3 | Click "Add Authorization" or similar | Authorization form/modal opens | [ ] | [ ] | |
| 5.4 | Select Distributor: "Valley Foods Distribution" | Distributor selected | [ ] | [ ] | |
| 5.5 | Set Authorization Date: today | Date populated | [ ] | [ ] | |
| 5.6 | Click "Save" | Authorization created | [ ] | [ ] | |

---

## Section 6: Create Customer Organization

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 6.1 | Navigate to Organizations list | List view displays | [ ] | [ ] | |
| 6.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 6.3 | Fill Name: "Downtown Bistro" | Name populated | [ ] | [ ] | |
| 6.4 | Select Organization Type: "restaurant" | Type shows restaurant | [ ] | [ ] | |
| 6.5 | Verify is_principal/is_distributor unchecked | Both should be OFF | [ ] | [ ] | |
| 6.6 | Fill City: "Detroit", State: "MI" | Location populated | [ ] | [ ] | |
| 6.7 | Fill Phone: "313-555-8000" | Phone populated | [ ] | [ ] | |
| 6.8 | Click "Save" | Organization created | [ ] | [ ] | |

---

## Section 7: Link Customer to Distributor

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 7.1 | Open "Downtown Bistro" edit view | Customer org loads | [ ] | [ ] | |
| 7.2 | Look for "Distributors" section | Section visible | [ ] | [ ] | |
| 7.3 | Add "Valley Foods Distribution" as distributor | Distributor linked | [ ] | [ ] | |
| 7.4 | Mark as Primary distributor | is_primary = true | [ ] | [ ] | |

---

## Section 8: Create Contact at Customer

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 8.1 | Navigate to Contacts list | List view displays | [ ] | [ ] | |
| 8.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 8.3 | Fill First Name: "Lisa" | First name populated | [ ] | [ ] | |
| 8.4 | Fill Last Name: "Park" | Last name populated | [ ] | [ ] | |
| 8.5 | Fill Title: "Purchasing Manager" | Title populated | [ ] | [ ] | |
| 8.6 | Select Organization: "Downtown Bistro" | Organization linked | [ ] | [ ] | |
| 8.7 | Fill Email: "lisa@downtownbistro.example.com" | Email populated | [ ] | [ ] | |
| 8.8 | Fill Phone: "313-555-8001" | Phone populated | [ ] | [ ] | |
| 8.9 | Click "Save" | Contact created | [ ] | [ ] | |
| 8.10 | Verify contact appears in list | Contact visible | [ ] | [ ] | |

---

## Section 9: Add Contact Note

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 9.1 | Open "Lisa Park" contact edit view | Contact loads | [ ] | [ ] | |
| 9.2 | Look for "Notes" section | Notes section visible | [ ] | [ ] | |
| 9.3 | Add note: "Initial call - interested in Indian spice program" | Note text entered | [ ] | [ ] | |
| 9.4 | Save the note | Note saved successfully | [ ] | [ ] | |

---

## Section 10: Create Opportunity

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 10.1 | Navigate to Opportunities list | List view displays | [ ] | [ ] | |
| 10.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 10.3 | Fill Name: "Spice Program - Downtown Bistro" | Name populated | [ ] | [ ] | |
| 10.4 | Select Customer: "Downtown Bistro" | Customer org linked | [ ] | [ ] | |
| 10.5 | Select Principal: "Sunrise Spice Co." | Principal org linked | [ ] | [ ] | |
| 10.6 | Select Distributor: "Valley Foods Distribution" | Distributor org linked | [ ] | [ ] | |
| 10.7 | Set Priority: "High" | Priority selected | [ ] | [ ] | |
| 10.8 | Set Lead Source: "Cold Call" | Lead source selected | [ ] | [ ] | |
| 10.9 | Verify Stage defaults to "New Lead" | Stage = new_lead | [ ] | [ ] | |
| 10.10 | Click "Save" | Opportunity created | [ ] | [ ] | |
| 10.11 | Verify redirect to edit view | Edit view loads | [ ] | [ ] | |

---

## Section 11: Link Contact to Opportunity

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 11.1 | On opportunity edit view, find "Contacts" section | Section visible | [ ] | [ ] | |
| 11.2 | Click "Add Contact" | Contact selector opens | [ ] | [ ] | |
| 11.3 | Select "Lisa Park" | Contact selected | [ ] | [ ] | |
| 11.4 | Set role: "Decision Maker" | Role set | [ ] | [ ] | |

---

## Section 12: Add Products to Opportunity

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 12.1 | On opportunity edit view, find "Products" section | Section visible | [ ] | [ ] | |
| 12.2 | Click "Add Product" | Product selector opens | [ ] | [ ] | |
| 12.3 | Select "Curry Blend" | Product added | [ ] | [ ] | |
| 12.4 | Add "Turmeric Paste" | Second product added | [ ] | [ ] | |
| 12.5 | Add "Garam Masala" | Third product added | [ ] | [ ] | |
| 12.6 | Save changes | Products saved to opportunity | [ ] | [ ] | |

---

## Section 13: Log Activities (Stage Progression)

### 13.1 Log Initial Outreach Activity
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 13.1.1 | Find "Activities" section on opportunity | Section visible | [ ] | [ ] | |
| 13.1.2 | Click "Log Activity" or "Quick Log" | Activity form opens | [ ] | [ ] | |
| 13.1.3 | Select Type: "Call" | Type selected | [ ] | [ ] | |
| 13.1.4 | Fill Subject: "Initial introduction call" | Subject populated | [ ] | [ ] | |
| 13.1.5 | Fill Outcome: "Scheduled sample delivery" | Outcome populated | [ ] | [ ] | |
| 13.1.6 | Save activity | Activity logged | [ ] | [ ] | |

### 13.2 Log Sample Activity
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 13.2.1 | Log another activity | Activity form opens | [ ] | [ ] | |
| 13.2.2 | Select Type: "Sample" | Type selected | [ ] | [ ] | |
| 13.2.3 | Fill Subject: "Sample delivery - all 3 spices" | Subject populated | [ ] | [ ] | |
| 13.2.4 | Check "Follow-up Required" | Checkbox checked | [ ] | [ ] | |
| 13.2.5 | Save activity | Activity logged | [ ] | [ ] | |

---

## Section 14: Create Task from Activity

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 14.1 | Navigate to Tasks list | List view displays | [ ] | [ ] | |
| 14.2 | Click "Create" button | Create form opens | [ ] | [ ] | |
| 14.3 | Fill Title: "Follow up on spice samples" | Title populated | [ ] | [ ] | |
| 14.4 | Link to Opportunity: "Spice Program - Downtown Bistro" | Opportunity linked | [ ] | [ ] | |
| 14.5 | Set Due Date: 3 days from now | Due date set | [ ] | [ ] | |
| 14.6 | Set Priority: "High" | Priority selected | [ ] | [ ] | |
| 14.7 | Click "Save" | Task created | [ ] | [ ] | |
| 14.8 | Verify task appears in list | Task visible | [ ] | [ ] | |

---

## Section 15: Progress Through Stages

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 15.1 | Open opportunity edit view | Opportunity loads | [ ] | [ ] | |
| 15.2 | Verify current stage: "new_lead" | Stage shows new_lead | [ ] | [ ] | |
| 15.3 | Change stage to "initial_outreach" | Stage updated | [ ] | [ ] | |
| 15.4 | Save changes | Saved successfully | [ ] | [ ] | |
| 15.5 | Change stage to "sample_visit_offered" | Stage updated | [ ] | [ ] | |
| 15.6 | Save changes | Saved successfully | [ ] | [ ] | |
| 15.7 | Change stage to "feedback_logged" | Stage updated | [ ] | [ ] | |
| 15.8 | Save changes | Saved successfully | [ ] | [ ] | |
| 15.9 | Change stage to "demo_scheduled" | Stage updated | [ ] | [ ] | |
| 15.10 | Save changes | Saved successfully | [ ] | [ ] | |

---

## Section 16: Close Opportunity as Won

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 16.1 | Change stage to "closed_won" | Stage updated | [ ] | [ ] | |
| 16.2 | Verify status changes to "won" | Status = won | [ ] | [ ] | |
| 16.3 | Verify actual_close_date is set | Close date populated | [ ] | [ ] | |
| 16.4 | Save changes | Saved successfully | [ ] | [ ] | |
| 16.5 | Add final note: "Deal closed! Initial order for all 3 products" | Note saved | [ ] | [ ] | |

---

## Section 17: Verify Dashboard Updates

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 17.1 | Navigate to Dashboard | Dashboard loads | [ ] | [ ] | |
| 17.2 | Check "Active Opportunities" widget | Count reflects current data | [ ] | [ ] | |
| 17.3 | Check "Opportunities by Stage" | closed_won count increased | [ ] | [ ] | |
| 17.4 | Check "Recent Activity" | Activities from test visible | [ ] | [ ] | |
| 17.5 | Check "Principal Summary" widget | Sunrise Spice Co. visible | [ ] | [ ] | |
| 17.6 | Check "Overdue Tasks" widget | No overdue for this opp | [ ] | [ ] | |

---

## Section 18: Cleanup (Optional)

**Note:** Only perform cleanup if you want to reset to seed state.

| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 18.1 | Navigate to "Spice Program - Downtown Bistro" | Opportunity loads | [ ] | [ ] | |
| 18.2 | Delete the opportunity | Soft-deleted | [ ] | [ ] | |
| 18.3 | Navigate to Tasks, delete test task | Task deleted | [ ] | [ ] | |
| 18.4 | Navigate to "Lisa Park", delete contact | Contact deleted | [ ] | [ ] | |
| 18.5 | Delete "Downtown Bistro" organization | Customer deleted | [ ] | [ ] | |
| 18.6 | Delete "Valley Foods Distribution" | Distributor deleted | [ ] | [ ] | |
| 18.7 | Navigate to Products, delete 3 Sunrise products | Products deleted | [ ] | [ ] | |
| 18.8 | Delete "Sunrise Spice Co." | Principal deleted | [ ] | [ ] | |
| 18.9 | Verify all test data removed | Clean state | [ ] | [ ] | |
| 18.10 | Dashboard reflects original seed data | Counts restored | [ ] | [ ] | |

---

## Test Summary

| Section | Tests Passed | Tests Failed | Notes |
|---------|-------------|--------------|-------|
| 1. Verify Seed Data | ___ / 6 | | |
| 2. Create Principal | ___ / 9 | | |
| 3. Create Products | ___ / 14 | | |
| 4. Create Distributor | ___ / 7 | | |
| 5. Authorize Distributor | ___ / 6 | | |
| 6. Create Customer | ___ / 8 | | |
| 7. Link to Distributor | ___ / 4 | | |
| 8. Create Contact | ___ / 10 | | |
| 9. Add Contact Note | ___ / 4 | | |
| 10. Create Opportunity | ___ / 11 | | |
| 11. Link Contact | ___ / 4 | | |
| 12. Add Products | ___ / 6 | | |
| 13. Log Activities | ___ / 10 | | |
| 14. Create Task | ___ / 8 | | |
| 15. Progress Stages | ___ / 10 | | |
| 16. Close Won | ___ / 5 | | |
| 17. Dashboard | ___ / 6 | | |
| 18. Cleanup | ___ / 10 | | |
| **TOTAL** | ___ / 128 | | |

---

## Known Issues / Limitations

1. **Distributor Authorization UI:** May require navigating to specific section
2. **Product-Opportunity Link:** UI may vary based on SlideOver vs Edit view
3. **Stage Transitions:** Some stages may auto-progress based on activities
4. **Dashboard Refresh:** May need manual refresh to see updated counts

---

## UI Element Reference

| Element | Location/Selector |
|---------|------------------|
| Create button | Top right of list views |
| Organization Type dropdown | Organization form |
| is_principal checkbox | Organization form (may be labeled "Principal/Manufacturer") |
| is_distributor checkbox | Organization form (may be labeled "Distributor") |
| Products section | Opportunity edit view, sidebar or main form |
| Activities section | Opportunity edit view |
| Stage dropdown | Opportunity form |

---

**Tester Name:** ___________________
**Date Tested:** ___________________
**Environment:** ___________________
**Build/Version:** ___________________
