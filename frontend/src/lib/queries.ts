import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  createComplaint,
  fetchCategories,
  fetchComplaint,
  fetchComplaints,
  updateComplaintStatus,
  type ComplaintFilters,
  type CreateComplaint,
  type ComplaintStatus,
} from "./api";
import { COPY } from "./validators";

export const queryKeys = {
  categories: ["categories"] as const,
  complaints: (filters: ComplaintFilters = {}) => ["complaints", filters] as const,
  complaint: (id: number) => ["complaint", id] as const,
};

export function useCategories() {
  const query = useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.isError ? ("failed" as const) : null,
  };
}

export function useComplaints(filters: ComplaintFilters = {}) {
  const query = useQuery({
    queryKey: queryKeys.complaints(filters),
    queryFn: () => fetchComplaints(filters),
  });

  return {
    complaints: query.data ?? [],
    isLoading: query.isLoading,
    error: query.isError ? COPY.complaintsLoadError : null,
  };
}

export function useComplaint(id: number) {
  const query = useQuery({
    queryKey: queryKeys.complaint(id),
    queryFn: () => fetchComplaint(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  return {
    complaint: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError
      ? query.error instanceof ApiError && query.error.status === 404
        ? COPY.complaintNotFound
        : COPY.complaintLoadError
      : null,
  };
}

export function useCreateComplaintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateComplaint) => createComplaint(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}

export function useUpdateComplaintStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ComplaintStatus }) =>
      updateComplaintStatus(id, status),
    onSuccess: (complaint) => {
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      void queryClient.setQueryData(queryKeys.complaint(complaint.id), complaint);
    },
  });
}
