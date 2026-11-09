import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold font-ui transition-all duration-200",
  {
    variants: {
      variant: {
        default: "badge-primary bg-primary/10 text-primary border border-primary/20",
        secondary: "badge-secondary bg-secondary text-secondary-foreground border border-border",
        destructive: "badge-destructive bg-destructive/10 text-destructive border border-destructive/20",
        outline: "badge-outline bg-transparent border-border text-muted-foreground",
        accent: "badge-accent bg-accent/10 text-accent border border-accent/20",
        success: "badge-success bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        warning: "badge-warning bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        sonnat: "badge-sonnat bg-sonnat-emerald/10 text-sonnat-emerald border border-sonnat-emerald/20",
        gradient: "bg-gradient-to-r from-sonnat-emerald to-sonnat-saffron text-white shadow-sonnat-glow/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }