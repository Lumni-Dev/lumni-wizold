import { cn } from "@/shared/utils/class-names";
type SpinnerSize = "small" | "medium";
const SIZES: Record<SpinnerSize, string> = {
  small: "size-3.5 border-[1.5px]",
  medium: "size-5 border-2",
};
export function Spinner({ size = "small", className }: { size?: SpinnerSize; className?: string }) {
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
