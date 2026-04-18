import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) => (
  <div
    className={cn(
      "max-w-2xl",
      align === "center" ? "mx-auto text-center" : "text-left",
      className,
    )}
  >
    {eyebrow && (
      <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">
        {eyebrow}
      </p>
    )}
    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.1]">
      {title}
    </h2>
    <span
      className={cn(
        "gold-rule mt-6",
        align === "center" && "mx-auto",
      )}
    />
    {subtitle && (
      <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);
