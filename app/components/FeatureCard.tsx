import LucideIcon from "@/app/components/ui/LucideIcon";

interface FeatureCardProps {
  icon: string;
  step: string;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  step,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="relative bg-bg-surface rounded-xl border border-border p-8 text-center card-hover group">
      {/* Step number */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-primary text-bg-base text-xs font-bold">
          {step}
        </span>
      </div>

      <div className="flex justify-center mb-4 mt-2 group-hover:scale-110 transition-transform duration-300 text-primary">
        <LucideIcon name={icon} size={36} />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}
