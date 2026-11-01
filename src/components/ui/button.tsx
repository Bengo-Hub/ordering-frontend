"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-full font-medium transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.65)] hover:bg-primary/90 hover:shadow-[0_10px_24px_-10px_hsl(var(--primary)/0.75)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "glass-field border border-primary/70 text-primary hover:border-primary hover:bg-primary/10",
        ghost: "text-primary hover:bg-primary/10",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_20px_-12px_hsl(var(--destructive)/0.7)] hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 text-base",
        sm: "h-9 px-4 text-sm after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        lg: "h-12 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
