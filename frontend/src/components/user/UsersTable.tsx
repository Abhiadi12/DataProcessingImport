import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import { DataTable } from "@/components/common/DataTable";
import { ROLE, ROLE_LABELS, USERS_MESSAGES } from "@/constants";
import type { DataTableColumn, PublicUser, Role, UsersTableProps } from "@/types";
import { formatDate } from "@/utils/format";

const ROLE_OPTIONS = Object.values(ROLE);

export function UsersTable({
  users,
  currentUserId,
  updatingId,
  onView,
  onUpdate,
  isRefreshing,
  pagination,
}: UsersTableProps) {
  const columns: DataTableColumn<PublicUser>[] = [
    {
      key: "name",
      header: USERS_MESSAGES.COLUMN_NAME,
      render: (user) => (
        <span className="flex items-center gap-2">
          {user.name}
          {user.id === currentUserId && <Chip size="small" label={USERS_MESSAGES.YOU} />}
        </span>
      ),
    },
    { key: "email", header: USERS_MESSAGES.COLUMN_EMAIL, render: (user) => user.email },
    {
      key: "role",
      header: USERS_MESSAGES.COLUMN_ROLE,
      render: (user) => (
        <Select
          size="small"
          value={user.role}
          disabled={user.id === currentUserId || user.id === updatingId || user.role === ROLE.ADMIN}
          onChange={(event) => onUpdate(user, { role: event.target.value as Role })}
          inputProps={{ "aria-label": USERS_MESSAGES.roleOf(user.name) }}
          className="min-w-32"
        >
          {ROLE_OPTIONS.map((role) => (
            <MenuItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      key: "active",
      header: USERS_MESSAGES.COLUMN_ACTIVE,
      render: (user) => (
        <Switch
          checked={user.isActive}
          disabled={user.id === currentUserId || user.id === updatingId}
          onChange={(event) => onUpdate(user, { isActive: event.target.checked })}
          slotProps={{ input: { "aria-label": USERS_MESSAGES.activeStatusOf(user.name) } }}
        />
      ),
    },
    {
      key: "joined",
      header: USERS_MESSAGES.COLUMN_JOINED,
      className: "whitespace-nowrap",
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      header: USERS_MESSAGES.COLUMN_ACTIONS,
      align: "right",
      render: (user) => (
        <Tooltip title={USERS_MESSAGES.viewDetailsOf(user.name)}>
          <IconButton
            onClick={() => onView(user.id)}
            aria-label={USERS_MESSAGES.viewDetailsOf(user.name)}
          >
            <VisibilityOutlinedIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <DataTable
      label={USERS_MESSAGES.TITLE}
      columns={columns}
      rows={users}
      getRowKey={(user) => user.id}
      emptyMessage={USERS_MESSAGES.EMPTY}
      isRefreshing={isRefreshing}
      pagination={pagination}
    />
  );
}
