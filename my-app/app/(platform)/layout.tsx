'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { useAuthStore } from "@/lib/auth-store";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050709]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#64748b] text-sm font-mono">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <Shell>{children}</Shell>;
}
