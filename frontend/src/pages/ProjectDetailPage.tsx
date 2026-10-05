import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { DeleteProjectDialog } from "@/components/project/DeleteProjectDialog";
import { MembersPanel } from "@/components/project/MembersPanel";
import { NonMemberProjectView } from "@/components/project/NonMemberProjectView";
import { ProjectFormDialog } from "@/components/project/ProjectFormDialog";
import { ProjectLoadError } from "@/components/project/ProjectLoadError";
import {
  COMMON_MESSAGES,
  HTTP_STATUS,
  PROJECT_TAB_PARAM,
  PROJECT_TABS,
  PROJECTS_MESSAGES,
  ROLE,
  ROUTES,
} from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useGetProject } from "@/service/project.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { Project } from "@/types";
import { getApiErrorStatus } from "@/utils/api-error";
import { hasRole } from "@/utils/role";

const TABS = [
  // Members has a real panel; placeholder is unused for it.
  { value: PROJECT_TABS.MEMBERS, label: PROJECTS_MESSAGES.TAB_MEMBERS, placeholder: "" },
  {
    value: PROJECT_TABS.SCHEMAS,
    label: PROJECTS_MESSAGES.TAB_SCHEMAS,
    placeholder: PROJECTS_MESSAGES.SCHEMAS_PLACEHOLDER,
  },
  {
    value: PROJECT_TABS.IMPORTS,
    label: PROJECTS_MESSAGES.TAB_IMPORTS,
    placeholder: PROJECTS_MESSAGES.IMPORTS_PLACEHOLDER,
  },
];

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const { data, isPending, isError, error } = useGetProject(id);
  const project = data?.data;

  // An unknown ?tab= value falls back to the first tab instead of a blank panel.
  const requestedTab = searchParams.get(PROJECT_TAB_PARAM);
  const activeTab = TABS.find((tab) => tab.value === requestedTab) ?? TABS[0]!;

  if (isPending) {
    return <PageLoader />;
  }

  const canManage = hasRole(user, ROLE.MANAGER);

  if (isError || !project) {
    // A manager refused the project can still read its member list.
    if (canManage && getApiErrorStatus(error) === HTTP_STATUS.FORBIDDEN) {
      return <NonMemberProjectView projectId={id} error={error} />;
    }
    return <ProjectLoadError error={error} />;
  }

  // Reaching this point means the API let this user open the project (member
  // or admin), so the role alone (canManage) decides whether they can edit or
  // delete it and change its members.

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          component={RouterLink}
          to={ROUTES.HOME}
          startIcon={<ArrowBackIcon />}
          size="small"
          className="mb-2 -ml-1"
        >
          {PROJECTS_MESSAGES.BACK_TO_LIST}
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography variant="h4" component="h1" className="font-semibold break-words">
              {project.name}
            </Typography>
            <Typography color="text.secondary" className="mt-1 whitespace-pre-line">
              {project.description || PROJECTS_MESSAGES.NO_DESCRIPTION}
            </Typography>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Button variant="outlined" onClick={() => setEditOpen(true)}>
                {COMMON_MESSAGES.EDIT}
              </Button>
              <Button variant="outlined" color="error" onClick={() => setDeleting(project)}>
                {COMMON_MESSAGES.DELETE}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <Tabs
          value={activeTab.value}
          // replace: switching tabs shouldn't fill the browser's Back history.
          onChange={(_event, value: string) =>
            setSearchParams({ [PROJECT_TAB_PARAM]: value }, { replace: true })
          }
          aria-label={PROJECTS_MESSAGES.TABS_LABEL}
          className="border-b border-slate-200 px-2"
        >
          {TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        <div role="tabpanel">
          {activeTab.value === PROJECT_TABS.MEMBERS ? (
            <MembersPanel projectId={project.id} canManage={canManage} />
          ) : (
            <EmptyState title={activeTab.label} description={activeTab.placeholder} />
          )}
        </div>
      </Card>

      <ProjectFormDialog open={editOpen} project={project} onClose={() => setEditOpen(false)} />
      <DeleteProjectDialog
        project={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => navigate(ROUTES.HOME, { replace: true })}
      />
    </div>
  );
}
