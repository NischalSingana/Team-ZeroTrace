import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "destructive" | "subtle";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1d4ed8] hover:bg-[#2563eb] text-white border border-[#3b82f6]/40 hover:border-[#3b82f6]/60",
  ghost:
    "bg-transparent hover:bg-[#0d1117] text-[#94a3b8] hover:text-[#e2e8f0] border border-transparent hover:border-[#1e2d3d]",
  outline:
    "bg-transparent hover:bg-[#0d1117] text-[#94a3b8] hover:text-[#e2e8f0] border border-[#243044] hover:border-[#374151]",
  destructive:
    "bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/30 hover:border-[#ef4444]/50",
  subtle:
    "bg-[#0d1117] hover:bg-[#1c2433] text-[#64748b] hover:text-[#94a3b8] border border-[#1e2d3d] hover:border-[#243044]",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-[10px] gap-1",
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-8 px-3 text-sm gap-2",
  lg: "h-9 px-4 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "outline",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded font-medium transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3b82f6] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
