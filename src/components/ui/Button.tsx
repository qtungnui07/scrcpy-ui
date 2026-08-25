import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border border-primary/30",
      secondary:
        "bg-secondary hover:bg-secondary/80 text-foreground border border-border/50",
      destructive:
        "bg-destructive/90 hover:bg-destructive text-white shadow-lg shadow-destructive/20 border border-destructive/40",
      outline:
        "border border-border/80 bg-transparent hover:bg-muted text-foreground",
      ghost:
        "bg-transparent hover:bg-muted text-foreground",
      glass:
        "bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-md",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9 px-4 text-sm rounded-xl gap-2",
      lg: "h-11 px-6 text-base rounded-xl gap-2.5",
      icon: "h-9 w-9 rounded-xl p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
