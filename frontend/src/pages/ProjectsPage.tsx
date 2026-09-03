import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
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
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="flex flex-col gap-1 p-5">
                  <h2 className="font-semibold">{p.name}</h2>
                  <p className="text-sm text-muted-foreground">{p.location}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{p._count?.plots ?? 0} plots</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
