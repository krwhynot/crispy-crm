import type * as React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * SectionCard - Tier 2 wrapper for Card primitives
 *
 * Provides a standardized layout for form sections, settings panels,
 * and content blocks. Encapsulates the Card + CardHeader + CardContent
 * pattern used across 78+ feature files.
 *
 * @example Basic usage (title only)
 * ```tsx
 * <SectionCard title="Contact Details">
 *   <ContactInputs />
 * </SectionCard>
 * ```
 *
 * @example With description
 * ```tsx
 * <SectionCard title="Security" description="Manage your password and 2FA">
 *   <SecuritySettings />
 * </SectionCard>
 * ```
 *
 * @example With icon and header action
 * ```tsx
 * <SectionCard
 *   title="Notifications"
 *   icon={<BellIcon className="h-5 w-5" />}
 *   headerAction={<Button variant="outline" size="sm">Edit</Button>}
 * >
 *   <NotificationList />
 * </SectionCard>
 * ```
 *
 * @example Alert variant
 * ```tsx
 * <SectionCard variant="alert" title="Warning">
 *   <p>This action cannot be undone.</p>
 * </SectionCard>
 * ```
 */
export interface SectionCardProps {
  /** Card title displayed in header */
  title?: React.ReactNode;
  /** Subtitle/description below title */
  description?: React.ReactNode;
  /** Icon displayed before title */
  icon?: React.ReactNode;
  /** Action element (button, badge) aligned to right of header */
  headerAction?: React.ReactNode;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Additional classes for Card container */
  className?: string;
  /** Additional classes for CardContent */
  contentClassName?: string;
  /** Visual variant - "alert" adds destructive border/background */
  variant?: "default" | "alert";
}

export function SectionCard({
  title,
  description,
  icon,
  headerAction,
  footer,
  children,
  className,
  contentClassName,
  variant = "default",
}: SectionCardProps) {
  const hasHeader = title || description || icon || headerAction;

  return (
    <Card
      data-slot="section-card"
      className={cn(variant === "alert" && "border-destructive bg-destructive/10", className)}
    >
      {hasHeader && (
        <CardHeader>
          {icon && (
            <div className="flex items-center gap-2">
              {icon}
              <div>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
            </div>
          )}
          {!icon && title && <CardTitle>{title}</CardTitle>}
          {!icon && description && <CardDescription>{description}</CardDescription>}
          {headerAction && <CardAction>{headerAction}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
