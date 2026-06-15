import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AIDisclaimer } from "@/components/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { bumpCounter } from "@/hooks/use-local-counter";
import { planTasks, type PlannedTask } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace" },
      {
        name: "description",
        content:
          "Turn your workload into a clean, color-coded, sortable task table.",
      },
      { property: "og:title", content: "AI Task Planner" },
      {
        property: "og:description",
        content:
          "Turn your workload into a clean, color-coded, sortable task table.",
      },
    ],
  }),
  component: PlannerPage,
});

type Priority = PlannedTask["priority"];
type Status = PlannedTask["status"];
type Row = PlannedTask & { id: string };

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const STATUSES: Status[] = [
  "Not Started",
  "In Progress",
  "Pending Review",
  "Completed",
];

const priorityRank: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
const statusRank: Record<Status, number> = {
  "Not Started": 0,
  "In Progress": 1,
  "Pending Review": 2,
  Completed: 3,
};

const priorityClasses: Record<Priority, string> = {
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
};

const statusClasses: Record<Status, string> = {
  "Not Started":
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "In Progress":
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  "Pending Review":
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300",
  Completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
};

type SortKey = "priority" | "status" | "dueDate" | null;
type SortDir = "asc" | "desc";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [scope, setScope] = useState<"Daily" | "Weekly">("Daily");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const generate = async () => {
    if (!tasks.trim()) return toast.error("List a few tasks first.");
    setLoading(true);
    try {
      const result = await fn({ data: { tasks, scope } });
      setRows(result.tasks.map((t) => ({ ...t, id: uid() })));
      bumpCounter("plans");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const deleteRow = (id: string) =>
    setRows((rs) => rs.filter((r) => r.id !== id));

  const addRow = () =>
    setRows((rs) => [
      ...rs,
      {
        id: uid(),
        task: "New task",
        description: "",
        priority: "Medium",
        status: "Not Started",
        dueDate: "",
        notes: "",
      },
    ]);

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const visibleRows = useMemo(() => {
    let out = rows.filter(
      (r) =>
        (priorityFilter === "All" || r.priority === priorityFilter) &&
        (statusFilter === "All" || r.status === statusFilter),
    );
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        if (sortKey === "priority")
          return (priorityRank[a.priority] - priorityRank[b.priority]) * dir;
        if (sortKey === "status")
          return (statusRank[a.status] - statusRank[b.status]) * dir;
        return a.dueDate.localeCompare(b.dueDate) * dir;
      });
    }
    return out;
  }, [rows, priorityFilter, statusFilter, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: Exclude<SortKey, null> }) => {
    if (sortKey !== k)
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          AI Task Planner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          List your work and get a clean, color-coded, editable task table.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="space-y-1.5">
            <Label htmlFor="tasks">Tasks or project brief</Label>
            <Textarea
              id="tasks"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder={"Finish Q3 deck\nReview design PR\nCall client about renewal"}
              className="min-h-32"
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Plan scope</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Build Schedule
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Task plan</h2>
            <p className="text-xs text-muted-foreground">
              {rows.length === 0
                ? "Your generated tasks will appear here."
                : `${visibleRows.length} of ${rows.length} tasks shown`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as Priority | "All")}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as Status | "All")}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={addRow} disabled={loading}>
              <Plus className="mr-1 h-4 w-4" /> Add task
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="grid place-items-center px-4 py-16 text-sm text-muted-foreground">
            {loading ? "Generating your plan…" : "No tasks yet — build a schedule to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[200px] px-4 py-3">Task</TableHead>
                  <TableHead className="px-4 py-3">Description</TableHead>
                  <TableHead
                    className="w-[130px] cursor-pointer select-none px-4 py-3"
                    onClick={() => toggleSort("priority")}
                  >
                    Priority
                    <SortIcon k="priority" />
                  </TableHead>
                  <TableHead
                    className="w-[160px] cursor-pointer select-none px-4 py-3"
                    onClick={() => toggleSort("status")}
                  >
                    Status
                    <SortIcon k="status" />
                  </TableHead>
                  <TableHead
                    className="w-[150px] cursor-pointer select-none px-4 py-3"
                    onClick={() => toggleSort("dueDate")}
                  >
                    Due Date
                    <SortIcon k="dueDate" />
                  </TableHead>
                  <TableHead className="w-[220px] px-4 py-3">Notes</TableHead>
                  <TableHead className="w-[52px] px-2 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((r, i) => (
                  <TableRow
                    key={r.id}
                    className={cn(
                      "align-top transition-colors",
                      i % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    <TableCell className="px-4 py-4">
                      <Input
                        value={r.task}
                        onChange={(e) => updateRow(r.id, { task: e.target.value })}
                        className="h-9 border-transparent bg-transparent px-2 font-medium hover:border-input focus:border-input"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Textarea
                        value={r.description}
                        onChange={(e) =>
                          updateRow(r.id, { description: e.target.value })
                        }
                        rows={2}
                        className="min-h-[40px] resize-none border-transparent bg-transparent px-2 py-1 text-sm hover:border-input focus:border-input"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Select
                        value={r.priority}
                        onValueChange={(v) =>
                          updateRow(r.id, { priority: v as Priority })
                        }
                      >
                        <SelectTrigger className="h-auto border-transparent bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 [&>svg]:hidden">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              priorityClasses[r.priority],
                            )}
                          >
                            {r.priority}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Select
                        value={r.status}
                        onValueChange={(v) =>
                          updateRow(r.id, { status: v as Status })
                        }
                      >
                        <SelectTrigger className="h-auto border-transparent bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 [&>svg]:hidden">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              statusClasses[r.status],
                            )}
                          >
                            {r.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Input
                        value={r.dueDate}
                        onChange={(e) =>
                          updateRow(r.id, { dueDate: e.target.value })
                        }
                        className="h-9 border-transparent bg-transparent px-2 text-sm hover:border-input focus:border-input"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Textarea
                        value={r.notes}
                        onChange={(e) =>
                          updateRow(r.id, { notes: e.target.value })
                        }
                        rows={2}
                        className="min-h-[40px] resize-none border-transparent bg-transparent px-2 py-1 text-sm hover:border-input focus:border-input"
                      />
                    </TableCell>
                    <TableCell className="px-2 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(r.id)}
                        aria-label="Delete task"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="border-t p-4">
          <AIDisclaimer />
        </div>
      </section>
    </div>
  );
}
