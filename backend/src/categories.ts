import type { ComplaintCategory } from "./db.js";

export interface CategoryOption {
  value: ComplaintCategory;
  label: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

export function listCategories(): CategoryOption[] {
  return CATEGORY_OPTIONS;
}
