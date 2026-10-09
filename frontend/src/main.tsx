import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { AppProviders } from "@/components/common/AppProviders";
import { APP_MESSAGES } from "@/constants";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(APP_MESSAGES.ROOT_ELEMENT_MISSING);
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
