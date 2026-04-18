import { cn } from "@/lib/utils";

interface Props {
  value: string | number;
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  tone?: "gold" | "white" | "gray";
  className?: string;
}

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
  "2xl": "text-5xl",
};

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  gold: "text-primary",
  white: "text-foreground",
  gray: "text-muted-foreground",
};

export const DataValue = ({
  value,
  unit,
  size = "md",
  tone = "gold",
  className,
}: Props) => {
  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums tracking-tight",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    >
      {value}
      {unit && (
        <span className="ml-1.5 text-[0.65em] font-normal opacity-80">{unit}</span>
      )}
    </span>
  );
};
