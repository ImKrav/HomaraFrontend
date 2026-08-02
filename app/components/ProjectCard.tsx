import Link from "next/link";
import Badge from "@/app/components/ui/Badge";
import LucideIcon from "@/app/components/ui/LucideIcon";
import {
  type Project,
  formatPrice,
} from "@/app/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLanguage();
  const statusLower = project.status?.toLowerCase();
  const statusVariant =
    statusLower === "completado"
      ? "success"
      : statusLower === "en_progreso"
      ? "warning"
      : statusLower === "pausado"
      ? "info"
      : "default";

  return (
    <Link href={`/proyectos/${project.id}`} className="group block">
      <div className="bg-bg-surface rounded-none border border-border p-6 card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl text-primary/80 group-hover:scale-110 transition-transform duration-300 flex items-center">
            <LucideIcon name={project.thumbnail} size={32} />
          </div>
          <Badge variant={statusVariant} size="sm">
            {t(`status.${statusLower}`)}
          </Badge>
        </div>

        <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
          {project.name}
        </h3>

        <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <LucideIcon name="Maximize2" size={14} className="text-primary/70" /> {project.area} m²
          </span>
          <span className="flex items-center gap-1.5">
            <LucideIcon name="Package" size={14} className="text-primary/70" /> {project.materialCount} {t("projects.materials")}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">{t("projects.cost")}</p>
            <p className="text-sm font-bold text-text-primary">
              {formatPrice(project.estimatedCost)}
            </p>
          </div>
          <span className="text-xs text-text-muted">
            {new Date(project.createdAt).toLocaleDateString(t("locale"), {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
