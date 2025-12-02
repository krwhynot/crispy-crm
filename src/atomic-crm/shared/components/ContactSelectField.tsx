import { useGetList } from "react-admin";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contact } from "@/atomic-crm/types";

export interface ContactSelectFieldProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  organizationId: number | string | null | undefined;
  name?: Path<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function ContactSelectField<T extends FieldValues = FieldValues>({
  control,
  organizationId,
  name = "contact_id" as Path<T>,
  label = "Contact",
  placeholder = "Select contact...",
  required = false,
}: ContactSelectFieldProps<T>) {
  const { data: contacts, isPending } = useGetList<Contact>("contacts_summary", {
    filter: { organization_id: organizationId },
    pagination: { page: 1, perPage: 100 },
  });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Select
              value={field.value?.toString() || "none"}
              onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
              disabled={isPending || !organizationId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isPending
                      ? "Loading..."
                      : !organizationId
                        ? "Select organization first"
                        : placeholder
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id.toString()}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
