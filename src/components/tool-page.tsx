import type { ReactNode } from "react";

import { AIDisclaimer } from "./ai-disclaimer";

interface ToolPageProps {
  title: string;
  description: string;
  input: ReactNode;
  output: ReactNode;
}

export function ToolPage({ title, description, input, output }: ToolPageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-sm">{input}</section>
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          {output}
          <AIDisclaimer />
        </section>
      </div>
    </div>
  );
}
