import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { COMMON_MESSAGES, PROJECTS_MESSAGES } from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { useDeleteProject } from "@/service/project.service";
import type { DeleteProjectDialogProps } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

// Confirmation + the delete itself, shared by the list and the detail page.
export function DeleteProjectDialog({ project, onClose, onDeleted }: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject();
  const notify = useNotify();

  // Awaited rather than using mutate()'s callbacks: on the detail page a
  // successful delete navigates away and unmounts this component, and React
  // Query drops per-call callbacks of an unmounted component.
  const handleConfirm = async () => {
    if (!project) {
      return;
    }
    onClose();
    try {
      const res = await deleteProject.mutateAsync(project.id);
      notify.success(res.message);
      onDeleted?.(project);
    } catch (error) {
      notify.error(getApiErrorMessage(error));
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(project)}
      title={PROJECTS_MESSAGES.DELETE_TITLE}
      description={PROJECTS_MESSAGES.deleteWarning(project?.name ?? "")}
      confirmLabel={COMMON_MESSAGES.DELETE}
      destructive
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
