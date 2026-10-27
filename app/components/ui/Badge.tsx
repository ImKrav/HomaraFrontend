interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-bg-surface-light text-text-secondary border border-border",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-200/50 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25",
  warning: "bg-amber-50 text-amber-800 border border-amber-200/50 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/25",
  error: "bg-rose-50 text-rose-800 border border-rose-200/50 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/25",
  info: "bg-sky-50 text-sky-800 border border-sky-200/50 dark:bg-sky-400/15 dark:text-sky-300 dark:border-sky-400/25",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: Readonly<BadgeProps>) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-none uppercase tracking-wider text-[11px]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
