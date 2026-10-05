import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { ROLE, ROLE_LABELS, USERS_MESSAGES } from "@/constants";
import type { Role, UsersTableProps } from "@/types";
import { formatDate } from "@/utils/format";

const ROLE_OPTIONS = Object.values(ROLE);

// Presentational: it reports what the admin asked for through onUpdate and
// leaves confirming and saving to the page.
//
// The disabled controls mirror the API's rules (it rejects these with 403
// anyway): nobody can change their own role or status, and an admin cannot be
// demoted.
export function UsersTable({
  users,
  currentUserId,
  updatingId,
  onView,
  onUpdate,
}: UsersTableProps) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{USERS_MESSAGES.COLUMN_NAME}</TableCell>
            <TableCell>{USERS_MESSAGES.COLUMN_EMAIL}</TableCell>
            <TableCell>{USERS_MESSAGES.COLUMN_ROLE}</TableCell>
            <TableCell>{USERS_MESSAGES.COLUMN_ACTIVE}</TableCell>
            <TableCell>{USERS_MESSAGES.COLUMN_JOINED}</TableCell>
            <TableCell align="right">{USERS_MESSAGES.COLUMN_ACTIONS}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" className="py-10 text-slate-500">
                {USERS_MESSAGES.EMPTY}
              </TableCell>
            </TableRow>
          )}

          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isUpdating = user.id === updatingId;

            return (
              <TableRow key={user.id} hover>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {user.name}
                    {isSelf && <Chip size="small" label={USERS_MESSAGES.YOU} />}
                  </span>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={user.role}
                    disabled={isSelf || isUpdating || user.role === ROLE.ADMIN}
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
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.isActive}
                    disabled={isSelf || isUpdating}
                    onChange={(event) => onUpdate(user, { isActive: event.target.checked })}
                    slotProps={{
                      input: { "aria-label": USERS_MESSAGES.activeStatusOf(user.name) },
                    }}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                <TableCell align="right">
                  <Tooltip title={USERS_MESSAGES.viewDetailsOf(user.name)}>
                    <IconButton
                      onClick={() => onView(user.id)}
                      aria-label={USERS_MESSAGES.viewDetailsOf(user.name)}
                    >
                      <VisibilityOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
