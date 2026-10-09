import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type {
  ApiResponse,
  CreateImportSchemaVariables,
  ImportSchema,
  PaginatedData,
  PaginationParams,
} from "@/types";

//INFO: The schemas usable in one project: its own plus every global one. Archived
// schemas are not returned.
export const useGetProjectSchemas = (
  projectId: string,
  { page = 1, limit = DEFAULT_PAGE_SIZE }: PaginationParams = {},
) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.IMPORT_SCHEMAS_LIST, projectId, page, limit],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<PaginatedData<ImportSchema>>>(
        API_ENDPOINTS.PROJECTS.importSchemas(projectId),
        { params: { page, limit } },
      );
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
};

//INFO: One schema, including how many imports use it. Pass null to keep the query
// idle (e.g. a closed details dialog).
export const useGetSchema = (id: string | null) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.IMPORT_SCHEMA_DETAIL, id],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<ImportSchema>>(
        API_ENDPOINTS.IMPORT_SCHEMAS.byId(id ?? ""),
      );
      return res.data;
    },
    enabled: Boolean(id),
  });
};

//INFO: Two endpoints behind one hook: a project schema (MANAGER+ with access to the
// project) or a global one (ADMIN only).
export const useCreateSchema = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, isGlobal, input }: CreateImportSchemaVariables) => {
      const url = isGlobal
        ? API_ENDPOINTS.IMPORT_SCHEMAS.GLOBAL
        : API_ENDPOINTS.PROJECTS.importSchemas(projectId);
      const res = await axios.post<ApiResponse<ImportSchema>>(url, input);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMPORT_SCHEMAS_ALL }),
  });
};

// Soft delete (the API's DELETE archives). MANAGER+ for a project schema,
// ADMIN for a global one; refused with 409 if any import uses the schema.
export const useArchiveSchema = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete<ApiResponse<ImportSchema>>(
        API_ENDPOINTS.IMPORT_SCHEMAS.byId(id),
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IMPORT_SCHEMAS_ALL }),
  });
};
