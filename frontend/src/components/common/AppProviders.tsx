import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router";
import { store } from "@/store";
import type { AppProvidersProps } from "@/types";
import { queryClient } from "@/utils/query-client";
import { theme } from "@/utils/theme";
import { ErrorBoundary } from "./ErrorBoundary";

const CSS_LAYER_ORDER = "@layer theme, base, mui, components, utilities;";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <StyledEngineProvider enableCssLayer>
          <GlobalStyles styles={CSS_LAYER_ORDER} />
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <ErrorBoundary>{children}</ErrorBoundary>
            </BrowserRouter>
          </ThemeProvider>
        </StyledEngineProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
