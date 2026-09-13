import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { customersApi, plotsApi, salesApi, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Customer, InstallmentFrequency, Plot, ScheduleRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);

type ScheduleMode = "auto" | "custom";

interface CustomRow {
  amountDue: string;
  dueDate: string;
}

const emptyCustomRow: CustomRow = { amountDue: "", dueDate: "" };

export function NewSalePage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams] = useSearchParams();
  const resalePlotId = searchParams.get("plotId");
  const [plots, setPlots] = useState<Plot[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [plotId, setPlotId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [notes, setNotes] = useState("");

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("auto");

  // Auto mode
  const [totalPrice, setTotalPrice] = useState("");
  const [numberOfInstallments, setNumberOfInstallments] = useState("12");
  const [installmentFrequency, setInstallmentFrequency] = useState<InstallmentFrequency>("MONTHLY");
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Custom mode
  const [customRows, setCustomRows] = useState<CustomRow[]>([{ ...emptyCustomRow }]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (resalePlotId) {
      plotsApi.get(resalePlotId).then((r) => {
        setPlots([r.data]);
        setPlotId(r.data.id);
      });
    } else {
      plotsApi.list({ status: "AVAILABLE" }).then((r) => setPlots(r.data));
    }
    customersApi.list().then((r) => setCustomers(r.data));
  }, [resalePlotId]);

  useEffect(() => {
    const plot = plots.find((p) => p.id === plotId);
    if (plot) setTotalPrice(plot.totalPrice);
  }, [plotId, plots]);

  const isResale = !!resalePlotId && plots.some((p) => p.id === resalePlotId && p.status === "SOLD");

  useEffect(() => {
    if (scheduleMode !== "auto") return;
    const total = Number(totalPrice);
    const down = Number(downPayment);
    const count = Number(numberOfInstallments);
    if (!total || count < 1 || down < 0 || down > total) {
      setSchedule([]);
      return;
    }
    const t = setTimeout(() => {
      salesApi
        .preview({ totalPrice: total, downPayment: down, numberOfInstallments: count, installmentFrequency, startDate })
        .then((r) => {
          setSchedule(r.data);
          setPreviewError(null);
        })
        .catch((err) => setPreviewError(apiErrorMessage(err)));
    }, 300);
    return () => clearTimeout(t);
  }, [scheduleMode, totalPrice, downPayment, numberOfInstallments, installmentFrequency, startDate]);

  const selectedPlot = plots.find((p) => p.id === plotId);

  const customRowsValid =
    customRows.length > 0 && customRows.every((r) => Number(r.amountDue) > 0 && r.dueDate);
  const customTotal = customRows.reduce((sum, r) => sum + (Number(r.amountDue) || 0), 0) + (Number(downPayment) || 0);

  function updateCustomRow(index: number, patch: Partial<CustomRow>) {
    setCustomRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addCustomRow() {
    setCustomRows((rows) => [...rows, { ...emptyCustomRow }]);
  }

  function removeCustomRow(index: number) {
    setCustomRows((rows) => rows.filter((_, i) => i !== index));
  }

  const canSubmit =
    !!plotId &&
    !!customerId &&
    downPayment !== "" &&
    (scheduleMode === "auto" ? !!totalPrice && !!numberOfInstallments : customRowsValid);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const sale = await salesApi.create(
        scheduleMode === "auto"
          ? {
              plotId,
              customerId,
              downPayment: Number(downPayment),
              startDate,
              notes: notes || undefined,
              totalPrice: Number(totalPrice),
              numberOfInstallments: Number(numberOfInstallments),
              installmentFrequency,
            }
          : {
              plotId,
              customerId,
              downPayment: Number(downPayment),
              startDate,
              notes: notes || undefined,
              customInstallments: customRows.map((r) => ({ amountDue: Number(r.amountDue), dueDate: r.dueDate })),
            }
      );
      show("Sale created");
      navigate(`/sales/${sale.data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/sales" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to sales
      </Link>
      <h1 className="text-xl font-semibold">{isResale ? "Resell Plot" : "New Sale"}</h1>
      {isResale && (
        <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
          This plot was already sold and fully paid off. Creating a new sale here records a resale to a new
          party — the previous sale stays in the plot's history.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sale Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plot">Plot</Label>
                <Select
                  id="plot"
                  required
                  disabled={isResale}
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                >
                  <option value="" disabled>
                    Select an available plot
                  </option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.plotNumber} · {p.project?.name} · {formatCurrency(p.totalPrice)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer">Customer</Label>
                <Select id="customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="" disabled>
                    Select a customer
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Installment Schedule</Label>
                <div className="inline-flex w-fit rounded-md border border-border p-0.5">
                  {(["auto", "custom"] as ScheduleMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setScheduleMode(mode)}
                      className={cn(
                        "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                        scheduleMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === "auto" ? "Auto-generate" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="downPayment">Down Payment</Label>
                  <Input
                    id="downPayment"
                    type="number"
                    step="0.01"
                    required
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startDate">{scheduleMode === "auto" ? "Start Date" : "Down Payment Date"}</Label>
                  <Input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                {scheduleMode === "auto" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="totalPrice">Total Price</Label>
                      <Input
                        id="totalPrice"
                        type="number"
                        step="0.01"
                        required
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="numberOfInstallments"># of Installments</Label>
                      <Input
                        id="numberOfInstallments"
                        type="number"
                        min={1}
                        required
                        value={numberOfInstallments}
                        onChange={(e) => setNumberOfInstallments(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        id="frequency"
                        value={installmentFrequency}
                        onChange={(e) => setInstallmentFrequency(e.target.value as InstallmentFrequency)}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="YEARLY">Yearly</option>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {scheduleMode === "custom" && selectedPlot && (
                <p className="text-sm text-muted-foreground">
                  Listed plot price: {formatCurrency(selectedPlot.totalPrice)}
                  {Number(selectedPlot.totalPrice) !== customTotal && (
                    <span className="text-amber-600"> — differs from your schedule total below</span>
                  )}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting || !canSubmit}>
                {submitting ? "Creating…" : isResale ? "Record Resale" : "Create Sale"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{scheduleMode === "auto" ? "Installment Schedule Preview" : "Custom Installment Schedule"}</CardTitle>
          </CardHeader>
          <CardContent className={scheduleMode === "auto" ? "p-0" : undefined}>
            {scheduleMode === "auto" ? (
              <>
                {previewError && <p className="p-4 text-sm text-destructive">{previewError}</p>}
                {schedule.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Fill in the terms to preview the schedule.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((row) => (
                        <TableRow key={row.sequence}>
                          <TableCell>{row.sequence}</TableCell>
                          <TableCell>{row.type === "DOWN_PAYMENT" ? "Down Payment" : "Installment"}</TableCell>
                          <TableCell>{formatDate(row.dueDate)}</TableCell>
                          <TableCell>{formatCurrency(row.amountDue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                  <span className="text-muted-foreground">0 · Down Payment</span>
                  <span className="font-medium">{formatCurrency(Number(downPayment) || 0)}</span>
                </div>
                {customRows.map((row, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor={`custom-amount-${i}`}>{i + 1} · Amount</Label>
                      <Input
                        id={`custom-amount-${i}`}
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={row.amountDue}
                        onChange={(e) => updateCustomRow(i, { amountDue: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor={`custom-date-${i}`}>Due Date</Label>
                      <Input
                        id={`custom-date-${i}`}
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => updateCustomRow(i, { dueDate: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={customRows.length === 1}
                      onClick={() => removeCustomRow(i)}
                      aria-label="Remove installment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addCustomRow}>
                  <Plus className="h-4 w-4" /> Add Installment
                </Button>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(customTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
