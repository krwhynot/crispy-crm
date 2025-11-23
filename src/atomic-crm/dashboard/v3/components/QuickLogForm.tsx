import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDataProvider, useNotify } from "react-admin";
import { useState, useEffect, useMemo } from "react";
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
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  activityLogSchema,
  type ActivityLogInput,
  ACTIVITY_TYPE_MAP,
} from "../validation/activitySchema";
import { useCurrentSale } from "../hooks/useCurrentSale";

interface QuickLogFormProps {
  onComplete: () => void;
  onRefresh?: () => void; // Callback to refresh dashboard data
}

export function QuickLogForm({ onComplete, onRefresh }: QuickLogFormProps) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { salesId, loading: salesIdLoading } = useCurrentSale();
  const [contacts, setContacts] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Combobox open state - controlled popovers that close on selection
  const [contactOpen, setContactOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [oppOpen, setOppOpen] = useState(false);

  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: activityLogSchema.partial().parse({}),
  });

  // Track selected values for cascading filters
  const selectedOpportunityId = form.watch("opportunityId");
  const selectedContactId = form.watch("contactId");

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
    const organizationId = form.watch("organizationId");
    if (organizationId) {
      return organizationId;
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
  }, [form.watch("organizationId"), selectedContact?.organization_id, selectedOpportunity?.customer_organization_id]);

  // Filter contacts by anchor organization
  const filteredContacts = useMemo(() => {
    if (!anchorOrganizationId) {
      return contacts;
    }
    return contacts.filter((c) => c.organization_id === anchorOrganizationId);
  }, [contacts, anchorOrganizationId]);

  // Filter organizations by anchor organization (lock to single org when anchor exists)
  const filteredOrganizations = useMemo(() => {
    if (!anchorOrganizationId) {
      return organizations;
    }
    // Only show the anchor organization when one is set
    return organizations.filter((o) => o.id === anchorOrganizationId);
  }, [organizations, anchorOrganizationId]);

  // Filter opportunities by anchor organization
  const filteredOpportunities = useMemo(() => {
    if (!anchorOrganizationId) {
      return opportunities;
    }
    return opportunities.filter(
      (o) => o.customer_organization_id === anchorOrganizationId
    );
  }, [opportunities, anchorOrganizationId]);

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

  // Load related entities
  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoading(true);
        const [contactsRes, orgsRes, oppsRes] = await Promise.all([
          dataProvider.getList("contacts", {
            pagination: { page: 1, perPage: 5000 },
            sort: { field: "name", order: "ASC" },
            filter: {},
          }),
          dataProvider.getList("organizations", {
            pagination: { page: 1, perPage: 5000 },
            sort: { field: "name", order: "ASC" },
            filter: {},
          }),
          dataProvider.getList("opportunities", {
            pagination: { page: 1, perPage: 100 },
            sort: { field: "name", order: "ASC" },
            filter: {},
          }),
        ]);

        setContacts(contactsRes.data);
        setOrganizations(orgsRes.data);
        setOpportunities(
          oppsRes.data.filter((opp: any) => !["closed_won", "closed_lost"].includes(opp.stage))
        );
      } catch (error) {
        console.error("Failed to load entities:", error);
        notify("Failed to load data", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, [dataProvider, notify]);

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
          activity_type: data.activityType === "Note" ? "engagement" : "interaction",
          type: ACTIVITY_TYPE_MAP[data.activityType],
          outcome: data.outcome, // ✅ Persist user-selected outcome
          subject: data.notes.substring(0, 100) || `${data.activityType} update`,
          description: data.notes,
          activity_date: data.date.toISOString(),
          duration_minutes: data.duration,
          contact_id: data.contactId,
          organization_id: data.organizationId,
          opportunity_id: data.opportunityId,
          follow_up_required: data.createFollowUp || false, // ✅ Track if follow-up needed
          follow_up_date: data.followUpDate ? data.followUpDate.toISOString().split("T")[0] : null, // ✅ Store follow-up date (DATE format YYYY-MM-DD)
          created_by: salesId,
        },
      });

      // Create follow-up task if requested
      if (data.createFollowUp && data.followUpDate) {
        // Build task data with only valid IDs (use ternary to ensure we spread objects, not NaN)
        const taskData = {
          title: `Follow-up: ${data.notes.substring(0, 50)}`,
          due_date: data.followUpDate.toISOString(),
          type: "Follow-up", // Match schema enum (title-case with hyphen)
          priority: "medium",
          sales_id: salesId,
          created_by: salesId,
        };
        // Only add IDs if they're valid numbers (not NaN/undefined/null)
        // Note: tasks table only has contact_id and opportunity_id, NOT organization_id
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

      // Only close if Save & Close was clicked
      if (closeAfterSave) {
        onComplete();
      }

      // Trigger dashboard data refresh if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      notify("Failed to log activity", { type: "error" });
      console.error("Activity log error:", error);
    }
  };

  const showDuration =
    form.watch("activityType") === "Call" || form.watch("activityType") === "Meeting";
  const showFollowUpDate = form.watch("createFollowUp");

  // Show loading state while entities or salesId are loading
  if (loading || salesIdLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
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

          {/* Contact Combobox - Controlled popover that closes on selection */}
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contact</FormLabel>
                <Popover open={contactOpen} onOpenChange={setContactOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-11 w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? contacts.find((c) => c.id === field.value)?.name
                          : "Select contact"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command
                      filter={(value, search) =>
                        value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                      }
                    >
                      <CommandInput placeholder="Search contact..." />
                      <CommandEmpty>
                        {selectedOpportunity
                          ? "No contacts found for this opportunity's organization"
                          : "No contact found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredContacts.map((contact) => (
                          <CommandItem
                            key={contact.id}
                            value={`${contact.name} ${contact.company_name || ""}`}
                            onSelect={() => {
                              field.onChange(contact.id);
                              // Auto-fill organization if contact has one
                              if (contact.organization_id) {
                                form.setValue("organizationId", contact.organization_id);
                              }
                              setContactOpen(false); // Close popover after selection
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
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Select a contact OR organization</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Organization Combobox - Controlled popover that closes on selection */}
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization</FormLabel>
                <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-11 w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? organizations.find((o) => o.id === field.value)?.name
                          : "Select organization"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command
                      filter={(value, search) =>
                        value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                      }
                    >
                      <CommandInput placeholder="Search organization..." />
                      <CommandEmpty>No organization found.</CommandEmpty>
                      <CommandGroup>
                        {filteredOrganizations.map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.name}
                            onSelect={() => {
                              field.onChange(org.id);
                              setOrgOpen(false); // Close popover after selection
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
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Select a contact OR organization</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Opportunity Combobox - Controlled popover with clear button */}
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
                          className={cn(
                            "h-11 flex-1 justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? opportunities.find((o) => o.id === field.value)?.name
                            : "Select opportunity (optional)"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command
                        filter={(value, search) =>
                          value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                        }
                      >
                        <CommandInput placeholder="Search opportunity..." />
                        <CommandEmpty>
                          {selectedContact
                            ? "No opportunities for this contact's organization"
                            : "No opportunity found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredOpportunities.map((opp) => (
                            <CommandItem
                              key={opp.id}
                              value={opp.name}
                              onSelect={() => {
                                field.onChange(opp.id);
                                setOppOpen(false); // Close popover after selection
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
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Clear button - only visible when opportunity is selected */}
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
          <Button type="button" variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="submit" className="h-11">
              Save & Close
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11"
              onClick={() => {
                form.handleSubmit((data) => {
                  onSubmit(data, false); // ✅ Pass false to keep form open
                  // Form resets but stays open for next entry
                })();
              }}
            >
              Save & New
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
