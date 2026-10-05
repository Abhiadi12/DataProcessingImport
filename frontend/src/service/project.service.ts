import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type {
  ApiResponse,
  CreateProjectInput,
  PaginatedData,
  PaginationParams,
  Project,
  UpdateProjectVariables,
} from "@/types";

// Admins get every project; everyone else only the ones they are a member of.
// The backend decides that — the request is the same for both.
export const useGetProjects = ({ page = 1, limit = DEFAULT_PAGE_SIZE }: PaginationParams = {}) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.PROJECTS_LIST, page, limit],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<PaginatedData<Project>>>(
        API_ENDPOINTS.PROJECTS.LIST,
        { params: { page, limit } },
      );
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
};

// Fails with 403 for a non-member (admins excepted) and 404 for a missing
// project — the detail page shows a dedicated state for each.
export const useGetProject = (id: string) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.PROJECT_DETAIL, id],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<Project>>(API_ENDPOINTS.PROJECTS.byId(id));
      return res.data;
    },
  });
};

// MANAGER and above. The creator becomes the project's first member.
export const useCreateProject = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await axios.post<ApiResponse<Project>>(API_ENDPOINTS.PROJECTS.LIST, input);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS_ALL }),
  });
};

// A manager who is a member, or an admin.
export const useUpdateProject = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: UpdateProjectVariables) => {
      const res = await axios.patch<ApiResponse<Project>>(API_ENDPOINTS.PROJECTS.byId(id), input);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS_ALL }),
  });
};

// A manager who is a member, or an admin.
export const useDeleteProject = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete<ApiResponse<null>>(API_ENDPOINTS.PROJECTS.byId(id));
      return res.data;
    },
    onSuccess: (_res, id) => {
      // Drop the deleted project's detail instead of refetching it (that
      // would 404), then refresh the lists.
      queryClient.removeQueries({ queryKey: [...QUERY_KEYS.PROJECT_DETAIL, id] });
      return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS_LIST });
    },
  });
};
