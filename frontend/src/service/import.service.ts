import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosStatic, { isCancel } from "axios";
import { useCallback, useRef, useState } from "react";
import {
  ACTIVE_IMPORT_STATUSES,
  API_ENDPOINTS,
  DEFAULT_PAGE_SIZE,
  IDEMPOTENCY_HEADER,
  IMPORTS_POLL_INTERVAL_MS,
  QUERY_KEYS,
  UPLOAD_STEP,
} from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type {
  ApiResponse,
  ImportListItem,
  ImportListParams,
  ImportRecord,
  PaginatedData,
  PreparedUpload,
  PrepareUploadInput,
  UploadImportVariables,
  UploadStep,
} from "@/types";
import { importContentTypeOf } from "@/utils/file";

export const useGetProjectImports = (
  projectId: string,
  { page = 1, limit = DEFAULT_PAGE_SIZE, status }: ImportListParams = {},
) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.IMPORTS_LIST, projectId, page, limit, status ?? null],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<PaginatedData<ImportListItem>>>(
        API_ENDPOINTS.PROJECTS.imports(projectId),
        // An undefined status is left out of the query string by axios.
        { params: { page, limit, status } },
      );
      return res.data;
    },
    placeholderData: keepPreviousData,
    // Polling pauses while the tab is hidden (React Query's default — no point
    // fetching for a page nobody is looking at). Refetch as soon as the user
    // comes back, rather than showing stale numbers until the next tick.
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => {
      const items = query.state.data?.data?.items ?? [];
      const hasActive = items.some((item) => ACTIVE_IMPORT_STATUSES.includes(item.status));
      return hasActive ? IMPORTS_POLL_INTERVAL_MS : false;
    },
  });
};

export const useUploadImport = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<UploadStep>(UPLOAD_STEP.IDLE);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ projectId, file, schemaId, idempotencyKey }: UploadImportVariables) => {
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;
      const contentType = importContentTypeOf(file);

      setProgress(0);
      setStep(UPLOAD_STEP.PREPARING);
      const body: PrepareUploadInput = {
        filename: file.name,
        sizeBytes: file.size,
        contentType,
        schemaId,
      };
      const prepared = await axios.post<ApiResponse<PreparedUpload>>(
        API_ENDPOINTS.PROJECTS.imports(projectId),
        body,
        // The same key is sent if this exact upload is tried again, so a retry
        // reuses the import created the first time instead of adding another.
        { signal, headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } },
      );
      const upload = prepared.data.data;
      if (!upload) {
        throw new Error(prepared.data.message);
      }

      setStep(UPLOAD_STEP.UPLOADING);
      // Plain axios, NOT the app's client: this request goes to object
      // storage, and the app client would add the API's Authorization header.
      // A presigned URL already carries its own signature, and storage rejects
      // a request that has both. No timeout — a 2 GB file can take a while.
      await axiosStatic.put(upload.uploadUrl, file, {
        signal,
        headers: { "Content-Type": contentType },
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      setStep(UPLOAD_STEP.STARTING);
      const started = await axios.post<ApiResponse<ImportRecord>>(
        API_ENDPOINTS.IMPORTS.start(upload.id),
        undefined,
        { signal },
      );
      return started.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMPORTS_ALL }),
    onSettled: () => {
      abortRef.current = null;
      setStep(UPLOAD_STEP.IDLE);
    },
  });

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { ...mutation, step, progress, cancel };
};

// True when a request failed because the user cancelled it, which is not an
// error worth showing.
export const isUploadCancelled = (error: unknown): boolean => isCancel(error);
