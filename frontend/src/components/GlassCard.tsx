import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  strong = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-5 ${strong ? "glass-strong" : "glass"} ${className}`}>
      {children}
    </div>
  );
}
