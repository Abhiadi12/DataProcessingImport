import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import LinearProgress from "@mui/material/LinearProgress";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { DeleteProjectDialog } from "@/components/project/DeleteProjectDialog";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectFormDialog } from "@/components/project/ProjectFormDialog";
import { PROJECT_PAGE_SIZE, PROJECT_PAGE_SIZE_OPTIONS, PROJECTS_MESSAGES, ROLE } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useGetProjects } from "@/service/project.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { Project } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { hasRole } from "@/utils/role";

export function ProjectsPage() {
  const user = useAppSelector(selectCurrentUser);
  // The list only ever contains projects this user can reach (their own, or
  // all of them for an admin), so MANAGER+ can manage every card shown.
  const canManage = hasRole(user, ROLE.MANAGER);

  // MUI's pagination counts pages from 0; the API counts from 1.
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PROJECT_PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const projects = useGetProjects({ page: pageIndex + 1, limit: pageSize });
  const page = projects.data?.data;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setFormOpen(true);
  };

  // Deleting the only project on a later page would leave that page empty.
  const handleDeleted = () => {
    if (page && page.items.length === 1 && pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const newProjectButton = canManage && (
    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
      {PROJECTS_MESSAGES.NEW}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="h4" component="h1" className="font-semibold">
            {PROJECTS_MESSAGES.TITLE}
          </Typography>
          <Typography color="text.secondary" className="mt-1">
            {PROJECTS_MESSAGES.SUBTITLE}
          </Typography>
        </div>
        {newProjectButton}
      </div>

      {projects.isPending && <PageLoader />}
      {projects.isError && <Alert severity="error">{getApiErrorMessage(projects.error)}</Alert>}

      {page && page.total === 0 && (
        <Card>
          <EmptyState
            title={PROJECTS_MESSAGES.EMPTY_TITLE}
            description={
              canManage ? PROJECTS_MESSAGES.EMPTY_FOR_MANAGER : PROJECTS_MESSAGES.EMPTY_FOR_MEMBER
            }
            action={newProjectButton}
          />
        </Card>
      )}

      {page && page.total > 0 && (
        <>
          {/* Shown while a different page is loading behind the current cards. */}
          {projects.isFetching && <LinearProgress />}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.items.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
          <TablePagination
            component="div"
            count={page.total}
            page={pageIndex}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PROJECT_PAGE_SIZE_OPTIONS}
            labelRowsPerPage={PROJECTS_MESSAGES.PER_PAGE}
            onPageChange={(_event, nextPage) => setPageIndex(nextPage)}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          />
        </>
      )}

      <ProjectFormDialog open={formOpen} project={editing} onClose={() => setFormOpen(false)} />
      <DeleteProjectDialog
        project={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
