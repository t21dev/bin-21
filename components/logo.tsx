export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="8" fill="#4ADE80" />
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="black"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        fontSize="16"
      >
        21
      </text>
    </svg>
  )
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo className="h-8 w-8" />
      <span className="text-lg font-bold tracking-tight">
        Bin <span className="text-primary">21</span>
      </span>
    </div>
  )
}
