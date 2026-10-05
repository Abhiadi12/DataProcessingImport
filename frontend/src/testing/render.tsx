import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import type { AuthState } from "@/types";
import { createTestStore } from "./factories";
import { mockAnonymousAuthState } from "./mockData";

export function renderWithProviders(ui: ReactElement, auth: AuthState = mockAnonymousAuthState) {
  const store = createTestStore(auth);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const result = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

  return { store, ...result };
}
