export function ThattikkoWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-xl leading-none tracking-tight text-primary ${className}`}
      aria-label="thattikko.fun"
    >
      തട്ടിക്കോ<span className="text-primary/90">.fun</span>
    </span>
  );
}
