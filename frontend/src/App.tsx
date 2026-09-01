import { Link, NavLink, Route, Routes } from "react-router-dom";
import { FeedbackForm } from "./components/FeedbackForm";
import { ComplaintsListPage } from "./pages/ComplaintsListPage";
import { COPY } from "./lib/validators";

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Feedback Sandbox</p>
        <nav aria-label="Main">
          <NavLink to="/" end>
            {COPY.nav.feedback}
          </NavLink>
          <NavLink to="/complaints">{COPY.nav.complaints}</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<FeedbackForm />} />
          <Route path="/complaints" element={<ComplaintsListPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <Link to="/complaints">{COPY.nav.complaints}</Link>
      </footer>
    </div>
  );
}
