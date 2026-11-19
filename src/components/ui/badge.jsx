import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold font-ui transition-all duration-200",
  {
    variants: {
      variant: {
        default: "badge-primary bg-primary/10 text-primary border border-primary/20",
        secondary: "badge-secondary bg-secondary text-secondary-foreground border border-border",
        destructive: "badge-destructive bg-destructive/10 text-destructive border border-destructive/20",
        outline: "badge-outline bg-transparent border-border text-muted-foreground",
        accent: "badge-accent bg-accent/10 text-accent border border-accent/20",
        success: "badge-success bg-quranic-emerald/10 text-quranic-emerald border border-quranic-emerald/20",
        warning: "badge-warning bg-quranic-saffron/10 text-quranic-saffron-dark border border-quranic-saffron/20",
        quranic: "badge-quranic bg-quranic-emerald/10 text-quranic-emerald border border-quranic-emerald/20",
        gradient: "bg-gradient-to-r from-quranic-emerald to-quranic-saffron text-white shadow-emerald-glow/30",
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