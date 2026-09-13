import axios from "axios";
import type {
  Customer,
  DashboardSummary,
  Installment,
  InstallmentFrequency,
  PaymentMethod,
  Plot,
  PlotStatus,
  Project,
  Role,
  Sale,
  SaleStatus,
  ScheduleRow,
  User,
} from "./types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return "Something went wrong";
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; name: string; email: string; role: Role } }>("/auth/login", {
      email,
      password,
    }),
};

// --- Users ---
export const usersApi = {
  list: () => api.get<User[]>("/users"),
  create: (data: { name: string; email: string; password: string; role: Role }) =>
    api.post<User>("/users", data),
  update: (id: string, data: Partial<{ name: string; email: string; role: Role; isActive: boolean; password: string }>) =>
    api.patch<User>(`/users/${id}`, data),
};

// --- Projects ---
export const projectsApi = {
  list: () => api.get<Project[]>("/projects"),
  get: (id: string) => api.get<Project & { plots: Plot[] }>(`/projects/${id}`),
  create: (data: { name: string; location: string; description?: string }) =>
    api.post<Project>("/projects", data),
  update: (id: string, data: Partial<{ name: string; location: string; description: string }>) =>
    api.patch<Project>(`/projects/${id}`, data),
  remove: (id: string) => api.delete(`/projects/${id}`),
};

// --- Plots ---
export const plotsApi = {
  list: (filters?: { projectId?: string; status?: PlotStatus }) => api.get<Plot[]>("/plots", { params: filters }),
  get: (id: string) => api.get<Plot>(`/plots/${id}`),
  create: (data: {
    projectId: string;
    plotNumber: string;
    block?: string;
    sizeValue: number;
    sizeUnit?: string;
    ratePerUnit: number;
    totalPrice: number;
  }) => api.post<Plot>("/plots", data),
  update: (id: string, data: Partial<{ plotNumber: string; block: string; sizeValue: number; sizeUnit: string; ratePerUnit: number; totalPrice: number; status: PlotStatus }>) =>
    api.patch<Plot>(`/plots/${id}`, data),
  remove: (id: string) => api.delete(`/plots/${id}`),
};

// --- Customers ---
export const customersApi = {
  list: (search?: string) => api.get<Customer[]>("/customers", { params: { search } }),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: { name: string; phone: string; email?: string; cnic?: string; address?: string }) =>
    api.post<Customer>("/customers", data),
  update: (id: string, data: Partial<{ name: string; phone: string; email: string; cnic: string; address: string }>) =>
    api.patch<Customer>(`/customers/${id}`, data),
  remove: (id: string) => api.delete(`/customers/${id}`),
};

// --- Sales ---
export interface SaleTerms {
  totalPrice: number;
  downPayment: number;
  numberOfInstallments: number;
  installmentFrequency: InstallmentFrequency;
  startDate: string;
}

export interface CustomInstallmentInput {
  amountDue: number;
  dueDate: string;
}

export interface CreateSaleInput {
  plotId: string;
  customerId: string;
  agentId?: string;
  downPayment: number;
  startDate: string;
  notes?: string;
  // Auto-generated schedule (even split):
  totalPrice?: number;
  numberOfInstallments?: number;
  installmentFrequency?: InstallmentFrequency;
  // Or a fully custom, hand-entered schedule:
  customInstallments?: CustomInstallmentInput[];
}

export const salesApi = {
  list: (status?: SaleStatus) => api.get<Sale[]>("/sales", { params: { status } }),
  get: (id: string) => api.get<Sale>(`/sales/${id}`),
  preview: (terms: SaleTerms) => api.post<ScheduleRow[]>("/sales/preview", terms),
  create: (data: CreateSaleInput) => api.post<Sale>("/sales", data),
  cancel: (id: string) => api.post<Sale>(`/sales/${id}/cancel`),
};

// --- Installments ---
export const installmentsApi = {
  listForSale: (saleId: string) => api.get<Installment[]>(`/installments/sale/${saleId}`),
  listOverdue: () => api.get<(Installment & { sale: Sale })[]>("/installments/overdue"),
  update: (id: string, data: Partial<{ amountDue: number; dueDate: string }>) =>
    api.patch<Installment>(`/installments/${id}`, data),
  add: (saleId: string, data: { amountDue: number; dueDate: string }) =>
    api.post<Installment>(`/installments/sale/${saleId}`, data),
  remove: (id: string) => api.delete(`/installments/${id}`),
};

// --- Payments ---
export interface RecordPaymentResult {
  payment: { id: string; installmentId: string; amount: string };
  installments: Installment[];
  saleCompleted: boolean;
}

export const paymentsApi = {
  create: (data: { installmentId: string; amount: number; method: PaymentMethod; receiptNumber?: string; notes?: string }) =>
    api.post<RecordPaymentResult>("/payments", data),
};

// --- Dashboard ---
export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary"),
};
