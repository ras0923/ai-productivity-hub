import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  ClipboardList,
  Calendar,
  Search,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { useCounters } from "@/hooks/use-local-counter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity" },
      {
        name: "description",
        content:
          "Generate emails, summarize meetings, plan tasks, research topics, and chat with an AI workplace assistant.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Automate workplace tasks with AI from a single dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    title: "Smart Email Generator",
    description: "Draft professional emails in seconds.",
    href: "/email",
    icon: Mail,
    counterKey: "emails" as const,
    counterLabel: "Emails generated",
  },
  {
    title: "Meeting Notes Summarizer",
    description: "Turn raw notes into decisions and action items.",
    href: "/notes",
    icon: ClipboardList,
    counterKey: "notes" as const,
    counterLabel: "Notes summarized",
  },
  {
    title: "AI Task Planner",
    description: "Build a prioritized daily or weekly schedule.",
    href: "/planner",
    icon: Calendar,
    counterKey: "plans" as const,
    counterLabel: "Plans created",
  },
  {
    title: "AI Research Assistant",
    description: "Get structured briefings on any topic.",
    href: "/research",
    icon: Search,
    counterKey: "research" as const,
    counterLabel: "Research briefs",
  },
  {
    title: "AI Chatbot",
    description: "Conversational help for any workplace question.",
    href: "/chatbot",
    icon: MessageSquare,
    counterKey: "chats" as const,
    counterLabel: "Conversations",
  },
];

function Dashboard() {
  const counters = useCounters();

  const stats: { label: string; value: number; icon: typeof Mail }[] = [
    { label: "Emails generated", value: counters.emails, icon: Mail },
    { label: "Notes summarized", value: counters.notes, icon: ClipboardList },
    { label: "Plans created", value: counters.plans, icon: Calendar },
    { label: "Research briefs", value: counters.research, icon: Search },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-sm font-medium opacity-90">
          <Sparkles className="h-4 w-4" />
          Welcome back
        </div>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Your AI workplace, in one place.
        </h1>
        <p className="mt-2 max-w-xl text-sm opacity-90 sm:text-base">
          Generate emails, summarize meetings, plan tasks, run research, and chat with
          your AI assistant — all from a single dashboard.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your activity
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tools
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              to={t.href}
              className="group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{t.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
              <p className="mt-3 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                Open →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
