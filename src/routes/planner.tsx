import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { OutputEditor } from "@/components/output-editor";
import { ToolPage } from "@/components/tool-page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bumpCounter } from "@/hooks/use-local-counter";
import { planTasks } from "@/lib/ai.functions";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace" },
      { name: "description", content: "Build a prioritized daily or weekly schedule with AI." },
      { property: "og:title", content: "AI Task Planner" },
      { property: "og:description", content: "Build a prioritized daily or weekly schedule with AI." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [scope, setScope] = useState<"Daily" | "Weekly">("Daily");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!tasks.trim()) return toast.error("List a few tasks first.");
    setLoading(true);
    try {
      const { text } = await fn({ data: { tasks, scope } });
      setOutput(text);
      bumpCounter("plans");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPage
      title="AI Task Planner"
      description="List your tasks and get a prioritized, time-blocked schedule."
      input={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tasks">Tasks (one per line)</Label>
            <Textarea
              id="tasks"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder={"Finish Q3 deck\nReview design PR\nCall client about renewal"}
              className="min-h-48"
            />
          </div>
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
      }
      output={
        <OutputEditor value={output} onChange={setOutput} loading={loading} mode="markdown" />
      }
    />
  );
}
