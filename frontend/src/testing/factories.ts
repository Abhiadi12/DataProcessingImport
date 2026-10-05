import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "@/store/root-reducer";
import type { AuthState } from "@/types";

// A fresh store per test, starting from the given auth state. Built from the
// real root reducer, so components' typed selectors work unchanged.
export function createTestStore(auth: AuthState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: { auth },
  });
}
