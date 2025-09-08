import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef(
  (
    { className, value, showDot = false, brandColors = false, ...props },
    ref
  ) => (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-out relative",
            brandColors
              ? "bg-gradient-to-r from-wa-brand/25 to-wa-brand/50"
              : "bg-primary"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showDot && value > 0 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-wa-brand rounded-full shadow-lg -translate-x-1 border transition-all duration-300 ease-out"
          style={{ left: `${value}%` }}
        >
          <div className="absolute inset-0 bg-wa-brand rounded-full blur-sm animate-glow-smooth" />
          <div
            className="absolute inset-0 bg-wa-brand rounded-full blur-md animate-glow-smooth"
            style={{ animationDelay: "0.3s" }}
          />
          {/* Progress percentage toast */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark text-wa-text-primary-light dark:text-wa-text-primary-dark text-xs font-medium px-2 py-1 rounded-lg shadow-lg border border-gray-400 dark:border-wa-border-dark whitespace-nowrap">
            {value.toFixed(2)}%{/* Corner notch at bottom center */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark border-r border-b border-gray-400 dark:border-wa-border-dark transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
