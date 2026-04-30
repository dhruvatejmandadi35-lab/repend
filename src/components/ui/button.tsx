import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/95 shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] hover:shadow-[0_2px_8px_-1px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.16)] active:translate-y-px",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
        outline:
          "border border-border/80 bg-transparent text-foreground hover:border-border hover:bg-secondary/60 shadow-[0_1px_0_rgba(255,255,255,0.04)] active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        ghost: "hover:bg-secondary/70 hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero:
          "gradient-primary text-primary-foreground font-semibold shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_-8px_hsl(var(--primary)/0.55),0_2px_4px_-1px_rgba(0,0,0,0.18)] hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_32px_-8px_hsl(var(--primary)/0.65),0_3px_6px_-1px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0",
        heroOutline:
          "border border-border/80 bg-card/40 backdrop-blur-sm text-foreground hover:bg-card/80 hover:border-border font-medium shadow-[0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0",
        accent:
          "gradient-accent text-accent-foreground font-semibold shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_-8px_hsl(var(--accent)/0.55),0_2px_4px_-1px_rgba(0,0,0,0.18)] hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_32px_-8px_hsl(var(--accent)/0.65),0_3px_6px_-1px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3.5",
        lg: "h-12 rounded-lg px-7 text-[15px]",
        xl: "h-14 rounded-xl px-9 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
