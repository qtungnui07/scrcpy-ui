import React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  options?: Array<{ value: number; label: string }>;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  options,
  className,
}) => {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        {label && <span className="font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>}
        <span className="font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
          {options ? (options.find((o) => o.value === value)?.label || `${value}${unit}`) : `${value}${unit}`}
        </span>
      </div>

      {options ? (
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all text-center",
                value === opt.value
                  ? "bg-primary text-white shadow-md shadow-primary/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
