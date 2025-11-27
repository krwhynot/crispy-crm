import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDataProvider, useNotify, useGetList, useGetOne } from "react-admin";
import { useState, useEffect, useMemo, useCallback } from "react";
import { startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  activityLogSchema,
  type ActivityLogInput,
  ACTIVITY_TYPE_MAP,
} from "../validation/activitySchema";
import { useCurrentSale } from "../hooks/useCurrentSale";

// Cache duration for data queries (5 minutes)
const STALE_TIME_MS = 5 * 60 * 1000;

// Initial page size for dropdown population
const INITIAL_PAGE_SIZE = 100;

// Minimum characters before server search
const MIN_SEARCH_LENGTH = 2;

// Debounce delay for search
const DEBOUNCE_MS = 300;

interface QuickLogFormProps {
  onComplete: () => void;
  onRefresh?: () => void; // Callback to refresh dashboard data
}

// Type definitions for entities
interface Contact {
  id: number;
  name: string;
  organization_id?: number;
  company_name?: string;
}

interface Organization {
  id: number;
  name: string;
}

interface Opportunity {
  id: number;
  name: string;
  customer_organization_id?: number;
  stage: string;
}

/**
 * Custom hook for debounced search state
 */
function useDebouncedSearch(delay: number = DEBOUNCE_MS) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(handler);
  }, [searchTerm, delay]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
  }, []);

  return { searchTerm, debouncedTerm, setSearchTerm, clearSearch };
}

