"use client";

import { Toaster as Sonner } from "sonner";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0d1117] group-[.toaster]:text-[#e2e8f0] group-[.toaster]:border-[#1e2d3d] group-[.toaster]:shadow-lg font-mono text-[11px]",
          description: "group-[.toast]:text-[#94a3b8]",
          actionButton:
            "group-[.toast]:bg-[#3b82f6] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#1e2d3d] group-[.toast]:text-[#94a3b8]",
          icon: "group-data-[type=error]:text-[#ef4444] group-data-[type=success]:text-[#22c55e] group-data-[type=warning]:text-[#eab308] group-data-[type=info]:text-[#3b82f6]",
        },
      }}
      icons={{
        success: <CheckCircle2 className="w-4 h-4" />,
        info: <Info className="w-4 h-4" />,
        warning: <AlertTriangle className="w-4 h-4" />,
        error: <XCircle className="w-4 h-4" />,
      }}
    />
  );
}
