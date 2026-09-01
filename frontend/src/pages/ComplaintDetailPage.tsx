import { Link, useParams } from "react-router-dom";
import { ComplaintStatusControl } from "../components/ComplaintStatusControl";
import { useCategories, useComplaint } from "../lib/queries";
import { formatDate, getCategoryLabel } from "../lib/api";
import { COPY } from "../lib/validators";

export function ComplaintDetailPage() {
  const { id } = useParams();
  const complaintId = Number(id);
  const { categories } = useCategories();
  const { complaint, isLoading, error } = useComplaint(complaintId);

  return (
    <section className="card">
      <p>
        <Link to="/complaints">{COPY.backToList}</Link>
      </p>
      <h1>{COPY.complaintDetailTitle}</h1>

      {isLoading ? <p>Loading complaint...</p> : null}

      {error ? (
        <p role="alert" className="banner error">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && complaint ? (
        <article className="complaint-detail">
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
        </article>
      ) : null}
    </section>
  );
}
