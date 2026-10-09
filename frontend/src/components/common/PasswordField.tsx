import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { forwardRef, useState } from "react";
import { FIELD_LABELS } from "@/constants";
import type { PasswordFieldProps } from "@/types";

// A TextField with a show/hide toggle. Forwards its ref so it works with
// react-hook-form's register().
export const PasswordField = forwardRef<HTMLDivElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        slotProps={{
          ...props.slotProps,
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => setVisible((current) => !current)}
                  aria-label={visible ? FIELD_LABELS.HIDE_PASSWORD : FIELD_LABELS.SHOW_PASSWORD}
                >
                  {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  },
);
