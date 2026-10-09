import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosStatic, { isCancel } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTIVE_IMPORT_STATUSES,
  API_ENDPOINTS,
  DEFAULT_PAGE_SIZE,
  IDEMPOTENCY_HEADER,
  IMPORT_FILE_KIND,
  IMPORT_PROGRESS_POLL_INTERVAL_MS,
  IMPORTS_POLL_INTERVAL_MS,
  QUERY_KEYS,
  UPLOAD_STEP,
} from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type {
  ApiResponse,
  DownloadImportVariables,
  ImportDetail,
  ImportDownload,
  ImportListItem,
  ImportListParams,
  ImportProgress,
  ImportRecord,
  ImportStatus,
  PaginatedData,
  PreparedUpload,
  PrepareUploadInput,
  RetryImportVariables,
  UploadImportVariables,
  UploadStep,
} from "@/types";
import { triggerDownload } from "@/utils/download";
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

export const useGetImport = (id: string) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.IMPORT_DETAIL, id],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<ImportDetail>>(API_ENDPOINTS.IMPORTS.byId(id));
      return res.data;
    },
    refetchOnWindowFocus: "always",
  });
};

//INFO: The import's live numbers. Polls every 1.5s while the import is still
// running and stops by itself on the first answer that says it has finished —
// so for an import that is already finished this is a single request (worth
// making: the processing speed is only on this endpoint).
export const useGetImportProgress = (id: string) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.IMPORT_PROGRESS, id],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<ImportProgress>>(API_ENDPOINTS.IMPORTS.progress(id));
      return res.data;
    },
    // Every answer is out of date at once.
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => {
      // A failed request (import not found, no access) will fail the same way
      // every time — don't keep asking.
      if (query.state.status === "error") {
        return false;
      }
      const status = query.state.data?.data?.status;
      const isRunning = status === undefined || ACTIVE_IMPORT_STATUSES.includes(status);
      return isRunning ? IMPORT_PROGRESS_POLL_INTERVAL_MS : false;
    },
  });
};

// The moment the live status says the import has finished, re-fetch everything
// about imports: the details gain the final counts, the failure reason and the
// failed-row sample, and the history list shows the new status.
export const useRefreshWhenImportFinishes = (liveStatus: ImportStatus | undefined) => {
  const queryClient = useQueryClient();
  const hasFinished = liveStatus !== undefined && !ACTIVE_IMPORT_STATUSES.includes(liveStatus);

  useEffect(() => {
    if (hasFinished) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMPORTS_ALL });
    }
  }, [hasFinished, queryClient]);
};

export const useCancelImport = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.post<ApiResponse<ImportRecord>>(API_ENDPOINTS.IMPORTS.cancel(id));
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMPORTS_ALL }),
  });
};

// Runs a failed or cancelled import again, from the first row. Allowed for
// the person who uploaded it and for managers and admins. Re-fetching
// everything afterwards also restarts the progress poll, which had stopped
// when the import finished.
export const useRetryImport = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, idempotencyKey }: RetryImportVariables) => {
      const res = await axios.post<ApiResponse<ImportRecord>>(
        API_ENDPOINTS.IMPORTS.retry(id),
        undefined,
        // A double-click or a network retry must not queue the import twice.
        { headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } },
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMPORTS_ALL }),
  });
};

// Downloads the original file or the error report. The API does not send the
// file: it returns a link to object storage that is valid for a few minutes,
// and the browser downloads from storage directly. So the link is fetched
// fresh on every click and never kept.
export const useDownloadImportFile = () => {
  const axios = useAxios();

  return useMutation({
    mutationFn: async ({ id, kind }: DownloadImportVariables) => {
      const endpoint =
        kind === IMPORT_FILE_KIND.ERROR_REPORT
          ? API_ENDPOINTS.IMPORTS.errorReport(id)
          : API_ENDPOINTS.IMPORTS.download(id);
      const res = await axios.get<ApiResponse<ImportDownload>>(endpoint);
      return res.data;
    },
    onSuccess: (res) => {
      if (res.data) {
        triggerDownload(res.data.url, res.data.filename);
      }
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
