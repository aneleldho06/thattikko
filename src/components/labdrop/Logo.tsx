export function LabDropMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1.5" y="4" width="9" height="16" rx="2" />
      <path d="M5 17.2h2" />
      <rect x="17.5" y="7" width="13" height="9.5" rx="1.6" />
      <path d="M21 23h6M24 16.5V23" />
      <path d="M12.5 12h3.8m0 0-1.6-1.8m1.6 1.8-1.6 1.8" />
    </svg>
  );
}

export function LabDropWordmark({ subtle = false }: { subtle?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LabDropMark className={subtle ? "h-6 w-6 text-primary" : "h-7 w-7 text-primary"} />
      <span className="text-lg font-semibold tracking-tight text-foreground">LabDrop</span>
    </span>
  );
}
