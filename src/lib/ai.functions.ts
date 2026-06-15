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

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      tasks: z.string().min(1).max(8000),
      scope: z.enum(["Daily", "Weekly"]),
    }),
  )
  .handler(async ({ data }) =>
    run(
      "You are a productivity coach who creates realistic, prioritized work schedules.",
      `Create a prioritized ${data.scope.toLowerCase()} schedule from these tasks.\n\nTasks:\n${data.tasks}\n\nRequirements:\n- Prioritize urgent/important tasks first\n- Suggest realistic time blocks (with start–end times for Daily, or day-by-day blocks for Weekly)\n- Include short breaks\n- End with 2–3 productivity tips\n\nFormat using markdown.`,
    ),
  );

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
