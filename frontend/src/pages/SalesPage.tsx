import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { salesApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";
import type { Sale } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function SalesPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesApi
      .list()
      .then((r) => setSales(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  const canCreate = user?.role === "ADMIN" || user?.role === "AGENT";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Sales</h1>
        {canCreate && (
          <Link to="/sales/new">
            <Button>
              <Plus className="h-4 w-4" /> New Sale
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plot</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link to={`/sales/${s.id}`} className="font-medium text-primary hover:underline">
                    {s.plot?.plotNumber} · {s.plot?.project?.name}
                  </Link>
                </TableCell>
                <TableCell>{s.customer?.name}</TableCell>
                <TableCell>{s.agent?.name}</TableCell>
                <TableCell>{formatCurrency(s.totalPrice)}</TableCell>
                <TableCell>{formatDate(s.startDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
