import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold font-ui transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "btn-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary-glow hover:shadow-md",
        destructive:
          "btn-destructive bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
        outline:
          "btn-outline border-2 border-primary text-primary hover:bg-primary/5",
        secondary:
          "btn-secondary bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        ghost:
          "btn-ghost bg-transparent hover:bg-muted text-foreground",
        accent:
          "btn-accent bg-accent text-accent-foreground shadow-sm hover:bg-accent-glow hover:shadow-md",
        link:
          "text-primary underline-offset-4 hover:underline font-medium",
        sonnat:
          "bg-gradient-to-r from-sonnat-emerald to-sonnat-saffron text-white shadow-sonnat-glow hover:from-sonnat-emerald-light hover:to-sonnat-saffron-light hover:shadow-lg",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm",
        sm: "h-9 px-3.5 py-1.5 text-xs",
        lg: "h-12 px-7 py-3 text-base",
        xl: "h-14 px-9 py-3.5 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }