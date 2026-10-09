import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./root-reducer";

// Redux holds client state (session, UI). Server data belongs to React Query —
// don't copy API responses into slices.
export const store = configureStore({
  reducer: rootReducer,
});
