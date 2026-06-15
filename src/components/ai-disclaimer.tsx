import { Info } from "lucide-react";

export function AIDisclaimer() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>
        <strong className="font-medium text-foreground">Responsible AI Notice:</strong>{" "}
        AI-generated content may contain inaccuracies. Always review and verify outputs
        before using them for business decisions, communications, or professional purposes.
      </p>
    </div>
  );
}
