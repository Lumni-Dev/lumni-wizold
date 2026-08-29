import { cn } from "@/shared/utils/class-names";
type SpinnerSize = "small" | "medium";
type SpinnerTone = "ember" | "dark";
const SIZES: Record<SpinnerSize, string> = {
  small: "size-3.5 border-[1.5px]",
  medium: "size-5 border-2",
};
const TONES: Record<SpinnerTone, string> = {
  ember: "border-ember",
  dark: "border-base",
};
export function Spinner({
  size = "small",
  tone = "ember",
  className,
}: {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-t-transparent",
        TONES[tone],
        SIZES[size],
        className,
      )}
    />
  );
}
