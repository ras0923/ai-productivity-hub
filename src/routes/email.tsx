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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bumpCounter } from "@/hooks/use-local-counter";
import { generateEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Workplace" },
      { name: "description", content: "Generate professional emails with AI." },
      { property: "og:title", content: "Smart Email Generator" },
      { property: "og:description", content: "Generate professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<"Formal" | "Friendly" | "Persuasive">("Formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!recipient.trim() || !purpose.trim()) {
      toast.error("Please add a recipient and purpose.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await fn({ data: { recipient, purpose, tone } });
      setOutput(text);
      bumpCounter("emails");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate";
      toast.error(msg.includes("402") ? "AI credits exhausted." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPage
      title="Smart Email Generator"
      description="Describe the email you need, pick a tone, and let AI draft it."
      input={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. Marketing team, John from Acme Inc."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purpose">Email purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe what the email should accomplish…"
              className="min-h-32"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Email
          </Button>
        </div>
      }
      output={<OutputEditor value={output} onChange={setOutput} loading={loading} />}
    />
  );
}
