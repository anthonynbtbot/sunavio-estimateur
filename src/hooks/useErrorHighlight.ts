import { useEstimationStore } from "@/stores/estimationStore";
import { cn } from "@/lib/utils";

/**
 * Returns props to spread on a focusable input/textarea/button to highlight
 * it when validation routes the user back to its step.
 *
 * Usage:
 *   <input id="contact-phone" {...useErrorHighlight("contact-phone")} />
 */
export function useErrorHighlight(fieldId: string) {
  const errorFieldId = useEstimationStore((s) => s.errorFieldId);
  const setErrorFieldId = useEstimationStore((s) => s.setErrorFieldId);
  const isError = errorFieldId === fieldId;

  return {
    "data-error": isError || undefined,
    className: cn(
      "transition-all",
      isError &&
        "border-2 border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.25)] animate-pulse",
    ),
    onFocus: () => {
      if (isError) setErrorFieldId(null);
    },
  };
}
