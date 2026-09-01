import { Link, NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { FeedbackForm } from "./components/FeedbackForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ComplaintsListPage } from "./pages/ComplaintsListPage";
import { LoginPage } from "./pages/LoginPage";
import { COPY } from "./lib/validators";

function AppShell() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Feedback Sandbox</p>
        <nav aria-label="Main">
          <NavLink to="/" end>
            {COPY.nav.feedback}
          </NavLink>
          {isAuthenticated ? (
            <NavLink to="/complaints">{COPY.nav.complaints}</NavLink>
          ) : null}
          {isAuthenticated ? (
            <button type="button" className="link-button" onClick={logout}>
              {COPY.nav.logout}
            </button>
          ) : (
            <NavLink to="/login">{COPY.nav.login}</NavLink>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<FeedbackForm />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <ComplaintsListPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        {isAuthenticated ? (
          <Link to="/complaints">{COPY.nav.complaints}</Link>
        ) : (
          <Link to="/login">{COPY.nav.login}</Link>
        )}
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <AppShell />
      </CategoriesProvider>
    </AuthProvider>
  );
}
