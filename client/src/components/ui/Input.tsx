import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, icon, rightElement, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
              icon ? "pl-10" : ""
            } ${rightElement ? "pr-10" : ""} ${
              error
                ? "border-rose-300 ring-4 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-slate-200/90 hover:border-slate-300"
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="animate-fade-in text-xs font-medium text-rose-500 flex items-center gap-1 mt-0.5">
            <span>•</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


