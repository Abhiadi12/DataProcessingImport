import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { MEMBERS_MESSAGES, PROJECTS_MESSAGES, ROUTES } from "@/constants";
import { useGetProjectMembers } from "@/service/project.service";
import type { NonMemberProjectViewProps } from "@/types";
import { MembersPanel } from "./MembersPanel";
import { ProjectLoadError } from "./ProjectLoadError";

// What a MANAGER sees for a project they are not a member of: the API refuses
// the project itself (403) but still lets them read its member list. There is
// no project name to show — the detail request is the one that was refused.
export function NonMemberProjectView({ projectId, error }: NonMemberProjectViewProps) {
  // Same query (and cache entry) as MembersPanel's first page.
  const members = useGetProjectMembers(projectId);

  if (members.isPending) {
    return <PageLoader />;
  }

  // The 403 is also what the API returns for a project that does not exist.
  // A real project always has at least one member (the API refuses to remove
  // the last one), so an empty list means there is no such project — fall
  // back to the ordinary error screen instead of an empty table.
  if (members.isError || members.data.data?.total === 0) {
    return <ProjectLoadError error={error} />;
  }

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
        <Typography variant="h4" component="h1" className="font-semibold">
          {MEMBERS_MESSAGES.VIEW_ONLY_TITLE}
        </Typography>
      </div>

      <Alert severity="info">{MEMBERS_MESSAGES.VIEW_ONLY_NOTICE}</Alert>

      <Card>
        <MembersPanel projectId={projectId} canManage={false} />
      </Card>
    </div>
  );
}
