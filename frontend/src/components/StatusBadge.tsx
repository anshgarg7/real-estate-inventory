import { Badge } from "@/components/ui/badge";

const variants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "secondary",
  ACTIVE: "success",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  PENDING: "outline",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variants[status] ?? "default"}>{status}</Badge>;
}
