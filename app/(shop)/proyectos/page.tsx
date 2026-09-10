"use client";

import { useState, useEffect } from "react";
import ProjectCard from "@/app/components/ProjectCard";
import Button from "@/app/components/ui/Button";
import AuthRequiredState from "@/app/components/AuthRequiredState";
import Link from "next/link";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { Project } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ProyectosPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const json = await api.get("/api/v1/projects");
        if (json.success && json.data) {
          setProjects(json.data);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (authLoading || (loading && isAuthenticated)) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-text-secondary">{t("projects.loading_projects")}</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredState
        icon="Maximize2"
        title={t("projects.login_required")}
        description={t("projects.login_required_desc")}
        loginButtonLabel={t("projects.start_login")}
        registerButtonLabel={t("projects.start_register")}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {t("projects.my_projects")}
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            {t("projects.my_projects_tagline")}
          </p>
        </div>
        <Button href="/proyectos/nuevo" size="md" className="rounded-none">
          {t("projects.add_project_btn")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: t("projects.stat_total"),
            value: projects.length,
            icon: "Folder",
          },
          {
            label: t("projects.stat_in_progress"),
            value: projects.filter((p: Project) => p.status?.toLowerCase() === "en_progreso").length,
            icon: "RotateCw",
          },
          {
            label: t("projects.stat_completed"),
            value: projects.filter((p: Project) => p.status?.toLowerCase() === "completado").length,
            icon: "CheckCircle2",
          },
          {
            label: t("projects.stat_paused"),
            value: projects.filter((p: Project) => p.status?.toLowerCase() === "pausado").length,
            icon: "PauseCircle",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-surface rounded-none border border-border p-4 flex flex-col items-center justify-center text-center hover:shadow-sm transition-shadow"
          >
            <div className="text-primary mb-1 flex items-center justify-center">
              <LucideIcon name={stat.icon} size={20} />
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project: Project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* New project placeholder */}
        <Link
          href="/proyectos/nuevo"
          className="flex flex-col items-center justify-center rounded-none border-2 border-dashed border-border hover:border-primary/50 p-8 text-center transition-all duration-200 group min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-none bg-bg-surface-light group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">
            {t("projects.create_new_placeholder")}
          </p>
        </Link>
      </div>
    </div>
  );
}
