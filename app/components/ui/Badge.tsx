interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-zinc-100 text-zinc-700 border border-zinc-200/50",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  warning: "bg-amber-50 text-amber-700 border border-amber-200/50",
  error: "bg-rose-50 text-rose-700 border border-rose-200/50",
  info: "bg-sky-50 text-sky-700 border border-sky-200/50",
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
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-none uppercase tracking-wider text-[10px]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
