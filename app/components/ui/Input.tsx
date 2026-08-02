interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  error?: string;
  step?: string;
}

export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  className = "",
  id,
  name,
  required = false,
  disabled = false,
  icon,
  error,
  step,
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`text-sm font-medium ${error ? "text-error" : "text-text-secondary"}`}
        >
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? "text-error" : "text-text-muted"}`}>
            {icon}
          </span>
        )}
        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          step={step}
          className={`
            w-full bg-bg-surface border rounded-none
            px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted
            focus:outline-none transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? "border-error focus:border-error/80 focus:ring-1 focus:ring-error/40"
              : "border-border focus:border-primary focus:ring-1 focus:ring-primary/10"
            }
            ${icon ? "pl-10" : ""}
          `}
        />
      </div>
      {error && (
        <p className="text-xs text-error mt-0.5">{error}</p>
      )}
    </div>
  );
}
