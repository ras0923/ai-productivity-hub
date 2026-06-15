import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { OutputEditor } from "@/components/output-editor";
import { ToolPage } from "@/components/tool-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bumpCounter } from "@/hooks/use-local-counter";
import { researchTopic } from "@/lib/ai.functions";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — AI Workplace" },
      { name: "description", content: "Get structured briefings on any topic." },
      { property: "og:title", content: "AI Research Assistant" },
      { property: "og:description", content: "Get structured briefings on any topic." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error("Enter a research topic.");
    setLoading(true);
    try {
      const { text } = await fn({
        data: { topic, sourceText: sourceText.trim() || undefined },
      });
      setOutput(text);
      bumpCounter("research");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to research");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPage
      title="AI Research Assistant"
      description="Enter a topic — optionally paste a source article — and get a structured briefing."
      input={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI adoption in mid-market SaaS"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Source material (optional)</Label>
            <Textarea
              id="source"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste an article or notes for the AI to ground its briefing in."
              className="min-h-40"
            />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Briefing
          </Button>
        </div>
      }
      output={
        <OutputEditor value={output} onChange={setOutput} loading={loading} mode="markdown" />
      }
    />
  );
}
