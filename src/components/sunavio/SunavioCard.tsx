import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface SunavioCardProps extends HTMLAttributes<HTMLDivElement> {
  withGoldCorners?: boolean;
}

export const SunavioCard = forwardRef<HTMLDivElement, SunavioCardProps>(
  ({ className, withGoldCorners = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative bg-card border border-border p-8 md:p-10 transition-all duration-300",
        "hover:border-gold/40",
        withGoldCorners && "gold-corners",
        className,
      )}
      {...props}
    >
      {withGoldCorners && (
        <>
          <span className="gc-bl" />
          <span className="gc-br" />
        </>
      )}
      {children}
    </div>
  ),
);
SunavioCard.displayName = "SunavioCard";
