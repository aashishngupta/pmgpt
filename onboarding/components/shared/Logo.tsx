export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 72" width={size} height={size * 0.9}>
      <defs>
        <linearGradient id="g-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="g-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="g-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      <rect x="16" y="32" width="64" height="36" rx="9" fill="url(#g-teal)" opacity="0.9" />
      <rect x="8" y="18" width="64" height="36" rx="9" fill="url(#g-purple)" opacity="0.9" />
      <rect x="0" y="4" width="64" height="36" rx="9" fill="url(#g-blue)" />
      <circle cx="12" cy="15" r="7" fill="white" opacity="0.95" />
    </svg>
  );
}
