import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { SalesPage } from "@/pages/SalesPage";
import { NewSalePage } from "@/pages/NewSalePage";
import { SaleDetailPage } from "@/pages/SaleDetailPage";
import { UsersPage } from "@/pages/UsersPage";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/sales/new" element={<NewSalePage />} />
                  <Route path="/sales/:id" element={<SaleDetailPage />} />
                  <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                    <Route path="/users" element={<UsersPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
