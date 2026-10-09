import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiResponse, ValidationErrorDetails } from "@/types";
import { getApiErrorMessage } from "./api-error";

function getFieldErrors(error: unknown): Record<string, string[] | undefined> {
  if (!isAxiosError<ApiResponse<null>>(error)) {
    return {};
  }
  const details = error.response?.data?.error?.details as ValidationErrorDetails | undefined;
  return details?.fieldErrors ?? {};
}

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  const fieldErrors = getFieldErrors(error);
  let applied = false;

  for (const field of fields) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      setError(field, { type: "server", message });
      applied = true;
    }
  }

  if (!applied) {
    setError("root", { type: "server", message: getApiErrorMessage(error) });
  }
}
