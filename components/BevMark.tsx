/** Bev's mark: an hourglass on an ink tile. Original artwork, not TypeSafe's. */
export function BevMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="#2b251d" />
      <path d="M9.5 7.5h13M9.5 24.5h13" stroke="#fbf7ec" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M11.5 8.5c0 4.5 4.5 5.5 4.5 7.5s-4.5 3-4.5 7.5h9c0-4.5-4.5-5.5-4.5-7.5s4.5-3 4.5-7.5z"
        fill="none"
        stroke="#fbf7ec"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13.6 10.8h4.8c-.5 1.6-1.6 2.5-2.4 3-.8-.5-1.9-1.4-2.4-3z" fill="#f5c26b" />
      <path d="M16 15.6v4" stroke="#f5c26b" strokeWidth="1" strokeLinecap="round" />
      <path d="M12.9 23.3c.3-1.8 1.7-2.8 3.1-3.4 1.4.6 2.8 1.6 3.1 3.4z" fill="#f5c26b" />
    </svg>
  );
}
