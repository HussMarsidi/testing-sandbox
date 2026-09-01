import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStatusLabel, getAllowedNextStatuses, type ComplaintStatus } from "../lib/status";
import { useUpdateComplaintStatusMutation } from "../lib/queries";
import { COPY } from "../lib/validators";

interface ComplaintStatusControlProps {
  complaintId: number;
  currentStatus: ComplaintStatus;
}

export function ComplaintStatusControl({
  complaintId,
  currentStatus,
}: ComplaintStatusControlProps) {
  const { isAdmin } = useAuth();
  const updateStatus = useUpdateComplaintStatusMutation();
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) {
    return <span className="status-badge">{getStatusLabel(currentStatus)}</span>;
  }

  const nextStatuses = getAllowedNextStatuses(currentStatus);

  async function handleChange(nextStatus: ComplaintStatus) {
    setError(null);

    try {
      await updateStatus.mutateAsync({ id: complaintId, status: nextStatus });
    } catch {
      setError(COPY.complaintUpdateError);
    }
  }

  return (
    <div className="status-control">
      <label htmlFor={`status-${complaintId}`}>{COPY.statusLabel}</label>
      <select
        id={`status-${complaintId}`}
        value={currentStatus}
        disabled={updateStatus.isPending || nextStatuses.length === 0}
        onChange={(event) => void handleChange(event.target.value as ComplaintStatus)}
      >
        <option value={currentStatus}>{getStatusLabel(currentStatus)}</option>
        {nextStatuses.map((status) => (
          <option key={status} value={status}>
            {getStatusLabel(status)}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
