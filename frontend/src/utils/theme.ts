import { createTheme } from "@mui/material/styles";

const FONT_FAMILY = [
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif",
].join(",");

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5" },
    background: { default: "#f8fafc", paper: "#ffffff" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: FONT_FAMILY,
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: "outlined" } },
    MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
  },
});
