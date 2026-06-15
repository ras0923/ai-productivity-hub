import { Copy, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

interface OutputEditorProps {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
  placeholder?: string;
  mode?: "text" | "markdown";
}

export function OutputEditor({
  value,
  onChange,
  loading,
  placeholder = "Your AI output will appear here.",
  mode = "text",
}: OutputEditorProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Output</h2>
        <div className="flex gap-2">
          {mode === "markdown" && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Preview" : "Edit"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            disabled={!value}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      {loading && !value ? (
        <div className="grid h-64 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Generating…
        </div>
      ) : mode === "markdown" && !editing && value ? (
        <div className="prose prose-sm max-w-none rounded-lg border bg-background p-4">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-64 font-mono text-sm"
        />
      )}
    </div>
  );
}
