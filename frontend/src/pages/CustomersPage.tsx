import { useEffect, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { customersApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";
import type { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const emptyForm = { name: "", phone: "", email: "", cnic: "", address: "" };

export function CustomersPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";

  function load(q?: string) {
    customersApi
      .list(q || undefined)
      .then((r) => setCustomers(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"));
  }

  useEffect(() => load(), []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await customersApi.create({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        cnic: form.cnic || undefined,
        address: form.address || undefined,
      });
      show("Customer added");
      setOpen(false);
      setForm(emptyForm);
      load(search);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Customers</h1>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input id="cnic" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding…" : "Add Customer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, phone, or CNIC…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CNIC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.cnic ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
