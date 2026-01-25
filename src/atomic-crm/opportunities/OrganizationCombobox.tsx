import * as React from "react";
import { useState } from "react";
import { useDataProvider, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { AdminButton } from "@/components/admin/AdminButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { organizationKeys } from "@/atomic-crm/queryKeys";
import { PLAYBOOK_CATEGORY_IDS } from "@/atomic-crm/validation/segments";

interface InlineCreateOrganizationProps {
  name: string;
  onCreated: (record: { id: number; name: string }) => void;
  onCancel: () => void;
}

function InlineCreateOrganization({ name, onCreated, onCancel }: InlineCreateOrganizationProps) {
  const [isPending, setIsPending] = useState(false);
  const [inputName, setInputName] = useState(name);
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      notify("Organization name is required", { type: "error" });
      return;
    }
    setIsPending(true);
    try {
      const result = await dataProvider.create("organizations", {
        data: {
          name: inputName.trim(),
          organization_type: "customer",
          priority: "C",
          segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
        },
      });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      notify("Organization created", { type: "success" });
      onCreated(result.data as { id: number; name: string });
    } catch {
      notify("Failed to create organization", { type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverAnchor />
      <PopoverContent className="w-72 p-3" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Create Organization</p>
          <div className="space-y-1">
            <Label htmlFor="inline-org-name">Name</Label>
            <Input
              id="inline-org-name"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="h-11"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- Popover context, autoFocus is appropriate
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-11"
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" size="sm" disabled={isPending} className="h-11">
              Create
            </AdminButton>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export interface OrganizationComboboxProps {
  value?: number;
  onChange: (value: number | undefined, name?: string) => void;
  options: Array<{ value: string; label: string }>;
  isLoading: boolean;
  error?: string;
}

export function OrganizationCombobox({
  value,
  onChange,
  options,
  isLoading,
  error,
}: OrganizationComboboxProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showCreatePopover, setShowCreatePopover] = useState(false);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue.startsWith("__create__")) {
      const newName = selectedValue.replace("__create__", "");
      setSearchValue(newName);
      setShowCreatePopover(true);
    } else {
      const selectedOption = options.find((opt) => opt.value === selectedValue);
      onChange(selectedValue ? Number(selectedValue) : undefined, selectedOption?.label);
    }
  };

  const handleOrganizationCreated = (record: { id: number; name: string }) => {
    setShowCreatePopover(false);
    setSearchValue("");
    onChange(record.id, record.name);
  };

  const handleCreateCancel = () => {
    setShowCreatePopover(false);
    setSearchValue("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="organization_id">
        Organization
        <span className="text-destructive" aria-hidden="true">
          {" "}
          *
        </span>
      </Label>
      <Combobox
        id="organization_id"
        options={options}
        value={value?.toString()}
        onValueChange={handleValueChange}
        placeholder={isLoading ? "Loading..." : "Select or create organization..."}
        searchPlaceholder="Search organizations..."
        emptyText="No organizations found"
        className="w-full bg-background"
        disabled={isLoading}
        creatable
      />
      {error && (
        <p id="organization_id-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {showCreatePopover && (
        <InlineCreateOrganization
          name={searchValue}
          onCreated={handleOrganizationCreated}
          onCancel={handleCreateCancel}
        />
      )}
    </div>
  );
}
