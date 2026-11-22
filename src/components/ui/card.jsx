import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded border border-border bg-card/95 backdrop-blur-sm shadow-sm transition-all duration-300",
      {
        "hover:shadow-md": variant === "default",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 cursor-pointer": variant === "interactive",
        "shadow-lg": variant === "elevated",
        "bg-card/80 backdrop-blur-xl border-border/50 shadow-xl": variant === "glass",
        "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-tr before:from-primary/5 before:via-transparent before:to-accent/5 before:opacity-0 before:transition-opacity hover:before:opacity-100": variant === "quranic",
      },
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 sm:p-8", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "h3" : "h3"
  return (
    <Comp
      ref={ref}
      className={cn("font-heading font-bold tracking-tight text-foreground", className)}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("font-body text-muted-foreground text-sm sm:text-base leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 sm:p-8 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 p-6 sm:p-8 pt-0 border-t border-border/50", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }