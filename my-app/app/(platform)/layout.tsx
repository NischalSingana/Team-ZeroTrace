'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { useAuthStore } from "@/lib/auth-store";
import { useUIStore } from "@/lib/store/ui";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const uiHasHydrated = useUIStore((state) => state._hasHydrated);

  // Manually trigger rehydration from localStorage on first client mount
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/login");
    }
  }, [token, hasHydrated, router]);

  // Show spinner until we've read from localStorage
  if (!hasHydrated || !uiHasHydrated || !token) {
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
