import { createServerFn } from "@tanstack/react-start";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

async function run(system: string, prompt: string) {
  const gateway = getGateway();
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });
  return { text };
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      purpose: z.string().min(1).max(4000),
      recipient: z.string().min(1).max(500),
      tone: z.enum(["Formal", "Friendly", "Persuasive"]),
    }),
  )
  .handler(async ({ data }) =>
    run(
      "You are an expert business communication assistant. Write clear, well-structured emails. Output plain text only — no markdown code fences.",
      `Write a complete professional email.\n\nRecipient: ${data.recipient}\nPurpose: ${data.purpose}\nTone: ${data.tone}\n\nInclude:\n- Subject line (prefixed with "Subject: ")\n- Greeting\n- Body (well-structured paragraphs)\n- Closing with a placeholder signature`,
    ),
  );

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator(z.object({ notes: z.string().min(1).max(20000) }))
  .handler(async ({ data }) =>
    run(
      "You summarize meeting notes into crisp, actionable markdown. Always use the four required sections.",
      `Summarize the following meeting notes using markdown headings and bullet lists.\n\nReturn exactly these sections, in this order:\n## Summary\n## Key Decisions\n## Action Items\n## Deadlines\n\nNotes:\n${data.notes}`,
    ),
  );

const TaskSchema = z.object({
  task: z.string().describe("Short, action-oriented task title (max ~8 words)"),
  description: z.string().describe("One concise sentence explaining the task"),
  priority: z.enum(["High", "Medium", "Low"]),
  status: z.enum(["Not Started", "In Progress", "Pending Review", "Completed"]),
  dueDate: z.string().describe("Human-friendly due date or time block (e.g. 'Mon 9:00–10:30' or '2026-06-18')"),
  notes: z.string().describe("Short helpful note, dependency, or tip"),
});

export type PlannedTask = z.infer<typeof TaskSchema>;

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      tasks: z.string().min(1).max(8000),
      scope: z.enum(["Daily", "Weekly"]),
    }),
  )
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const resultSchema = z.object({ tasks: z.array(TaskSchema).min(1).max(40) });
    const { text } = await generateText({
      model: gateway(MODEL),
      system:
        "You are a productivity coach. Break work into clear, actionable, non-overlapping tasks ordered logically. Be concise. Never duplicate tasks. You ALWAYS respond with valid JSON only — no prose, no markdown fences.",
      prompt: `Build a prioritized ${data.scope.toLowerCase()} plan from the input below.\n\nReturn ONLY a JSON object with this exact shape (no markdown, no commentary):\n{\n  "tasks": [\n    {\n      "task": string,                 // short action-oriented title\n      "description": string,          // one concise sentence\n      "priority": "High" | "Medium" | "Low",\n      "status": "Not Started" | "In Progress" | "Pending Review" | "Completed",\n      "dueDate": string,              // e.g. "9:00–10:30" for Daily, weekday or ISO date for Weekly\n      "notes": string                 // <= 12 words\n    }\n  ]\n}\n\nRules:\n- Each task must be atomic and actionable\n- No duplicates or overlap\n- Order tasks logically (dependencies/urgency first)\n- Default status is "Not Started" unless input implies otherwise\n\nInput:\n${data.tasks}`,
    });
    return resultSchema.parse(extractJson(text));
  });

function extractJson(raw: string): unknown {
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = s.search(/[\{\[]/);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("AI did not return JSON");
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    s = s.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(s);
  }
}

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      topic: z.string().min(1).max(1000),
      sourceText: z.string().max(20000).optional(),
    }),
  )
  .handler(async ({ data }) =>
    run(
      "You are a research analyst who produces concise, well-structured briefings.",
      `Research topic: ${data.topic}\n${data.sourceText ? `\nReference material:\n${data.sourceText}\n` : ""}\nProduce a markdown briefing with exactly these sections:\n## Executive Summary\n## Key Insights\n## Recommendations\n## Risks & Challenges`,
    ),
  );
