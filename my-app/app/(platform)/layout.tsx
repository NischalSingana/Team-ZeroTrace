import { Shell } from "@/components/layout/shell";

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return <Shell>{children}</Shell>;
}