export function QuickLogForm({ onComplete, onRefresh }: QuickLogFormProps) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { salesId, loading: salesIdLoading } = useCurrentSale();

  // Combobox open state - controlled popovers that close on selection
  const [contactOpen, setContactOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [oppOpen, setOppOpen] = useState(false);

  // Debounced search state for each dropdown
  const contactSearch = useDebouncedSearch();
  const orgSearch = useDebouncedSearch();
  const oppSearch = useDebouncedSearch();

  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: activityLogSchema.partial().parse({}),
  });

  // Consolidate all form.watch() calls at component top for stable memoization
  const selectedOpportunityId = form.watch("opportunityId");
  const selectedContactId = form.watch("contactId");
  const selectedOrganizationId = form.watch("organizationId");
  const activityType = form.watch("activityType");
  const createFollowUp = form.watch("createFollowUp");

  // ============================================
  // DATA FETCHING WITH useGetList + CACHING
  // ============================================

  // Determine if we should do server search (2+ chars typed)
  const shouldSearchContacts = contactSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH;
  const shouldSearchOrgs = orgSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH;
  const shouldSearchOpps = oppSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH;

  // Build contact filter with server-side search
  // Server-side q filter is transformed to ILIKE search in contactsCallbacks.ts
  const contactFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    // Apply organization filter if anchor org is set (cascading filter)
    if (selectedOrganizationId) {
      filter.organization_id = selectedOrganizationId;
    }
    // Enable server-side search via ILIKE transformation in callbacks
    if (contactSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = contactSearch.debouncedTerm;
    }
    return filter;
  }, [selectedOrganizationId, contactSearch.debouncedTerm]);

  // Build organization filter with server-side search
  // Server-side q filter is transformed to ILIKE search in organizationsCallbacks.ts
  const orgFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    // Enable server-side search via ILIKE transformation in callbacks
    if (orgSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = orgSearch.debouncedTerm;
    }
    return filter;
  }, [orgSearch.debouncedTerm]);

  // Build opportunity filter with server-side search
  // Server-side q filter is transformed to ILIKE search in opportunitiesCallbacks.ts
  const oppFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    // Apply organization filter if anchor org is set
    if (selectedOrganizationId) {
      filter.customer_organization_id = selectedOrganizationId;
    }
    // Enable server-side search via ILIKE transformation in callbacks
    if (oppSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = oppSearch.debouncedTerm;
    }
    return filter;
  }, [selectedOrganizationId, oppSearch.debouncedTerm]);

  // Fetch contacts with hybrid approach
  const {
    data: contacts = [],
    isPending: contactsLoading,
  } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: shouldSearchContacts ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: contactFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Fetch organizations with hybrid approach
  const {
    data: organizations = [],
    isPending: organizationsLoading,
  } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: shouldSearchOrgs ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: orgFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Fetch opportunities with hybrid approach
  const {
    data: opportunities = [],
    isPending: opportunitiesLoading,
  } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: shouldSearchOpps ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: oppFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Overall loading state (initial load only)
  const isInitialLoading = contactsLoading && organizationsLoading && opportunitiesLoading &&
    contacts.length === 0 && organizations.length === 0 && opportunities.length === 0;

  // ============================================
  // DERIVED STATE
  // ============================================

  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === selectedOpportunityId),
    [opportunities, selectedOpportunityId]
  );

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId),
    [contacts, selectedContactId]
  );

  // Determine the "anchor" organization - from organization, contact, or opportunity selection
  const anchorOrganizationId = useMemo(() => {
    // Direct organization selection takes priority
    if (selectedOrganizationId) {
      return selectedOrganizationId;
    }
    // Then contact's organization
    if (selectedContact?.organization_id) {
      return selectedContact.organization_id;
    }
    // Finally opportunity's customer org
    if (selectedOpportunity?.customer_organization_id) {
      return selectedOpportunity.customer_organization_id;
    }
    return null;
  }, [selectedOrganizationId, selectedContact?.organization_id, selectedOpportunity?.customer_organization_id]);

  // Check if anchor org is missing from the fetched organizations list
  const anchorOrgMissing = useMemo(() => {
    if (!anchorOrganizationId) return false;
    return !organizations.some((o) => o.id === anchorOrganizationId);
  }, [anchorOrganizationId, organizations]);

  // Fetch the specific anchor organization if it's not in the paginated list
  const { data: fetchedAnchorOrg } = useGetOne<Organization>(
    "organizations",
    { id: anchorOrganizationId! },
    {
      enabled: anchorOrgMissing && anchorOrganizationId !== null,
      staleTime: STALE_TIME_MS,
    }
  );

  // Check if we need to fetch contacts for the anchor org (org selected first scenario)
  const contactsForAnchorOrgMissing = useMemo(() => {
    if (!anchorOrganizationId) return false;
    // If org is selected first, contacts might not include any from that org
    return !contacts.some((c) => c.organization_id === anchorOrganizationId);
  }, [anchorOrganizationId, contacts]);

  // Fetch contacts specifically for the anchor organization if none are in the paginated list
  const { data: contactsForAnchorOrg = [] } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "name", order: "ASC" },
      filter: { organization_id: anchorOrganizationId },
    },
    {
      enabled: contactsForAnchorOrgMissing && anchorOrganizationId !== null,
      staleTime: STALE_TIME_MS,
    }
  );

  // Check if we need to fetch opportunities for the anchor org (org/contact selected first)
  const oppsForAnchorOrgMissing = useMemo(() => {
    if (!anchorOrganizationId) return false;
    // If org is selected first, opportunities might not include any from that org
    return !opportunities.some((o) => o.customer_organization_id === anchorOrganizationId);
  }, [anchorOrganizationId, opportunities]);

  // Fetch opportunities specifically for the anchor organization if none are in the paginated list
  const { data: oppsForAnchorOrg = [] } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "name", order: "ASC" },
      filter: { customer_organization_id: anchorOrganizationId },
    },
    {
      enabled: oppsForAnchorOrgMissing && anchorOrganizationId !== null,
      staleTime: STALE_TIME_MS,
    }
  );

  // Filter contacts by anchor organization AND search term (client-side filtering)
  // BUG FIX: When org is selected first, main contacts list might not have contacts from that org.
  // Use the separately fetched contactsForAnchorOrg as fallback.
  const filteredContacts = useMemo(() => {
    // Start with main contacts or fallback
    let result = contacts;

    // Apply anchor org filter if set
    if (anchorOrganizationId) {
      const filtered = contacts.filter((c) => c.organization_id === anchorOrganizationId);
      // Use fallback if main list has no matches
      result = filtered.length === 0 && contactsForAnchorOrg.length > 0
        ? contactsForAnchorOrg
        : filtered;
    }

    // Apply search term filter (client-side search for responsiveness)
    if (contactSearch.debouncedTerm.length > 0) {
      const searchLower = contactSearch.debouncedTerm.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.company_name?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [contacts, anchorOrganizationId, contactsForAnchorOrg, contactSearch.debouncedTerm]);

  // Filter organizations by anchor organization AND search term (client-side filtering)
  // BUG FIX: When anchorOrganizationId is set but the org isn't in the fetched list,
  // we fetch it separately via useGetOne and include it here.
  const filteredOrganizations = useMemo(() => {
    let result = organizations;

    // Apply anchor org filter if set (locks to single org for cascading consistency)
    if (anchorOrganizationId) {
      const filtered = organizations.filter((o) => o.id === anchorOrganizationId);
      // Use fallback if not in paginated list
      result = filtered.length === 0 && fetchedAnchorOrg ? [fetchedAnchorOrg] : filtered;
    }

    // Apply search term filter (client-side search for responsiveness)
    if (orgSearch.debouncedTerm.length > 0) {
      const searchLower = orgSearch.debouncedTerm.toLowerCase();
      result = result.filter((o) => o.name.toLowerCase().includes(searchLower));
    }

    return result;
  }, [organizations, anchorOrganizationId, fetchedAnchorOrg, orgSearch.debouncedTerm]);

  // Filter opportunities by anchor organization AND search term (client-side filtering)
  // BUG FIX: When org/contact is selected first, main opportunities list might not have opps from that org.
  // Use the separately fetched oppsForAnchorOrg as fallback.
  const filteredOpportunities = useMemo(() => {
    let result = opportunities;

    // Apply anchor org filter if set
    if (anchorOrganizationId) {
      const filtered = opportunities.filter(
        (o) => o.customer_organization_id === anchorOrganizationId
      );
      // Use fallback if main list has no matches
      result = filtered.length === 0 && oppsForAnchorOrg.length > 0
        ? oppsForAnchorOrg
        : filtered;
    }

    // Apply search term filter (client-side search for responsiveness)
    if (oppSearch.debouncedTerm.length > 0) {
      const searchLower = oppSearch.debouncedTerm.toLowerCase();
      result = result.filter((o) => o.name.toLowerCase().includes(searchLower));
    }

    return result;
  }, [opportunities, anchorOrganizationId, oppsForAnchorOrg, oppSearch.debouncedTerm]);

  // ============================================
  // SIDE EFFECTS
  // ============================================

  // When opportunity changes, auto-fill organization and clear mismatched contact
  useEffect(() => {
    if (selectedOpportunity?.customer_organization_id) {
      // Auto-fill organization from opportunity's customer organization
      form.setValue("organizationId", selectedOpportunity.customer_organization_id);

      // Clear contact if it doesn't belong to the opportunity's customer org
      const currentContactId = form.getValues("contactId");
      if (currentContactId) {
        const contact = contacts.find((c) => c.id === currentContactId);
        if (contact && contact.organization_id !== selectedOpportunity.customer_organization_id) {
          form.setValue("contactId", undefined);
          notify("Contact cleared: doesn't belong to selected opportunity's organization", {
            type: "info",
          });
        }
      }
    }
  }, [selectedOpportunity?.customer_organization_id, contacts, form, notify]);

  // Clear search when popover closes
  useEffect(() => {
    if (!contactOpen) contactSearch.clearSearch();
  }, [contactOpen, contactSearch]);

  useEffect(() => {
    if (!orgOpen) orgSearch.clearSearch();
  }, [orgOpen, orgSearch]);

  useEffect(() => {
    if (!oppOpen) oppSearch.clearSearch();
  }, [oppOpen, oppSearch]);

  // ============================================
  // FORM SUBMISSION
  // ============================================

  const onSubmit = async (data: ActivityLogInput, closeAfterSave = true) => {
    // Validate salesId exists before attempting to create records
    if (!salesId) {
      notify("Cannot log activity: user session expired. Please refresh and try again.", {
        type: "error",
      });
      return;
    }

    try {
      // Create the activity record
      await dataProvider.create("activities", {
        data: {
          activity_type: data.opportunityId ? "interaction" : "engagement",
          type: ACTIVITY_TYPE_MAP[data.activityType],
          outcome: data.outcome,
          subject: data.notes.substring(0, 100) || `${data.activityType} update`,
          description: data.notes,
          activity_date: data.date.toISOString(),
          duration_minutes: data.duration,
          contact_id: data.contactId,
          organization_id: data.organizationId,
          opportunity_id: data.opportunityId,
          follow_up_required: data.createFollowUp || false,
          follow_up_date: data.followUpDate ? data.followUpDate.toISOString().split("T")[0] : null,
          created_by: salesId,
        },
      });

      // Create follow-up task if requested
      if (data.createFollowUp && data.followUpDate) {
        const taskData = {
          title: `Follow-up: ${data.notes.substring(0, 50)}`,
          due_date: data.followUpDate.toISOString(),
          type: "Follow-up",
          priority: "medium",
          sales_id: salesId,
          created_by: salesId,
        };
        if (typeof data.contactId === "number" && !isNaN(data.contactId)) {
          Object.assign(taskData, { contact_id: data.contactId });
        }
        if (typeof data.opportunityId === "number" && !isNaN(data.opportunityId)) {
          Object.assign(taskData, { opportunity_id: data.opportunityId });
        }
        await dataProvider.create("tasks", { data: taskData });
      }

      notify("Activity logged successfully", { type: "success" });
      form.reset();

      if (closeAfterSave) {
        onComplete();
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      notify("Failed to log activity", { type: "error" });
      console.error("Activity log error:", error);
    }
  };

  // Derived UI state from pre-watched values
  const showDuration = activityType === "Call" || activityType === "Meeting";
  const showFollowUpDate = createFollowUp;

  // Show loading state while entities or salesId are loading
  if (isInitialLoading || salesIdLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <div className="mt-2 text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Group 1: What happened? */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">What happened?</h3>

          <FormField
            control={form.control}
            name="activityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activity Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Note">Note</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="outcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outcome</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Connected">Connected</SelectItem>
                    <SelectItem value="Left Voicemail">Left Voicemail</SelectItem>
                    <SelectItem value="No Answer">No Answer</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showDuration && (
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      className="h-11"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Group 2: Who was involved? */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Who was involved?</h3>

          {/* Contact Combobox with hybrid search */}
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contact</FormLabel>
                <div className="flex gap-2">
                  <Popover open={contactOpen} onOpenChange={setContactOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={contactOpen}
                          aria-haspopup="listbox"
                          aria-controls="contact-list"
                          className={cn(
                            "h-11 flex-1 justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? (contacts.find((c) => c.id === field.value)?.name
                              ?? contactsForAnchorOrg.find((c) => c.id === field.value)?.name
                              ?? "Select contact")
                            : "Select contact"}
                          {contactsLoading ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command id="contact-list" shouldFilter={false}>
                        <CommandInput
                          placeholder="Search contact..."
                          value={contactSearch.searchTerm}
                          onValueChange={contactSearch.setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {contactsLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2">Searching...</span>
                              </div>
                            ) : anchorOrganizationId ? (
                              "No contacts found for this organization"
                            ) : (
                              "No contact found. Type to search."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredContacts.map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={String(contact.id)}
                                className="h-11"
                                onSelect={() => {
                                  field.onChange(contact.id);
                                  if (contact.organization_id) {
                                    form.setValue("organizationId", contact.organization_id);
                                  }
                                  setContactOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === contact.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="flex flex-col">
                                  <span>{contact.name}</span>
                                  {contact.company_name && (
                                    <span className="text-xs text-muted-foreground">
                                      {contact.company_name}
                                    </span>
                                  )}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {field.value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => {
                        field.onChange(undefined);
                        form.setValue("organizationId", undefined);
                        form.setValue("opportunityId", undefined);
                      }}
                      aria-label="Clear contact selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormDescription>Select a contact and/or organization (must be from same company)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Organization Combobox with hybrid search */}
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization</FormLabel>
                <div className="flex gap-2">
                  <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={orgOpen}
                          aria-haspopup="listbox"
                          aria-controls="organization-list"
                          className={cn(
                            "h-11 flex-1 justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? (organizations.find((o) => o.id === field.value)?.name
                              ?? filteredOrganizations.find((o) => o.id === field.value)?.name
                              ?? "Select organization")
                            : "Select organization"}
                          {organizationsLoading ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command id="organization-list" shouldFilter={false}>
                        <CommandInput
                          placeholder="Search organization..."
                          value={orgSearch.searchTerm}
                          onValueChange={orgSearch.setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {organizationsLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2">Searching...</span>
                              </div>
                            ) : (
                              "No organization found. Type to search."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredOrganizations.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={String(org.id)}
                                className="h-11"
                                onSelect={() => {
                                  field.onChange(org.id);
                                  // Clear mismatched contact and opportunity
                                  const currentContactId = form.getValues("contactId");
                                  if (currentContactId) {
                                    const contact = contacts.find((c) => c.id === currentContactId);
                                    if (contact && contact.organization_id !== org.id) {
                                      form.setValue("contactId", undefined);
                                      notify("Contact cleared - doesn't belong to selected organization", { type: "info" });
                                    }
                                  }
                                  const oppId = form.getValues("opportunityId");
                                  if (oppId) {
                                    const opp = opportunities.find((o) => o.id === oppId);
                                    if (opp && opp.customer_organization_id !== org.id) {
                                      form.setValue("opportunityId", undefined);
                                    }
                                  }
                                  setOrgOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === org.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {org.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {field.value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => {
                        field.onChange(undefined);
                        const oppId = form.getValues("opportunityId");
                        if (oppId) {
                          const opp = opportunities.find((o) => o.id === oppId);
                          if (opp && opp.customer_organization_id === field.value) {
                            form.setValue("opportunityId", undefined);
                          }
                        }
                      }}
                      aria-label="Clear organization selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormDescription>Select a contact and/or organization (must be from same company)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Opportunity Combobox with hybrid search */}
          <FormField
            control={form.control}
            name="opportunityId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Opportunity</FormLabel>
                <div className="flex gap-2">
                  <Popover open={oppOpen} onOpenChange={setOppOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={oppOpen}
                          aria-haspopup="listbox"
                          aria-controls="opportunity-list"
                          className={cn(
                            "h-11 flex-1 justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? (opportunities.find((o) => o.id === field.value)?.name
                              ?? oppsForAnchorOrg.find((o) => o.id === field.value)?.name
                              ?? "Select opportunity (optional)")
                            : "Select opportunity (optional)"}
                          {opportunitiesLoading ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command id="opportunity-list" shouldFilter={false}>
                        <CommandInput
                          placeholder="Search opportunity..."
                          value={oppSearch.searchTerm}
                          onValueChange={oppSearch.setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {opportunitiesLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2">Searching...</span>
                              </div>
                            ) : anchorOrganizationId ? (
                              "No opportunities for this organization"
                            ) : (
                              "No opportunity found. Type to search."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredOpportunities.map((opp) => (
                              <CommandItem
                                key={opp.id}
                                value={String(opp.id)}
                                className="h-11"
                                onSelect={() => {
                                  field.onChange(opp.id);
                                  setOppOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === opp.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {opp.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {field.value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => field.onChange(undefined)}
                      aria-label="Clear opportunity selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Group 3: Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Summary of the interaction..."
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Group 4: Follow-up */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="createFollowUp"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel className="text-sm font-medium">Create follow-up task?</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {showFollowUpDate && (
            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Follow-up Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < startOfDay(new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="h-11"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Close"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11"
              disabled={form.formState.isSubmitting}
              onClick={() => {
                form.handleSubmit((data) => {
                  onSubmit(data, false);
                })();
              }}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & New"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
