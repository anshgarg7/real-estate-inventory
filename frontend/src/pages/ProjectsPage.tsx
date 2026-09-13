import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { projectsApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ProjectsPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  function load() {
    setLoading(true);
    projectsApi
      .list()
      .then((r) => setProjects(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await projectsApi.create({ name, location, description: description || undefined });
      show("Project created");
      setOpen(false);
      setName("");
      setLocation("");
      setDescription("");
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(p: Project) {
    setEditing(p);
    setEditName(p.name);
    setEditLocation(p.location);
    setEditDescription(p.description ?? "");
    setEditError(null);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      await projectsApi.update(editing.id, {
        name: editName,
        location: editLocation,
        description: editDescription || undefined,
      });
      show("Project updated");
      setEditing(null);
      load();
    } catch (err) {
      setEditError(apiErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Projects</h1>
        {user?.role === "ADMIN" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
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
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative">
              <Link to={`/projects/${p.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="flex flex-col gap-1 p-5">
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="text-sm text-muted-foreground">{p.location}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{p._count?.plots ?? 0} plots</p>
                  </CardContent>
                </Card>
              </Link>
              {user?.role === "ADMIN" && (
                <button
                  type="button"
                  aria-label="Edit project"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEdit(p);
                  }}
                  className="absolute right-3 top-3 rounded-md border border-input bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" required value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" required value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
