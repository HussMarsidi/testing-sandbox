import type { ReactElement, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, Route, Routes, type MemoryRouterProps } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { createQueryClient } from "../../src/lib/query-client";
import { ComplaintDetailPage } from "../../src/pages/ComplaintDetailPage";
import { ComplaintsListPage } from "../../src/pages/ComplaintsListPage";
import { LoginPage } from "../../src/pages/LoginPage";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: MemoryRouterProps["initialEntries"];
}

function createWrapper(initialEntries: MemoryRouterProps["initialEntries"] = ["/"]) {
  const queryClient = createQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ["/"], ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: createWrapper(initialEntries),
    ...options,
  });
}

function complaintsRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <ComplaintsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute>
            <ComplaintDetailPage />
          </ProtectedRoute>
        }
      />
    </>
  );
}

export function renderProtectedComplaints(initialEntry = "/complaints") {
  return renderWithProviders(
    <AuthProvider>
      <Routes>{complaintsRoutes()}</Routes>
    </AuthProvider>,
    { initialEntries: [initialEntry] },
  );
}

export function renderLoginPage() {
  return renderWithProviders(
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </AuthProvider>,
    { initialEntries: ["/login"] },
  );
}
