import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApi, installmentsApi, apiErrorMessage } from "@/lib/api";
import type { DashboardSummary, Installment, Sale } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [overdue, setOverdue] = useState<(Installment & { sale: Sale })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([dashboardApi.summary(), installmentsApi.listOverdue()])
      .then(([s, o]) => {
        setSummary(s.data);
        setOverdue(o.data);
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!summary) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const plotCount = (status: string) => summary.plotsByStatus.find((p) => p.status === status)?.count ?? 0;
  const saleCount = (status: string) => summary.salesByStatus.find((s) => s.status === status)?.count ?? 0;

  const chartData = summary.collectionsByMonth.map((c) => ({ month: c.month, amount: Number(c.amount) }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Available Plots</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{plotCount("AVAILABLE")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reserved Plots</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{plotCount("RESERVED")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sold Plots</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{plotCount("SOLD")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{saleCount("ACTIVE")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Collected</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.totalCollected)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.totalOutstanding)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue Installments</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">{summary.overdueCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {formatCurrency(summary.overdueAmount)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collections by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Installments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overdue.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing overdue. Nice work.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.sale.customer?.name}</TableCell>
                    <TableCell>
                      <Link to={`/sales/${i.sale.id}`} className="text-primary hover:underline">
                        {i.sale.plot?.plotNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(i.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(Number(i.amountDue) - Number(i.amountPaid))}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
