import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { RoleChip } from "@/components/user/RoleChip";
import {
  DEFAULT_PAGE_SIZE,
  MEMBERS_MESSAGES,
  PAGE_SIZE_OPTIONS,
  PROJECTS_MESSAGES,
  USERS_MESSAGES,
} from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useGetProjectMembers, useRemoveProjectMember } from "@/service/project.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { DataTableColumn, MembersPanelProps, ProjectMember } from "@/types";
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

  const columns: DataTableColumn<ProjectMember>[] = [
    {
      key: "name",
      header: USERS_MESSAGES.COLUMN_NAME,
      render: (member) => (
        <span className="flex items-center gap-2">
          {member.name}
          {member.userId === currentUser?.id && <Chip size="small" label={USERS_MESSAGES.YOU} />}
        </span>
      ),
    },
    { key: "email", header: USERS_MESSAGES.COLUMN_EMAIL, render: (member) => member.email },
    {
      key: "role",
      header: USERS_MESSAGES.COLUMN_ROLE,
      render: (member) => <RoleChip role={member.role} />,
    },
    {
      key: "status",
      header: USERS_MESSAGES.STATUS,
      render: (member) => (member.isActive ? USERS_MESSAGES.ACTIVE : USERS_MESSAGES.INACTIVE),
    },
    {
      key: "joined",
      header: MEMBERS_MESSAGES.COLUMN_JOINED,
      className: "whitespace-nowrap",
      render: (member) => formatDate(member.joinedAt),
    },
  ];

  // Only people who can change the membership get the column that does it.
  if (canManage) {
    columns.push({
      key: "actions",
      header: USERS_MESSAGES.COLUMN_ACTIONS,
      align: "right",
      render: (member) => (
        <Tooltip title={MEMBERS_MESSAGES.removeLabel(member.name)}>
          <IconButton
            onClick={() => setRemoving(member)}
            disabled={removeMember.isPending}
            aria-label={MEMBERS_MESSAGES.removeLabel(member.name)}
          >
            <PersonRemoveOutlinedIcon />
          </IconButton>
        </Tooltip>
      ),
    });
  }

  return (
    <div>
      {canManage && (
        <div className="border-b border-slate-200 p-4">
          <AddMemberForm projectId={projectId} />
        </div>
      )}

      <DataTable
        label={PROJECTS_MESSAGES.TAB_MEMBERS}
        columns={columns}
        rows={page?.items ?? []}
        getRowKey={(member) => member.userId}
        emptyMessage={MEMBERS_MESSAGES.EMPTY}
        isLoading={members.isPending}
        isRefreshing={members.isFetching}
        errorMessage={members.isError ? getApiErrorMessage(members.error) : null}
        pagination={{
          page: pageIndex,
          pageSize,
          total: page?.total ?? 0,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onPageChange: setPageIndex,
          onPageSizeChange: (nextSize) => {
            setPageSize(nextSize);
            setPageIndex(0);
          },
        }}
      />

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
