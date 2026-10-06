import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosStatic, { isCancel } from "axios";
import { useCallback, useRef, useState } from "react";
import { API_ENDPOINTS, IDEMPOTENCY_HEADER, QUERY_KEYS, UPLOAD_STEP } from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type {
  ApiResponse,
  ImportRecord,
  PreparedUpload,
  PrepareUploadInput,
  UploadImportVariables,
  UploadStep,
} from "@/types";
import { importContentTypeOf } from "@/utils/file";

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
