import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { usersApi, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const emptyForm = { name: "", email: "", password: "", role: "AGENT" as Role };

export function UsersPage() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    usersApi
      .list()
      .then((r) => setUsers(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await usersApi.create(form);
      show("User created");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(u: User) {
    try {
      await usersApi.update(u.id, { isActive: !u.isActive });
      load();
    } catch (err) {
      show(apiErrorMessage(err), "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Users</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Agent</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>
                <Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                  {u.isActive ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
