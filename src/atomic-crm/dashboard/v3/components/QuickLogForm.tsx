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
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
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

  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: activityLogSchema.partial().parse({}),
  });

  // Load related entities
  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoading(true);
        const [contactsRes, orgsRes, oppsRes] = await Promise.all([
          dataProvider.getList("contacts", {
            pagination: { page: 1, perPage: 100 },
            sort: { field: "name", order: "ASC" },
            filter: {},
          }),
          dataProvider.getList("organizations", {
            pagination: { page: 1, perPage: 100 },
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
        await dataProvider.create("tasks", {
          data: {
            title: `Follow-up: ${data.notes.substring(0, 50)}`,
            due_date: data.followUpDate.toISOString(),
            type: "follow_up",
            priority: "medium",
            contact_id: data.contactId,
            opportunity_id: data.opportunityId,
            organization_id: data.organizationId,
            sales_id: salesId,
            created_by: salesId,
          },
        });
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

          {/* Contact Combobox */}
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contact *</FormLabel>
                <Popover>
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
                    <Command>
                      <CommandInput placeholder="Search contact..." />
                      <CommandEmpty>No contact found.</CommandEmpty>
                      <CommandGroup>
                        {contacts.map((contact) => (
                          <CommandItem
                            key={contact.id}
                            value={contact.name}
                            onSelect={() => {
                              field.onChange(contact.id);
                              // Auto-fill organization if contact has one
                              if (contact.organization_id) {
                                form.setValue("organizationId", contact.organization_id);
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === contact.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {contact.name}
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

          {/* Organization Combobox */}
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization *</FormLabel>
                <Popover>
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
                    <Command>
                      <CommandInput placeholder="Search organization..." />
                      <CommandEmpty>No organization found.</CommandEmpty>
                      <CommandGroup>
                        {organizations.map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.name}
                            onSelect={() => field.onChange(org.id)}
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

          {/* Opportunity Combobox */}
          <FormField
            control={form.control}
            name="opportunityId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Opportunity</FormLabel>
                <Popover>
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
                          ? opportunities.find((o) => o.id === field.value)?.name
                          : "Select opportunity (optional)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search opportunity..." />
                      <CommandEmpty>No opportunity found.</CommandEmpty>
                      <CommandGroup>
                        {opportunities.map((opp) => (
                          <CommandItem
                            key={opp.id}
                            value={opp.name}
                            onSelect={() => field.onChange(opp.id)}
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
