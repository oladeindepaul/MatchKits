// Thin line icons that match the Alpine reference's light strokes.
type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const MenuIcon = ({ className = "size-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M3 7h18M3 12h12M3 17h16" />
  </svg>
);

export const CloseIcon = ({ className = "size-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SearchIcon = ({ className = "size-[18px]" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const HeartIcon = ({ className = "size-[18px]", filled = false }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);

export const UserIcon = ({ className = "size-[18px]" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const BagIcon = ({ className = "size-[18px]" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 8h14l-1 13H6L5 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const ArrowRight = ({ className = "w-10" }: IconProps) => (
  <svg viewBox="0 0 40 10" className={className} {...base}>
    <path d="M0 5h38M34 1l4 4-4 4" />
  </svg>
);

export const ArrowLeft = ({ className = "w-10" }: IconProps) => (
  <svg viewBox="0 0 40 10" className={className} {...base}>
    <path d="M40 5H2M6 1L2 5l4 4" />
  </svg>
);

export const ChevronDown = ({ className = "size-3" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
