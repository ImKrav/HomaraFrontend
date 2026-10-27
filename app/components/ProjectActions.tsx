"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/ui/Button";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { useDialog } from "@/app/hooks/useDialog";

export type ProjectActionStatus = "EN_PROGRESO" | "COMPLETADO" | "PAUSADO";

interface ProjectActionsProps {
  projectId: string;
  projectName: string;
  currentStatus: string;
}

export default function ProjectActions({ projectId, projectName, currentStatus }: Readonly<ProjectActionsProps>) {
  const { t } = useLanguage();
  const router = useRouter();
  const [status, setStatus] = useState<ProjectActionStatus>(
    (currentStatus?.toUpperCase() || "EN_PROGRESO") as ProjectActionStatus
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const deleteDialogRef = useDialog<HTMLDivElement>(showDeleteConfirm, () => {
    setShowDeleteConfirm(false);
    setError("");
  });

  useEffect(() => {
    if (currentStatus) {
      setStatus(currentStatus.toUpperCase() as ProjectActionStatus);
    }
  }, [currentStatus]);

  const handleStatusChange = async (newStatus: ProjectActionStatus) => {
    try {
      setUpdating(true);
      const res = await api.put(`/api/v1/projects/${projectId}`, { status: newStatus });
      if (res.success) {
        setStatus(newStatus);
        showToast(t("projects.actions_toast.status_updated"), "success");
        router.refresh();
      } else {
        showToast(res.error || t("projects.actions_toast.status_update_error"), "error");
      }
    } catch {
      showToast(t("projects.actions_toast.conn_error"), "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError("");
      const res = await api.delete(`/api/v1/projects/${projectId}`);
      if (res.success) {
        router.push("/proyectos");
        router.refresh();
      } else {
        setError(res.error || t("projects.actions_toast.delete_error"));
      }
    } catch {
      setError(t("projects.actions_toast.delete_conn_error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Selector de Estado */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-text-muted whitespace-nowrap">{t("projects.actions_status_label")}</span>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as ProjectActionStatus)}
          className="bg-bg-surface border border-border rounded-none px-3 py-2 text-xs font-bold text-text-primary uppercase tracking-wider focus:border-primary transition-colors cursor-pointer"
          disabled={updating || deleting}
        >
          <option value="EN_PROGRESO">{t("status.en_progreso")}</option>
          <option value="PAUSADO">{t("status.pausado")}</option>
          <option value="COMPLETADO">{t("status.completado")}</option>
        </select>
      </div>

      <div className="h-5 w-[1px] bg-border hidden sm:block" />

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/proyectos/nuevo?edit=${projectId}`)}
          disabled={updating || deleting}
        >
          {t("projects.actions_edit_btn")}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={updating || deleting}
        >
          {deleting ? t("projects.actions_deleting") : t("projects.actions_delete_btn")}
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            ref={deleteDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="bg-bg-surface rounded-xl border border-border p-6 max-w-md w-full"
          >
            <h3 id="delete-project-title" className="text-lg font-bold text-text-primary mb-2">
              {t("projects.delete_modal_title")}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {t("projects.delete_modal_desc").split("{name}")[0]}<strong>{projectName}</strong>{t("projects.delete_modal_desc").split("{name}")[1]}
            </p>
            {error && (
              <p className="text-sm text-error mb-4">{error}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError("");
                }}
                disabled={deleting}
              >
                {t("projects.delete_modal_cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? t("projects.actions_deleting") : t("projects.delete_modal_confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
