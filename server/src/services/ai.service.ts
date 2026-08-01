import { GoogleGenAI } from "@google/genai";
import { Prisma, Workflow, WorkflowStep } from "@prisma/client";
import prisma from "../lib/prisma";

import { ApiError } from "../middleware/errorHandler";
import {
  GeneratedWorkflow,
  GenerateWorkflowInput,
  generatedWorkflowSchema,
} from "../validators/ai.validation";

// =========================================================
// Client setup
// =========================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[ai.service] Missing GEMINI_API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY ?? "" });

// =========================================================
// Prompt construction
// =========================================================

const SYSTEM_INSTRUCTION = `You are FlowPilot's workflow generation engine.
Given a user's natural language request, design an automation workflow.

You MUST respond with ONLY valid JSON. No markdown, no code fences, no commentary.

The JSON MUST match this exact shape:
{
  "title": string,
  "description": string | null,
  "steps": [
    {
      "order": number (starting at 1, sequential),
      "type": "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK",
      "name": string,
      "config": object
    }
  ]
}

Rules:
- The first step must be of type "TRIGGER".
- Use only the allowed step types listed above.
- "config" must be a plain JSON object relevant to the step type
  (e.g. EMAIL steps include "to"/"subject"/"body" style fields,
  DELAY steps include a duration field, WEBHOOK steps include a "url" field).
- Keep step names short and action-oriented.
- Do not include any fields other than title, description, and steps.`;

function buildPrompt(userPrompt: string): string {
  return `User request: "${userPrompt}"\n\nGenerate the workflow JSON now.`;
}

// =========================================================
// Response parsing
// =========================================================

function extractJsonText(rawText: string): string {
  const trimmed = rawText.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return trimmed;
}

function parseGeneratedWorkflow(rawText: string): GeneratedWorkflow {
  const jsonText = extractJsonText(rawText);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new ApiError(502, "AI response was not valid JSON");
  }

  const result = generatedWorkflowSchema.safeParse(parsedJson);

  if (!result.success) {
    throw new ApiError(
      502,
      "AI response did not match the expected workflow structure",
      result.error.flatten().fieldErrors
    );
  }

  return result.data;
}

// =========================================================
// generateWorkflowFromPrompt
// =========================================================

export async function generateWorkflowFromPrompt(
  input: GenerateWorkflowInput
): Promise<GeneratedWorkflow> {
  if (!GEMINI_API_KEY) {
    throw new ApiError(500, "AI generation is not configured on this server");
  }

  let response;

  try {
    response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(input.prompt),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });
  } catch {
    throw new ApiError(502, "Failed to reach the AI provider. Please try again.");
  }

  const rawText = response.text;

  if (!rawText) {
    throw new ApiError(502, "AI provider returned an empty response");
  }

  const workflow = parseGeneratedWorkflow(rawText);

  const normalizedSteps = [...workflow.steps]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({
      ...step,
      order: index + 1,
    }));

  return {
    ...workflow,
    steps: normalizedSteps,
  };
}

// =========================================================
// saveGeneratedWorkflow
// =========================================================

export interface SavedWorkflow extends Workflow {
  steps: WorkflowStep[];
}

export async function saveGeneratedWorkflow(
  userId: string,
  workflow: GeneratedWorkflow
): Promise<SavedWorkflow> {
  try {
    const savedWorkflow = await prisma.$transaction(async (tx) => {
      const createdWorkflow = await tx.workflow.create({
        data: {
          title: workflow.title,
          description: workflow.description ?? null,
          status: "DRAFT",
          userId,
        },
      });

      await tx.workflowStep.createMany({
        data: workflow.steps.map((step) => ({
          workflowId: createdWorkflow.id,
          stepOrder: step.order,
          type: step.type,
          name: step.name,
          config: step.config as Prisma.InputJsonValue,
        })),
      });

      const steps = await tx.workflowStep.findMany({
        where: { workflowId: createdWorkflow.id },
        orderBy: { stepOrder: "asc" },
      });

      return {
        ...createdWorkflow,
        steps,
      };
    });

    return savedWorkflow;
  } catch {
    throw new ApiError(500, "Failed to save the generated workflow. Please try again.");
  }
}