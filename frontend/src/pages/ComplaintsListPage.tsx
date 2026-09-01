import { useState } from "react";
import { Link } from "react-router-dom";
import { useCategories, useComplaints } from "../lib/queries";
import { getCategoryLabel, formatDate, type ComplaintStatus } from "../lib/api";
import { COMPLAINT_STATUSES, getStatusLabel } from "../lib/status";
import { ComplaintStatusControl } from "../components/ComplaintStatusControl";
import { COPY } from "../lib/validators";

export function ComplaintsListPage() {
  const { categories } = useCategories();
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [search, setSearch] = useState("");
  const filters = {
    status: statusFilter || undefined,
    search: search || undefined,
  };
  const { complaints, isLoading, error } = useComplaints(filters);

  return (
    <section className="card">
      <h1>{COPY.complaintsPageTitle}</h1>

      <div className="complaint-filters">
        <label htmlFor="status-filter">{COPY.statusFilterLabel}</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as ComplaintStatus | "")
          }
        >
          <option value="">{COPY.allStatusesOption}</option>
          {COMPLAINT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>

        <label htmlFor="complaint-search">{COPY.searchLabel}</label>
        <input
          id="complaint-search"
          type="search"
          value={search}
          placeholder={COPY.searchPlaceholder}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? <p>Loading complaints...</p> : null}

      {error ? (
        <p role="alert" className="banner error">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && complaints.length === 0 ? (
        <p>{COPY.complaintsEmpty}</p>
      ) : null}

      {!isLoading && !error && complaints.length > 0 ? (
        <ul className="complaint-list">
          {complaints.map((complaint) => (
            <li key={complaint.id} className="complaint-item">
              <div className="complaint-meta">
                <strong>{complaint.name}</strong>
                <span>{complaint.email}</span>
                <span>{getCategoryLabel(categories, complaint.category)}</span>
                <ComplaintStatusControl
                  complaintId={complaint.id}
                  currentStatus={complaint.status}
                />
                <span>{formatDate(complaint.created_at)}</span>
              </div>
              <p>{complaint.message}</p>
              <Link to={`/complaints/${complaint.id}`}>{COPY.viewDetailsLink}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
