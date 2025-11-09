interface IconProps {
  className?: string
  size?: number
}

export function HeadIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
      <path d="M12 2v7" />
    </svg>
  )
}

export function InnerTopIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  )
}

export function OuterTopIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6L14 2L10 2L4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6z" />
      <path d="M10 2v5a1 1 0 0 1-1 1H4" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M4 14h16" />
    </svg>
  )
}

export function BottomsIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 4h16v7l-2 10h-3l-1-8-1 8H8L6 11V4z" />
      <line x1="10" y1="4" x2="10" y2="11" />
      <line x1="14" y1="4" x2="14" y2="11" />
    </svg>
  )
}

export function ShoesIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 18v-2a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
      <path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
      <line x1="10" y1="8" x2="10" y2="12" />
      <line x1="14" y1="8" x2="14" y2="12" />
    </svg>
  )
}

export function AccessoriesIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 16h3a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <path d="M8 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
      <rect x="8" y="2" width="8" height="20" rx="2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
