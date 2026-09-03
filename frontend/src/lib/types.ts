export type Role = "ADMIN" | "AGENT" | "ACCOUNTANT";
export type PlotStatus = "AVAILABLE" | "RESERVED" | "SOLD";
export type SaleStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";
export type InstallmentType = "DOWN_PAYMENT" | "INSTALLMENT";
export type InstallmentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type InstallmentFrequency = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  description: string | null;
  createdAt: string;
  _count?: { plots: number };
}

export interface Plot {
  id: string;
  projectId: string;
  plotNumber: string;
  block: string | null;
  sizeValue: string;
  sizeUnit: string;
  ratePerUnit: string;
  totalPrice: string;
  status: PlotStatus;
  project?: Project;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cnic: string | null;
  address: string | null;
  createdAt: string;
  sales?: Sale[];
}

export interface Payment {
  id: string;
  installmentId: string;
  amount: string;
  paymentDate: string;
  method: PaymentMethod;
  receiptNumber: string | null;
  notes: string | null;
  recordedBy?: { id: string; name: string };
}

export interface Installment {
  id: string;
  saleId: string;
  type: InstallmentType;
  sequence: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  status: InstallmentStatus;
  payments?: Payment[];
}

export interface Sale {
  id: string;
  plotId: string;
  customerId: string;
  agentId: string;
  totalPrice: string;
  downPayment: string;
  numberOfInstallments: number;
  installmentFrequency: InstallmentFrequency;
  startDate: string;
  status: SaleStatus;
  notes: string | null;
  createdAt: string;
  plot?: Plot;
  customer?: Customer;
  agent?: { id: string; name: string };
  installments?: Installment[];
}

export interface ScheduleRow {
  type: InstallmentType;
  sequence: number;
  dueDate: string;
  amountDue: string;
}

export interface DashboardSummary {
  plotsByStatus: { status: PlotStatus; count: number }[];
  salesByStatus: { status: SaleStatus; count: number }[];
  totalCollected: string;
  totalOutstanding: string;
  overdueCount: number;
  overdueAmount: string;
  collectionsByMonth: { month: string; amount: string }[];
}
