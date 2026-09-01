export const COMPLAINT_STATUSES = ["open", "in_progress", "resolved"] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

const ALLOWED_TRANSITIONS: Record<ComplaintStatus, readonly ComplaintStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["open", "resolved"],
  resolved: ["open"],
};

export function isValidStatusTransition(
  from: ComplaintStatus,
  to: ComplaintStatus,
): boolean {
  if (from === to) {
    return true;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getAllowedNextStatuses(current: ComplaintStatus): ComplaintStatus[] {
  return COMPLAINT_STATUSES.filter(
    (status) => status !== current && isValidStatusTransition(current, status),
  );
}

export function getStatusLabel(status: ComplaintStatus): string {
  return STATUS_LABELS[status];
}
