import { useCategories, useComplaints } from "../lib/queries";
import { getCategoryLabel, formatDate } from "../lib/api";
import { COPY } from "../lib/validators";

export function ComplaintsListPage() {
  const { categories } = useCategories();
  const { complaints, isLoading, error } = useComplaints();

  return (
    <section className="card">
      <h1>{COPY.complaintsPageTitle}</h1>

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
                <span>{formatDate(complaint.created_at)}</span>
              </div>
              <p>{complaint.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
