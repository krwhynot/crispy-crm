import * as React from "react";
import type { ReactNode } from "react";
import { Children } from "react";
import { Form, type FormProps } from "ra-core";
import { cn } from "@/lib/utils";
import { CancelButton } from "@/components/ra-wrappers/cancel-button";
import { SaveButton } from "@/components/ra-wrappers/form";
import type { FieldValues, SubmitHandler } from "react-hook-form";

/**
 * Props for SimpleForm with generic type support for form data.
 * This allows proper typing of onSubmit handlers without requiring `as any` casts.
 */
export interface SimpleFormProps<TFormData extends FieldValues = FieldValues> extends Omit<
  FormProps,
  "onSubmit"
> {
  children: ReactNode;
  className?: string;
  toolbar?: ReactNode;
  onSubmit?: SubmitHandler<TFormData>;
}

export const SimpleForm = <TFormData extends FieldValues = FieldValues>({
  children,
  className,
  toolbar = defaultFormToolbar,
  ...rest
}: SimpleFormProps<TFormData>) => (
  <Form className={cn(`flex flex-col gap-4 w-full max-w-lg`, className)} {...rest}>
    {children}
    {toolbar}
  </Form>
);

export const FormToolbar = ({ children, className, ...rest }: FormToolbarProps) => (
  <div
    {...rest}
    className={cn(
      "sticky mt-6 mb-4 pt-4 pb-4 px-6 md:block md:pt-2 md:pb-0 bottom-0 bg-card",
      className
    )}
    role="toolbar"
  >
    {Children.count(children) === 0 ? (
      <div className="flex flex-row gap-2 justify-end">
        <CancelButton />
        <SaveButton />
      </div>
    ) : (
      children
    )}
  </div>
);

export interface FormToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

const defaultFormToolbar = <FormToolbar />;
