# AI Workplace Productivity Assistant — Plan

A no-login SaaS-style dashboard with sidebar nav and five AI tools, built on TanStack Start with Lovable AI Gateway. History persists in `localStorage` only.

## Routes (TanStack file-based)
- `/` Dashboard — stat cards + tool shortcuts
- `/email` Smart Email Generator
- `/notes` Meeting Notes Summarizer
- `/planner` AI Task Planner
- `/research` AI Research Assistant
- `/chatbot` AI Chatbot (streaming, threaded conversation in localStorage)

All routes share a layout in `__root.tsx` with a collapsible shadcn `Sidebar` (mobile = sheet/hamburger).

## Design
SaaS spec palette in `src/styles.css` (`@theme`):
- primary `#2563EB`, accent `#38BDF8`, sidebar `#0F172A`, bg `#F8FAFC`, text `#1E293B`
- Rounded cards, soft shadows, generous spacing, Inter font

## Shared UI pieces
- `AppSidebar` — Lucide icons (LayoutDashboard, Mail, ClipboardList, Calendar, Search, MessageSquare), active route highlighting via `useRouterState`
- `ToolPage` shell — title, description, input panel, editable output panel, copy button, "Save to history" (localStorage), `AIDisclaimer` footer
- `AIDisclaimer` — required at bottom of every AI output
- `OutputEditor` — editable `<Textarea>` bound to generated text
- `useLocalHistory(key)` hook — per-tool last N items

## AI backend
- `src/lib/ai-gateway.server.ts` — Lovable AI Gateway provider helper
- One-shot generations via `createServerFn` in `src/lib/ai.functions.ts`:
  - `generateEmail({ purpose, recipient, tone })`
  - `summarizeNotes({ notes })`
  - `planTasks({ tasks, scope })`
  - `researchTopic({ topic, sourceText? })`
- Streaming chat via server route `src/routes/api/chat.ts` + `useChat` from `@ai-sdk/react`
- Model: `google/gemini-3-flash-preview` (default)
- `LOVABLE_API_KEY` provisioned automatically; never exposed client-side
- Errors mapped to friendly toasts (429 rate limit, 402 credits)

## Per-tool specifics
1. **Email**: textarea (purpose), inputs (recipient), select (Formal/Friendly/Persuasive), generate → editable output with Subject + Body
2. **Meeting Notes**: large textarea → structured output (Summary / Key Decisions / Action Items / Deadlines), rendered as markdown
3. **Task Planner**: tasks textarea + Daily/Weekly toggle → time-blocked schedule
4. **Research**: topic input + optional article textarea → Exec Summary / Insights / Recommendations / Risks
5. **Chatbot**: full-height chat with streaming, `message.parts` rendering, markdown, thread stored in localStorage, clear-thread button

## Dashboard
4 stat cards (counts from localStorage: emails, plans, research, chats) + grid of tool entry cards with descriptions.

## Responsive
- Desktop: sidebar + main
- Tablet: collapsible icon sidebar
- Mobile: hamburger sheet, single-column, grid collapses to 1 col

## Technical notes
- TanStack Start (not the React/Express stack from the spec) — same UX, idiomatic for this template
- Each route sets unique `head()` meta (title + description + og)
- AI SDK: `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`
- No database, no auth, no Lovable Cloud

## Out of scope
Accounts, server-side history, file uploads, export to PDF/Docx, team sharing. Easy to add later if you enable Lovable Cloud.
