import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Building2, LayoutDashboard, LandPlot, Users, Receipt, UserCog, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects & Plots", icon: LandPlot },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/users", label: "Users", icon: UserCog, roles: ["ADMIN"] },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Estate Inventory</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems
            .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-1 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{user?.name}</div>
            <div>{user?.role}</div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Estate Inventory</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
