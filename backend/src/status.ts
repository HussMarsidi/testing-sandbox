export const COMPLAINT_STATUSES = ["open", "in_progress", "resolved"] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

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

export class InvalidStatusTransitionError extends Error {
  constructor(from: ComplaintStatus, to: ComplaintStatus) {
    super(`Cannot change status from ${from} to ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}
