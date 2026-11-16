import { cn } from "@/lib/utils"

function Skeleton({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded",
        {
          "bg-muted": variant === "default",
          "bg-gradient-to-r from-muted via-muted/50 to-muted": variant === "shimmer",
          "bg-primary/10": variant === "primary",
          "bg-accent/10": variant === "accent",
        },
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }