import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { AUTH_MESSAGES } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useLogout, useLogoutAll } from "@/service/auth.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { getApiErrorMessage } from "@/utils/api-error";

// Header menu for the signed-in user. Renders nothing when signed out, so the
// layout can include it unconditionally.
export function UserMenu() {
  const user = useAppSelector(selectCurrentUser);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const logout = useLogout();
  const logoutAll = useLogoutAll();
  const notify = useNotify();

  if (!user) {
    return null;
  }

  const close = () => setAnchor(null);

  const handleLogout = () => {
    close();
    logout.mutate();
  };

  const handleLogoutAll = () => {
    close();
    logoutAll.mutate(undefined, {
      onSuccess: () => notify.success(AUTH_MESSAGES.LOGGED_OUT_ALL),
      onError: (error) => notify.error(getApiErrorMessage(error)),
    });
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={AUTH_MESSAGES.ACCOUNT_MENU}
        aria-haspopup="menu"
        startIcon={<Avatar className="h-7 w-7 text-sm">{user.name.charAt(0).toUpperCase()}</Avatar>}
      >
        <span className="hidden sm:inline">{user.name}</span>
      </Button>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <div className="px-4 py-2">
          <Typography variant="body2" className="font-semibold">
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </div>
        <Divider />
        <MenuItem onClick={handleLogout}>{AUTH_MESSAGES.LOGOUT}</MenuItem>
        <MenuItem onClick={handleLogoutAll}>{AUTH_MESSAGES.LOGOUT_ALL}</MenuItem>
      </Menu>
    </>
  );
}
