import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageLoader } from "@/components/common/PageLoader";
import { RoleChip } from "@/components/user/RoleChip";
import {
  DEFAULT_PAGE_SIZE,
  MEMBERS_MESSAGES,
  PAGE_SIZE_OPTIONS,
  USERS_MESSAGES,
} from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useGetProjectMembers, useRemoveProjectMember } from "@/service/project.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { MembersPanelProps, ProjectMember } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDate } from "@/utils/format";
import { AddMemberForm } from "./AddMemberForm";

// The member list of one project. It fetches by projectId alone and needs no
// loaded project, because a manager who is not a member can still read this
// list (canManage is false for them, which hides the add form and remove
// buttons).
export function MembersPanel({ projectId, canManage }: MembersPanelProps) {
  const currentUser = useAppSelector(selectCurrentUser);
  const notify = useNotify();

  // MUI's pagination counts pages from 0; the API counts from 1.
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [removing, setRemoving] = useState<ProjectMember | null>(null);

  const members = useGetProjectMembers(projectId, { page: pageIndex + 1, limit: pageSize });
  const removeMember = useRemoveProjectMember();
  const page = members.data?.data;
  const columnCount = canManage ? 6 : 5;

  // Awaited rather than using mutate()'s callbacks: removing yourself makes
  // the project page re-render into its non-member state, which unmounts this
  // panel, and React Query drops per-call callbacks of an unmounted component.
  const confirmRemove = async () => {
    if (!removing) {
      return;
    }
    const member = removing;
    setRemoving(null);
    try {
      const res = await removeMember.mutateAsync({ projectId, userId: member.userId });
      notify.success(res.message);
      // Removing the only member on a later page would leave that page empty.
      if (page && page.items.length === 1 && pageIndex > 0) {
        setPageIndex(pageIndex - 1);
      }
    } catch (error) {
      // e.g. "A project must have at least one member".
      notify.error(getApiErrorMessage(error));
    }
  };

  return (
    <div>
      {canManage && (
        <div className="border-b border-slate-200 p-4">
          <AddMemberForm projectId={projectId} />
        </div>
      )}

      {members.isPending && <PageLoader />}
      {members.isError && (
        <Alert severity="error" className="m-4">
          {getApiErrorMessage(members.error)}
        </Alert>
      )}

      {page && (
        <>
          {/* Shown while a different page is loading behind the current rows. */}
          {members.isFetching && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{USERS_MESSAGES.COLUMN_NAME}</TableCell>
                  <TableCell>{USERS_MESSAGES.COLUMN_EMAIL}</TableCell>
                  <TableCell>{USERS_MESSAGES.COLUMN_ROLE}</TableCell>
                  <TableCell>{USERS_MESSAGES.STATUS}</TableCell>
                  <TableCell>{MEMBERS_MESSAGES.COLUMN_JOINED}</TableCell>
                  {canManage && (
                    <TableCell align="right">{USERS_MESSAGES.COLUMN_ACTIONS}</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {page.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      align="center"
                      className="py-10 text-slate-500"
                    >
                      {MEMBERS_MESSAGES.EMPTY}
                    </TableCell>
                  </TableRow>
                )}

                {page.items.map((member) => (
                  <TableRow key={member.userId} hover>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {member.name}
                        {member.userId === currentUser?.id && (
                          <Chip size="small" label={USERS_MESSAGES.YOU} />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <RoleChip role={member.role} />
                    </TableCell>
                    <TableCell>
                      {member.isActive ? USERS_MESSAGES.ACTIVE : USERS_MESSAGES.INACTIVE}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Tooltip title={MEMBERS_MESSAGES.removeLabel(member.name)}>
                          <IconButton
                            onClick={() => setRemoving(member)}
                            disabled={removeMember.isPending}
                            aria-label={MEMBERS_MESSAGES.removeLabel(member.name)}
                          >
                            <PersonRemoveOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={page.total}
            page={pageIndex}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage={USERS_MESSAGES.ROWS_PER_PAGE}
            onPageChange={(_event, nextPage) => setPageIndex(nextPage)}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title={MEMBERS_MESSAGES.REMOVE_TITLE}
        description={
          removing?.userId === currentUser?.id
            ? MEMBERS_MESSAGES.removeSelfWarning
            : MEMBERS_MESSAGES.removeWarning(removing?.name ?? "")
        }
        confirmLabel={MEMBERS_MESSAGES.REMOVE_CONFIRM}
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
