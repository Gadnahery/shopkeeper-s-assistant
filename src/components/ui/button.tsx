import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-primary/10 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(192_78%_44%))] text-primary-foreground shadow-[0_20px_44px_-22px_hsl(var(--primary)/0.78)] hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_28px_52px_-22px_hsl(var(--primary)/0.82)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_14px_28px_-18px_hsl(var(--destructive)/0.9)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline: "border border-input/90 bg-background/88 text-foreground shadow-[0_10px_24px_-18px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 hover:border-primary/28 hover:bg-accent/82 hover:text-accent-foreground",
        secondary: "border border-border/70 bg-secondary/92 text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/82",
        ghost: "hover:bg-accent/78 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
