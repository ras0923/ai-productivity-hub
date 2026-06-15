import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { AIDisclaimer } from "@/components/ai-disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bumpCounter } from "@/hooks/use-local-counter";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — AI Workplace" },
      { name: "description", content: "Conversational AI workplace productivity assistant." },
      { property: "og:title", content: "AI Workplace Chatbot" },
      { property: "og:description", content: "Conversational AI workplace productivity assistant." },
    ],
  }),
  component: ChatPage,
});

const STORAGE_KEY = "aiwp:chat";

function ChatPage() {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;

  const initial = (() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    messages: initial,
    onError: (err) => toast.error(err.message || "Chat error"),
    onFinish: () => bumpCounter("chats"),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || isLoading) return;
    sendMessage({ text: value });
    if (inputRef.current) inputRef.current.value = "";
  };

  const clear = () => {
    setMessages([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Ask anything about work — time management, communication, planning, research.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4 shadow-sm"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-3 font-semibold">How can I help you today?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try: "Draft a follow-up to a missed meeting" or "Help me prioritize my week."
              </p>
            </div>
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{text || "…"}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Ask your workplace assistant…"
          disabled={isLoading}
          autoFocus
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <AIDisclaimer />
    </div>
  );
}
