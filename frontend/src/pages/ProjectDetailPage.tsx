import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, History, ArrowRightLeft } from "lucide-react";
import { plotsApi, projectsApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";
import type { Plot, Project } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_LAND_UNIT, LAND_UNITS } from "@/lib/landUnits";
import { PLOT_FEATURES } from "@/lib/plotFeatures";

interface PlotForm {
  plotNumber: string;
  block: string;
  sizeValue: string;
  sizeUnit: string;
  ratePerUnit: string;
}

const emptyForm: PlotForm = { plotNumber: "", block: "", sizeValue: "", sizeUnit: DEFAULT_LAND_UNIT, ratePerUnit: "" };

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useToast();
  const [project, setProject] = useState<(Project & { plots: Plot[] }) | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PlotForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectLocation, setEditProjectLocation] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectError, setEditProjectError] = useState<string | null>(null);
  const [editProjectSubmitting, setEditProjectSubmitting] = useState(false);

  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [editPlotForm, setEditPlotForm] = useState<PlotForm>(emptyForm);
  const [editPlotError, setEditPlotError] = useState<string | null>(null);
  const [editPlotSubmitting, setEditPlotSubmitting] = useState(false);

  const [historyPlot, setHistoryPlot] = useState<Plot | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  function load() {
    if (!id) return;
    projectsApi
      .get(id)
      .then((r) => setProject(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"));
  }

  useEffect(load, [id]);

  const totalPrice = (Number(form.sizeValue) || 0) * (Number(form.ratePerUnit) || 0);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await plotsApi.create({
        projectId: id,
        plotNumber: form.plotNumber,
        block: form.block || undefined,
        sizeValue: Number(form.sizeValue),
        sizeUnit: form.sizeUnit || undefined,
        ratePerUnit: Number(form.ratePerUnit),
        totalPrice,
      });
      show("Plot added");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openEditProject() {
    if (!project) return;
    setEditProjectName(project.name);
    setEditProjectLocation(project.location);
    setEditProjectDescription(project.description ?? "");
    setEditProjectError(null);
    setEditProjectOpen(true);
  }

  async function handleEditProject(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setEditProjectError(null);
    setEditProjectSubmitting(true);
    try {
      await projectsApi.update(id, {
        name: editProjectName,
        location: editProjectLocation,
        description: editProjectDescription || undefined,
      });
      show("Project updated");
      setEditProjectOpen(false);
      load();
    } catch (err) {
      setEditProjectError(apiErrorMessage(err));
    } finally {
      setEditProjectSubmitting(false);
    }
  }

  function openEditPlot(plot: Plot) {
    setEditingPlot(plot);
    setEditPlotForm({
      plotNumber: plot.plotNumber,
      block: plot.block ?? "",
      sizeValue: plot.sizeValue,
      sizeUnit: plot.sizeUnit,
      ratePerUnit: plot.ratePerUnit,
    });
    setEditPlotError(null);
  }

  const editPlotTotalPrice = (Number(editPlotForm.sizeValue) || 0) * (Number(editPlotForm.ratePerUnit) || 0);

  async function handleEditPlot(e: FormEvent) {
    e.preventDefault();
    if (!editingPlot) return;
    setEditPlotError(null);
    setEditPlotSubmitting(true);
    try {
      await plotsApi.update(editingPlot.id, {
        plotNumber: editPlotForm.plotNumber,
        block: editPlotForm.block || undefined,
        sizeValue: Number(editPlotForm.sizeValue),
        sizeUnit: editPlotForm.sizeUnit || undefined,
        ratePerUnit: Number(editPlotForm.ratePerUnit),
        totalPrice: editPlotTotalPrice,
      });
      show("Plot updated");
      setEditingPlot(null);
      load();
    } catch (err) {
      setEditPlotError(apiErrorMessage(err));
    } finally {
      setEditPlotSubmitting(false);
    }
  }

  function openHistory(plot: Plot) {
    setHistoryPlot(plot);
    setHistoryLoading(true);
    plotsApi
      .get(plot.id)
      .then((r) => setHistoryPlot(r.data))
      .catch((err) => show(apiErrorMessage(err), "error"))
      .finally(() => setHistoryLoading(false));
  }

  if (!project) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/projects" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            {user?.role === "ADMIN" && (
              <button
                type="button"
                aria-label="Edit project"
                onClick={openEditProject}
                className="rounded-md border border-input bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{project.location}</p>
        </div>
        {user?.role === "ADMIN" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Add Plot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Plot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plotNumber">Plot Number</Label>
                    <Input
                      id="plotNumber"
                      required
                      value={form.plotNumber}
                      onChange={(e) => setForm({ ...form, plotNumber: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="block">Block</Label>
                    <Select id="block" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}>
                      <option value="">—</option>
                      {PLOT_FEATURES.map((feature) => (
                        <option key={feature} value={feature}>
                          {feature}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sizeValue">Size</Label>
                    <Input
                      id="sizeValue"
                      type="number"
                      step="0.01"
                      required
                      value={form.sizeValue}
                      onChange={(e) => setForm({ ...form, sizeValue: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sizeUnit">Unit</Label>
                    <Select id="sizeUnit" value={form.sizeUnit} onChange={(e) => setForm({ ...form, sizeUnit: e.target.value })}>
                      {LAND_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="ratePerUnit">Rate per Unit</Label>
                    <Input
                      id="ratePerUnit"
                      type="number"
                      step="0.01"
                      required
                      value={form.ratePerUnit}
                      onChange={(e) => setForm({ ...form, ratePerUnit: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total price: <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
                </p>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding…" : "Add Plot"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {project.plots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plots in this project yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plot #</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.plots.map((plot) => (
              <TableRow key={plot.id}>
                <TableCell className="font-medium">{plot.plotNumber}</TableCell>
                <TableCell>{plot.block ?? "—"}</TableCell>
                <TableCell>
                  {plot.sizeValue} {plot.sizeUnit}
                </TableCell>
                <TableCell>{formatCurrency(plot.ratePerUnit)}</TableCell>
                <TableCell>{formatCurrency(plot.totalPrice)}</TableCell>
                <TableCell>
                  <StatusBadge status={plot.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Sale history"
                      onClick={() => openHistory(plot)}
                      className="rounded-md border border-input bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>
                    {plot.status === "SOLD" && (user?.role === "ADMIN" || user?.role === "AGENT") && (
                      <button
                        type="button"
                        aria-label="Resell plot"
                        onClick={() => navigate(`/sales/new?plotId=${plot.id}`)}
                        className="rounded-md border border-input bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {user?.role === "ADMIN" && (
                      <button
                        type="button"
                        aria-label="Edit plot"
                        onClick={() => openEditPlot(plot)}
                        className="rounded-md border border-input bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProject} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-project-name">Name</Label>
              <Input
                id="edit-project-name"
                required
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-project-location">Location</Label>
              <Input
                id="edit-project-location"
                required
                value={editProjectLocation}
                onChange={(e) => setEditProjectLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-project-description">Description</Label>
              <Input
                id="edit-project-description"
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
              />
            </div>
            {editProjectError && <p className="text-sm text-destructive">{editProjectError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={editProjectSubmitting}>
                {editProjectSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyPlot} onOpenChange={(v) => !v && setHistoryPlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale History{historyPlot ? ` — ${historyPlot.plotNumber}` : ""}</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !historyPlot?.sales || historyPlot.sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">This plot has never been sold.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {historyPlot.sales.map((sale) => (
                <Link
                  key={sale.id}
                  to={`/sales/${sale.id}`}
                  className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm transition-colors hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{sale.customer?.name}</span>
                    <StatusBadge status={sale.status} />
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{formatDate(sale.startDate)}</span>
                    <span>{formatCurrency(sale.totalPrice)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPlot} onOpenChange={(v) => !v && setEditingPlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPlot} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-plotNumber">Plot Number</Label>
                <Input
                  id="edit-plotNumber"
                  required
                  value={editPlotForm.plotNumber}
                  onChange={(e) => setEditPlotForm({ ...editPlotForm, plotNumber: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-block">Block</Label>
                <Select
                  id="edit-block"
                  value={editPlotForm.block}
                  onChange={(e) => setEditPlotForm({ ...editPlotForm, block: e.target.value })}
                >
                  <option value="">—</option>
                  {PLOT_FEATURES.map((feature) => (
                    <option key={feature} value={feature}>
                      {feature}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-sizeValue">Size</Label>
                <Input
                  id="edit-sizeValue"
                  type="number"
                  step="0.01"
                  required
                  value={editPlotForm.sizeValue}
                  onChange={(e) => setEditPlotForm({ ...editPlotForm, sizeValue: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-sizeUnit">Unit</Label>
                <Select
                  id="edit-sizeUnit"
                  value={editPlotForm.sizeUnit}
                  onChange={(e) => setEditPlotForm({ ...editPlotForm, sizeUnit: e.target.value })}
                >
                  {LAND_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="edit-ratePerUnit">Rate per Unit</Label>
                <Input
                  id="edit-ratePerUnit"
                  type="number"
                  step="0.01"
                  required
                  value={editPlotForm.ratePerUnit}
                  onChange={(e) => setEditPlotForm({ ...editPlotForm, ratePerUnit: e.target.value })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Total price: <span className="font-medium text-foreground">{formatCurrency(editPlotTotalPrice)}</span>
            </p>
            {editPlotError && <p className="text-sm text-destructive">{editPlotError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={editPlotSubmitting}>
                {editPlotSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
