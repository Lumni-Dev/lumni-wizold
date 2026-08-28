import { cn } from "@/shared/utils/class-names";

// The theme's circle loader: a thin ring in the current text colour with a
// gap that spins. border-current is what makes it match anywhere it lands,
// dark over an ember button, ink over a surface one, with no colour prop.

type SpinnerSize = "small" | "medium";

const SIZES: Record<SpinnerSize, string> = {
  small: "size-3.5 border-[1.5px]",
  medium: "size-5 border-2",
};

export function Spinner({
  size = "small",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent",
        SIZES[size],
        className,
      )}
    />
  );
}
