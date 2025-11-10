import { useState } from "react";
import { useCreate, useNotify, useRefresh } from "react-admin";
import { createOpportunitySchema } from "../validation/opportunities";
import type { OpportunityStageValue } from "../types";

interface QuickAddOpportunityProps {
  stage: OpportunityStageValue;
}

export function QuickAddOpportunity({ stage }: QuickAddOpportunityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notify("Name is required", { type: "error" });
      return;
    }

    try {
      const validatedData = createOpportunitySchema.parse({
        name: name.trim(),
        stage,
        status: "active",
      });

      await create("opportunities", { data: validatedData });
      notify("Opportunity created", { type: "success" });
      setIsOpen(false);
      setName("");
      refresh();
    } catch (error) {
      notify("Error creating opportunity", { type: "error" });
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Opportunity</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter opportunity name"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Stage</label>
                <input
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
                  className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
