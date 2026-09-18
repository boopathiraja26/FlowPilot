import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  isLoading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.98] border border-blue-600 disabled:bg-blue-400 disabled:border-blue-400 disabled:shadow-none",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]",
  outline:
    "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100/70 hover:border-slate-400 hover:text-slate-900 active:scale-[0.98]",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]",
  danger:
    "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-sm active:scale-[0.98] disabled:bg-rose-50/50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 ease-in-out disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
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
