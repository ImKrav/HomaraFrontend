import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "white";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  id?: string;
}

const variants = {
  primary:
    "bg-primary text-bg-base hover:bg-primary-light font-medium border border-primary transition-all duration-200 shadow-sm",
  secondary:
    "bg-bg-surface-light text-text-primary hover:bg-bg-surface-hover border border-transparent font-medium",
  outline:
    "border border-border text-text-primary hover:bg-bg-surface-light hover:border-primary font-medium",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-surface-light font-medium",
  danger:
    "bg-error/10 text-error hover:bg-error/20 border border-error/25 font-medium",
  white:
    "bg-bg-surface text-text-primary hover:bg-bg-surface-light border border-transparent font-medium transition-all duration-200 shadow-sm",
};

const sizes = {
  sm: "px-4 py-2 text-sm rounded-none gap-1.5",
  md: "px-6 py-3 text-sm rounded-none gap-2",
  lg: "px-8 py-4 text-base rounded-none gap-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  fullWidth = false,
  id,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg-base";
  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";
  const widthClass = fullWidth ? "w-full" : "";

  const allClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${widthClass} ${className}`;

  if (href) {
    return (
      <Link href={href} id={id} className={allClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={allClasses}
    >
      {children}
    </button>
  );
}
