// Passed in router location state when a guard sends the user to /login, so
// they land back where they were after signing in.
export interface RedirectState {
  from?: string;
}
