import * as React from "react";
import { memo } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { shallowEqual, useListSortContext, useTranslate, useTranslateLabel } from "ra-core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ButtonProps = React.ComponentProps<typeof Button>;

function useSafeListSortContext() {
  try {
    return useListSortContext();
  } catch {
    return null;
  }
}

const SortButtonComponent = (props: SortButtonProps) => {
  const {
    fields,
    label = "ra.sort.sort_by",
    icon = defaultIcon,
    resource: resourceProp,
    dataTutorial,
    iconOnly = false,
    ...rest
  } = props;
  const sortContext = useSafeListSortContext();
  const translate = useTranslate();
  const translateLabel = useTranslateLabel();
  const [open, setOpen] = React.useState(false);

  if (!sortContext) return null;
  const { resource: resourceFromContext, sort, setSort } = sortContext;
  const resource = resourceProp || resourceFromContext;

  const handleChangeSort = (field: string) => {
    setSort({
      field,
      order: field === sort.field ? inverseOrder(sort.order) : "ASC",
    });
    setOpen(false);
  };

  const fieldLabel = translateLabel({
    resource,
    source: sort.field,
  });
  const buttonLabel = translate(label, {
    field: fieldLabel,
    field_lower_first:
      typeof fieldLabel === "string"
        ? fieldLabel.charAt(0).toLowerCase() + fieldLabel.slice(1)
        : undefined,
    order: translate(`ra.sort.${sort.order}`),
    _: label,
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {iconOnly ? (
        <TooltipProvider>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={buttonLabel}
                  data-tutorial={dataTutorial}
                  {...rest}
                >
                  {icon}
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent>
              <p>{buttonLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" data-tutorial={dataTutorial} {...rest}>
            {icon}
            <span className="ml-2">{buttonLabel}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="start">
        {fields.map((field) => (
          <DropdownMenuItem key={field} onClick={() => handleChangeSort(field)}>
            {translateLabel({
              resource,
              source: field,
            })}{" "}
            {translate(`ra.sort.${sort.field === field ? inverseOrder(sort.order) : "ASC"}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const defaultIcon = <ArrowUpDown className="h-4 w-4" />;

const inverseOrder = (sort: string) => (sort === "ASC" ? "DESC" : "ASC");

const arePropsEqual = (prevProps: SortButtonProps, nextProps: SortButtonProps) =>
  shallowEqual(prevProps.fields, nextProps.fields) &&
  prevProps.iconOnly === nextProps.iconOnly &&
  prevProps.resource === nextProps.resource;

export interface SortButtonProps extends ButtonProps {
  fields: string[];
  icon?: React.ReactNode;
  label?: string;
  resource?: string;
  dataTutorial?: string;
  iconOnly?: boolean;
}

export const SortButton = memo(SortButtonComponent, arePropsEqual);
