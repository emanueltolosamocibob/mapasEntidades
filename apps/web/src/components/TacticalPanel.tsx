import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function CornerBracket({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute h-3 w-3 border-primary", className)}
    />
  );
}

function TacticalPanel({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("relative border border-border bg-card/60 p-5", className)}>
      <CornerBracket className="-top-px -left-px border-t-2 border-l-2" />
      <CornerBracket className="-top-px -right-px border-t-2 border-r-2" />
      <CornerBracket className="-bottom-px -left-px border-b-2 border-l-2" />
      <CornerBracket className="-bottom-px -right-px border-b-2 border-r-2" />

      {title && (
        <div className="mb-4 flex items-center gap-2 text-xs tracking-[0.2em] text-primary uppercase">
          <span className="h-1.5 w-1.5 bg-primary" />
          {title}
        </div>
      )}

      {children}
    </div>
  );
}

export default TacticalPanel;
