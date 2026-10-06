import TextField from "@mui/material/TextField";
import { forwardRef } from "react";
import type { InputProps } from "@/types";

export const Input = forwardRef<HTMLDivElement, InputProps>(function Input(props, ref) {
  return <TextField ref={ref} fullWidth {...props} />;
});
