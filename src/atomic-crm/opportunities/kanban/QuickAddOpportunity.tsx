import { useState } from "react";
import { useCreate, useNotify, useRefresh, useGetIdentity, useGetList } from "react-admin";
import { Loader2 } from "lucide-react";
import { quickCreateOpportunitySchema } from "../../validation/opportunities";
import type { OpportunityStageValue, Organization } from "../../types";

interface QuickAddOpportunityProps {
  stage: OpportunityStageValue;
}

export function QuickAddOpportunity({ stage }: QuickAddOpportunityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();

  // Fetch customer organizations (Salesforce standard: Account required for Opportunity)
  const { data: customers, isLoading: customersLoading } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "name", order: "ASC" },
      filter: { "organization_type@in": "(prospect,customer)", deleted_at: null },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notify("Name is required", { type: "error" });
      return;
    }

    if (!customerId) {
      notify("Customer is required", { type: "error" });
      return;
    }

    try {
      // Salesforce standard: Name + Customer + Stage required
      const validatedData = quickCreateOpportunitySchema.parse({
        name: name.trim(),
        stage,
        customer_organization_id: Number(customerId),
        // Set current user as owner - ensures opportunity shows in "My Opportunities"
        opportunity_owner_id: identity?.id,
        account_manager_id: identity?.id,
      });

      await create("opportunities", { data: validatedData });
      notify("Opportunity created! Add details via the card menu.", { type: "success" });
      setIsOpen(false);
      setName("");
      setCustomerId("");
      refresh();
    } catch (error) {
      // Fail-fast: show actual validation error for debugging
      const message = error instanceof Error ? error.message : "Error creating opportunity";
      notify(message, { type: "error" });
    }
  };

  // Format stage for display
  const stageLabel = stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2 px-3 text-sm text-primary hover:bg-primary/10 rounded transition-colors border border-dashed border-border"
      >
        + New Opportunity
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-opportunity-title"
          className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
        >
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200">
            <h2 id="quick-add-opportunity-title" className="text-lg font-semibold mb-4">
              Create Opportunity
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  placeholder="Enter opportunity name"
                  disabled={isLoading}
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal has role="dialog" + aria-modal, autoFocus is appropriate
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label htmlFor="customer" className="block text-sm font-medium mb-1">
                  Customer <span className="text-destructive">*</span>
                </label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-background"
                  disabled={isLoading || customersLoading}
                >
                  <option value="">
                    {customersLoading ? "Loading customers..." : "Select a customer"}
                  </option>
                  {customers?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="stage" className="block text-sm font-medium mb-1">
                  Stage
                </label>
                <input
                  id="stage"
                  type="text"
                  value={stageLabel}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setName("");
                  }}
                  className="px-4 py-2 text-sm border border-border rounded hover:bg-accent active:bg-accent/80 transition-colors motion-safe:active:scale-[0.98]"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 active:bg-primary/80 transition-colors motion-safe:active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
