import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "ghost";
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  image?: string;
  variant?: "default" | "fullscreen" | "card";
  action?: {
    label: string;
    onClick: () => void;
  };
  actions?: EmptyStateAction[];
  children?: React.ReactNode;
  className?: string;
  "data-tutorial"?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  image,
  variant = "default",
  action,
  actions,
  children,
  className,
  "data-tutorial": dataTutorial,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (image) {
      return <img src={image} alt={title} className="mb-4" />;
    }
    if (Icon) {
      return (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
      );
    }
    return null;
  };

  const renderActions = () => {
    const allActions: EmptyStateAction[] = [];

    if (action) {
      allActions.push({ label: action.label, onClick: action.onClick });
    }

    if (actions) {
      allActions.push(...actions);
    }

    if (allActions.length === 0) return null;

    return (
      <div className="mt-6 flex flex-row gap-2">
        {allActions.map((actionItem, index) => {
          const buttonProps = {
            variant: actionItem.variant ?? "default",
            className: "h-11",
            onClick: actionItem.onClick,
          } as const;

          if (actionItem.href) {
            return (
              <Button key={index} asChild {...buttonProps}>
                <a href={actionItem.href}>{actionItem.label}</a>
              </Button>
            );
          }

          return (
            <Button key={index} {...buttonProps}>
              {actionItem.label}
            </Button>
          );
        })}
      </div>
    );
  };

  const content = (
    <>
      {renderIcon()}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {renderActions()}
      {children}
    </>
  );

  if (variant === "card") {
    return (
      <Card className={cn("mx-auto mt-16 max-w-md", className)} data-tutorial={dataTutorial}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div
        className={cn(
          "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 text-center",
          className
        )}
        data-tutorial={dataTutorial}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
      data-tutorial={dataTutorial}
    >
      {content}
    </div>
  );
}
