import { useEffect, useState } from "react";
import { fetchComplaints, formatCategory, formatDate } from "../lib/api";
import type { Complaint } from "../lib/api";
import { COPY } from "../lib/validators";

export function ComplaintsListPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComplaints() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchComplaints();
        if (!cancelled) {
          setComplaints(data);
        }
      } catch {
        if (!cancelled) {
          setError(COPY.complaintsLoadError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadComplaints();

    return () => {
      cancelled = true;
    };
  }, []);

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
                <span>{formatCategory(complaint.category)}</span>
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
