import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { installmentsApi, paymentsApi, salesApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";
import type { Installment, PaymentMethod, Sale } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { show } = useToast();
  const [sale, setSale] = useState<Sale | null>(null);

  const [payTarget, setPayTarget] = useState<Installment | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<Installment | null>(null);
  const [editAmountDue, setEditAmountDue] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addAmountDue, setAddAmountDue] = useState("");
  const [addDueDate, setAddDueDate] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    if (!id) return;
    salesApi
      .get(id)
      .then((r) => setSale(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"));
  }

  useEffect(load, [id]);

  const canManageInstallments = user?.role === "ADMIN" || user?.role === "ACCOUNTANT";
  const canEditSchedule = canManageInstallments && sale?.status === "ACTIVE";
  const canCancel = (user?.role === "ADMIN" || user?.role === "AGENT") && sale?.status === "ACTIVE";

  const totalAllocated = sale?.installments?.reduce((sum, i) => sum + Number(i.amountDue), 0) ?? 0;
  const remainingToAllocate = sale ? Number(sale.totalPrice) - totalAllocated : 0;

  function openPayDialog(installment: Installment) {
    setPayTarget(installment);
    setAmount((Number(installment.amountDue) - Number(installment.amountPaid)).toString());
    setMethod("CASH");
    setReceiptNumber("");
    setPayError(null);
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    if (!payTarget) return;
    setPayError(null);
    setPaySubmitting(true);
    try {
      const result = await paymentsApi.create({
        installmentId: payTarget.id,
        amount: Number(amount),
        method,
        receiptNumber: receiptNumber || undefined,
      });
      show(
        result.data.installments.length > 1
          ? `Payment recorded — reduced the amount due on ${result.data.installments.length - 1} upcoming installment(s)`
          : "Payment recorded"
      );
      setPayTarget(null);
      load();
    } catch (err) {
      setPayError(apiErrorMessage(err));
    } finally {
      setPaySubmitting(false);
    }
  }

  function openEditDialog(installment: Installment) {
    setEditTarget(installment);
    setEditAmountDue(installment.amountDue);
    setEditDueDate(toDateInputValue(installment.dueDate));
    setEditError(null);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      await installmentsApi.update(editTarget.id, {
        amountDue: Number(editAmountDue),
        dueDate: editDueDate,
      });
      show("Installment updated");
      setEditTarget(null);
      load();
    } catch (err) {
      setEditError(apiErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  function openAddDialog() {
    setAddAmountDue("");
    setAddDueDate("");
    setAddError(null);
    setAddOpen(true);
  }

  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setAddError(null);
    if (Number(addAmountDue) > remainingToAllocate) {
      setAddError(`Amount exceeds the remaining unallocated balance of ${formatCurrency(remainingToAllocate)}`);
      return;
    }
    setAddSubmitting(true);
    try {
      await installmentsApi.add(id, { amountDue: Number(addAmountDue), dueDate: addDueDate });
      show("Installment added");
      setAddOpen(false);
      load();
    } catch (err) {
      setAddError(apiErrorMessage(err));
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleRemove(installment: Installment) {
    if (!window.confirm(`Remove installment #${installment.sequence}?`)) return;
    setRemovingId(installment.id);
    try {
      await installmentsApi.remove(installment.id);
      show("Installment removed");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCancel() {
    if (!id || !window.confirm("Cancel this sale and release the plot?")) return;
    setCancelling(true);
    try {
      await salesApi.cancel(id);
      show("Sale cancelled");
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  }

  if (!sale) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/sales" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to sales
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {sale.plot?.plotNumber} · {sale.plot?.project?.name}
          </h1>
          <p className="text-sm text-muted-foreground">Sold to {sale.customer?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={sale.status} />
          {canCancel && (
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel Sale"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Price</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{formatCurrency(sale.totalPrice)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Down Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{formatCurrency(sale.downPayment)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agent</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{sale.agent?.name}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Start Date</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{formatDate(sale.startDate)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Installment Schedule</CardTitle>
          {canEditSchedule && (
            <Button size="sm" variant="outline" onClick={openAddDialog}>
              <Plus className="h-4 w-4" /> Add Installment
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                {canManageInstallments && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.installments?.map((i) => {
                const removable = canEditSchedule && i.type !== "DOWN_PAYMENT" && Number(i.amountPaid) === 0;
                return (
                  <TableRow key={i.id}>
                    <TableCell>{i.sequence}</TableCell>
                    <TableCell>{i.type === "DOWN_PAYMENT" ? "Down Payment" : "Installment"}</TableCell>
                    <TableCell>{formatDate(i.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(i.amountDue)}</TableCell>
                    <TableCell>{formatCurrency(i.amountPaid)}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    {canManageInstallments && (
                      <TableCell>
                        {i.status !== "PAID" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(i)} aria-label="Edit installment">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {removable && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemove(i)}
                                disabled={removingId === i.id}
                                aria-label="Remove installment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openPayDialog(i)}>
                              Record Payment
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Paying more than this installment's balance marks it paid in full and reduces what's owed on the
                next installment(s) by the difference.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="method">Method</Label>
              <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input id="receiptNumber" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
            </div>
            {payError && <p className="text-sm text-destructive">{payError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={paySubmitting}>
                {paySubmitting ? "Recording…" : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Installment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editAmountDue">Amount Due</Label>
              <Input
                id="editAmountDue"
                type="number"
                step="0.01"
                required
                value={editAmountDue}
                onChange={(e) => setEditAmountDue(e.target.value)}
              />
              {editTarget && Number(editTarget.amountPaid) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(editTarget.amountPaid)} already paid on this installment.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editDueDate">Due Date</Label>
              <Input id="editDueDate" type="date" required value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Installment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
              <span className="text-muted-foreground">Remaining unallocated</span>
              <span className={cn("font-medium", remainingToAllocate < 0 && "text-destructive")}>
                {formatCurrency(remainingToAllocate)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addAmountDue">Amount Due</Label>
              <Input
                id="addAmountDue"
                type="number"
                step="0.01"
                max={remainingToAllocate > 0 ? remainingToAllocate : undefined}
                required
                value={addAmountDue}
                onChange={(e) => setAddAmountDue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addDueDate">Due Date</Label>
              <Input id="addDueDate" type="date" required value={addDueDate} onChange={(e) => setAddDueDate(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Added to the end of the schedule (sequence {(sale.installments?.length ?? 1)}).
            </p>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? "Adding…" : "Add Installment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
