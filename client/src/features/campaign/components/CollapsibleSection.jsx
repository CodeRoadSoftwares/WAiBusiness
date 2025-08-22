import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  className = "",
  icon: Icon = null,
  nonCollapsible = false,
}) => {
  const [isOpen, setIsOpen] = useState(nonCollapsible ? true : defaultOpen);

  const toggleSection = () => {
    if (!nonCollapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-300",
        isOpen
          ? "border-wa-brand/40 bg-white dark:bg-wa-bg-panel-dark shadow-md"
          : "border-wa-border-light dark:border-wa-border-dark bg-white/80 dark:bg-wa-bg-panel-dark/80 hover:border-wa-brand/30 hover:shadow-sm",
        nonCollapsible &&
          "border-wa-brand/40 bg-white dark:bg-wa-bg-panel-dark shadow-md",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={toggleSection}
        className={cn(
          "w-full px-6 py-5 flex items-center justify-between transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-wa-brand/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-wa-bg-panel-dark",
          isOpen
            ? "bg-wa-brand/5 dark:bg-wa-brand/10"
            : "bg-wa-bg-panel-light dark:bg-wa-bg-panel-dark hover:bg-wa-brand/5",
          nonCollapsible && "bg-wa-brand/5 dark:bg-wa-brand/10 cursor-default"
        )}
        aria-expanded={isOpen}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        disabled={nonCollapsible}
      >
        <div className="flex items-center space-x-4">
          {Icon && (
            <div
              className={cn(
                "flex-shrink-0 p-2 rounded-lg transition-all duration-300",
                isOpen
                  ? "bg-wa-brand/20 dark:bg-wa-brand/30"
                  : "bg-wa-brand/10 dark:bg-wa-brand/20 group-hover:bg-wa-brand/20 dark:group-hover:bg-wa-brand/30"
              )}
            >
              <Icon className="w-5 h-5 text-wa-brand" />
            </div>
          )}
          <h3
            className={cn(
              "text-lg font-semibold transition-colors duration-300",
              isOpen
                ? "text-wa-brand"
                : "text-wa-text-primary-light dark:text-wa-text-primary-dark group-hover:text-wa-brand"
            )}
          >
            {title}
          </h3>
        </div>

        {/* Chevron Icon - only show if collapsible */}
        {!nonCollapsible && (
          <div
            className={cn(
              "flex-shrink-0 p-2 rounded-full transition-all duration-300",
              isOpen
                ? "bg-wa-brand/20 dark:bg-wa-brand/30"
                : "bg-white/50 dark:bg-wa-bg-panel-dark/50 group-hover:bg-wa-brand/10"
            )}
          >
            <div className="transition-all duration-300 ease-out">
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-wa-brand" />
              ) : (
                <ChevronDown className="w-5 h-5 text-wa-icon-light dark:text-wa-icon-dark group-hover:text-wa-brand transition-colors duration-300" />
              )}
            </div>
          </div>
        )}
      </button>

      {/* Content with enhanced styling */}
      <div
        id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 py-6 bg-white dark:bg-wa-bg-panel-dark border-t border-wa-border-light/30 dark:border-wa-border-dark/30">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
