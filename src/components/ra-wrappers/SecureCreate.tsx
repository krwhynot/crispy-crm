/**
 * SecureCreate - RBAC-aware wrapper for React Admin Create forms
 *
 * Wraps CreateBase with automatic permission checking and unauthorized
 * user redirection. Reduces boilerplate for securing create forms.
 *
 * @example
 * ```tsx
 * <SecureCreate>
 *   <Form>
 *     <MyFormContent />
 *   </Form>
 * </SecureCreate>
 * ```
 */
import { type ReactNode, useEffect } from "react";
import { CreateBase, useCanAccess, useNotify, useRedirect, useResourceContext } from "ra-core";
import type { CreateBaseProps } from "ra-core";
import { FormLoadingSkeleton } from "@/components/admin/form";

export interface SecureCreateProps extends Omit<CreateBaseProps, "children"> {
  /** Form content to render when access is granted */
  children: ReactNode;
  /** Custom loading component (defaults to FormLoadingSkeleton) */
  loadingComponent?: ReactNode;
  /** Custom redirect path on access denied (defaults to /{resource}) */
  redirectPath?: string;
  /** Custom denied message (defaults to generic message) */
  deniedMessage?: string;
  /** Number of skeleton rows for loading state (default: 4) */
  skeletonRows?: number;
}

export const SecureCreate = ({
  children,
  loadingComponent,
  redirectPath,
  deniedMessage,
  skeletonRows = 4,
  ...createBaseProps
}: SecureCreateProps) => {
  const notify = useNotify();
  const redirectFn = useRedirect();
  const resource = useResourceContext() ?? createBaseProps.resource ?? "";

  const { canAccess, isPending: isCheckingAccess } = useCanAccess({
    resource,
    action: "create",
  });

  useEffect(() => {
    if (!isCheckingAccess && !canAccess) {
      const message =
        deniedMessage ?? `You don't have permission to create ${resource.replace(/_/g, " ")}.`;
      notify(message, { type: "warning" });
      redirectFn(redirectPath ?? `/${resource}`);
    }
  }, [isCheckingAccess, canAccess, notify, redirectFn, resource, redirectPath, deniedMessage]);

  if (isCheckingAccess) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          {loadingComponent ?? <FormLoadingSkeleton rows={skeletonRows} />}
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <CreateBase {...createBaseProps}>{children}</CreateBase>;
};
