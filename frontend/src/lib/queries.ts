import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchComplaints } from "./api";
import { COPY } from "./validators";

export const queryKeys = {
  categories: ["categories"] as const,
  complaints: ["complaints"] as const,
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

export function useComplaints() {
  const query = useQuery({
    queryKey: queryKeys.complaints,
    queryFn: fetchComplaints,
  });

  return {
    complaints: query.data ?? [],
    isLoading: query.isLoading,
    error: query.isError ? COPY.complaintsLoadError : null,
  };
}
