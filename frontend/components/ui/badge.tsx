import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", {
  variants: {
    variant: {
      neutral: "bg-secondary text-secondary-foreground",
      success: "bg-success/15 text-success",
      destructive: "bg-destructive/15 text-destructive",
      warning: "bg-warning/15 text-warning",
      outline: "border border-border text-foreground",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
