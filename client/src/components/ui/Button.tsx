import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  isLoading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-brand-glow active:scale-[0.98] disabled:bg-brand-300 disabled:shadow-none",
  secondary: "bg-white text-slate-700 border border-slate-200/80 shadow-subtle hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 active:scale-[0.98]",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-[0.98] disabled:bg-rose-300",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 ease-in-out disabled:cursor-not-allowed disabled:transform-none ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

