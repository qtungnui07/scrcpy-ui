import React from "react";
import { cn } from "../../lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <div
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "flex items-center justify-between gap-3 select-none cursor-pointer py-1.5 px-1 rounded-lg transition-colors hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {(label || description) && (
        <div className="flex-1">
          {label && <div className="text-sm font-medium text-foreground">{label}</div>}
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      )}
      <div
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </div>
    </div>
  );
};
