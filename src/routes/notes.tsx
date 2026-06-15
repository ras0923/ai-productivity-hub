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
import { bumpCounter } from "@/hooks/use-local-counter";
import { summarizeNotes } from "@/lib/ai.functions";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — AI Workplace" },
      { name: "description", content: "Summarize meeting notes into decisions and action items." },
      { property: "og:title", content: "Meeting Notes Summarizer" },
      { property: "og:description", content: "Summarize meeting notes into decisions and action items." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const fn = useServerFn(summarizeNotes);
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!notes.trim()) return toast.error("Paste your meeting notes first.");
    setLoading(true);
    try {
      const { text } = await fn({ data: { notes } });
      setOutput(text);
      bumpCounter("notes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPage
      title="Meeting Notes Summarizer"
      description="Paste raw meeting notes — get a summary, decisions, action items, and deadlines."
      input={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Meeting notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste the full meeting transcript or notes here…"
              className="min-h-64"
            />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Summarize Notes
          </Button>
        </div>
      }
      output={
        <OutputEditor value={output} onChange={setOutput} loading={loading} mode="markdown" />
      }
    />
  );
}
