import React from "react";

interface FlowPilotWordmarkProps {
  className?: string;
  theme?: "dark" | "light"; // "dark" = dark text for light backgrounds, "light" = light text for dark backgrounds
  size?: "sm" | "md" | "lg" | "xl";
}

export function FlowPilotWordmark({
  className = "",
  theme = "dark",
  size = "md",
}: FlowPilotWordmarkProps) {
  const isLight = theme === "light";

  const sizeClasses = {
    sm: "text-base tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl sm:text-3xl tracking-tight",
    xl: "text-3xl sm:text-4xl tracking-tight",
  }[size];

  return (
    <div
      className={`inline-flex items-center select-none font-bold font-sans ${sizeClasses} ${className}`}
      aria-label="FlowPilot"
    >
      <span className={isLight ? "text-white" : "text-ui-primary"}>
        Flow
      </span>
      <span className="ml-0.5 font-extrabold text-ui-accent">
        Pilot
      </span>
      <span className="mb-1 ml-1 inline-block h-1.5 w-1.5 rounded-full bg-ui-accent" />
    </div>
  );
}
