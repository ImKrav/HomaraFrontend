import LucideIcon from "@/app/components/ui/LucideIcon";
import Button from "@/app/components/ui/Button";

interface AuthRequiredStateProps {
  icon: string;
  title: string;
  description: string;
  loginButtonLabel: string;
  registerButtonLabel: string;
}

export default function AuthRequiredState({
  icon,
  title,
  description,
  loginButtonLabel,
  registerButtonLabel,
}: AuthRequiredStateProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-text-muted mb-4 flex justify-center">
        <LucideIcon name={icon} size={64} />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-text-secondary max-w-md mx-auto mb-8 text-sm">
        {description}
      </p>
      <div className="flex justify-center gap-4">
        <Button href="/login" size="md" className="rounded-none">
          {loginButtonLabel}
        </Button>
        <Button href="/register" variant="outline" size="md" className="rounded-none">
          {registerButtonLabel}
        </Button>
      </div>
    </div>
  );
}
