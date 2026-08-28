import { cn } from "@/lib/utils/cn";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-[#243044] bg-[#0d1117] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#64748b]",
        className
      )}
    >
      {children}
    </kbd>
  );
}
