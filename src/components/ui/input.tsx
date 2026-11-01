import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "glass-field flex h-11 w-full rounded-2xl border border-border px-4 text-base text-foreground transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground hover:border-input focus-visible:border-brand-emphasis focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
});

type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "glass-field flex min-h-[9rem] w-full rounded-2xl border border-border px-4 py-3 text-base text-foreground transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground hover:border-input focus-visible:border-brand-emphasis focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
});
