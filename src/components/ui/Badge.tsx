import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  pulsing?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  pulsing = false,
  children,
  className,
}) => {
  const styles = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    error: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    neutral: "bg-muted text-muted-foreground border-border/50",
  };

  const dotColors = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    error: "bg-rose-400",
    info: "bg-sky-400",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm",
        styles[variant],
        className
      )}
    >
      {pulsing && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant]
            )}
          />
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])}
          />
        </span>
      )}
      {children}
    </span>
  );
};
