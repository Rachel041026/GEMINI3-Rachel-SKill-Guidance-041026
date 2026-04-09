/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AppSettings, ChecklistItem, Entity, WorkflowResults } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function runWorkflow(
  settings: AppSettings,
  inputs: { guidance: string; notes: string; deviceInfo: string; template: string },
  onProgress: (step: number, message: string) => void,
  signal?: AbortSignal
): Promise<WorkflowResults> {
  const results: Partial<WorkflowResults> = {};

  const checkSignal = () => {
    if (signal?.aborted) {
      throw new Error("Workflow stopped by user");
    }
  };

  // Step 1: Web Search & Synthesis
  checkSignal();
  onProgress(1, "Searching web for FDA guidance and summaries...");
  const webSearchPrompt = settings.prompts.webSearch
    .replace("{{guidance}}", inputs.guidance)
    .replace("{{notes}}", inputs.notes);

  const webSearchResponse = await ai.models.generateContent({
    model: settings.model,
    contents: webSearchPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  results.webSearchSummary = webSearchResponse.text || "No results found.";

  // Step 2: Comprehensive Summary
  checkSignal();
  onProgress(2, "Generating comprehensive 510(k) summary...");
  const compSummaryPrompt = settings.prompts.comprehensiveSummary
    .replace("{{grounding}}", results.webSearchSummary)
    .replace("{{guidance}}", inputs.guidance)
    .replace("{{notes}}", inputs.notes);

  const compSummaryResponse = await ai.models.generateContent({
    model: settings.model,
    contents: compSummaryPrompt,
  });
  results.comprehensiveSummary = compSummaryResponse.text || "";

  // Step 3: Checklist Generation (50 items)
  checkSignal();
  onProgress(3, "Creating 50-item review checklist...");
  const checklistPrompt = settings.prompts.checklist
    .replace("{{guidance}}", inputs.guidance);

  const checklistResponse = await ai.models.generateContent({
    model: settings.model,
    contents: checklistPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            item: { type: Type.STRING },
            annotation: { type: Type.STRING },
          },
          required: ["id", "category", "item", "annotation"],
        },
      },
    },
  });
  try {
    results.checklist = JSON.parse(checklistResponse.text || "[]");
  } catch (e) {
    console.error("Failed to parse checklist JSON", e);
    results.checklist = [];
  }

  // Step 4: Mock Summary Generation
  checkSignal();
  onProgress(4, "Generating mock 510(k) summary...");
  const mockSummaryPrompt = settings.prompts.mockSummary
    .replace("{{deviceInfo}}", inputs.deviceInfo || "Stationary X-ray System");

  const mockSummaryResponse = await ai.models.generateContent({
    model: settings.model,
    contents: mockSummaryPrompt,
  });
  results.mockSummary = mockSummaryResponse.text || "";

  // Step 5: Checklist Filling
  checkSignal();
  onProgress(5, "Filling checklist for mock summary...");
  const fillingPrompt = settings.prompts.checklistFilling
    .replace("{{mockSummary}}", results.mockSummary)
    .replace("{{checklist}}", JSON.stringify(results.checklist));

  const fillingResponse = await ai.models.generateContent({
    model: settings.model,
    contents: fillingPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            item: { type: Type.STRING },
            annotation: { type: Type.STRING },
            comment: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["pending", "compliant", "non-compliant", "na"] },
          },
          required: ["id", "category", "item", "annotation", "comment", "status"],
        },
      },
    },
  });
  try {
    results.checklist = JSON.parse(fillingResponse.text || "[]");
  } catch (e) {
    console.error("Failed to parse filled checklist JSON", e);
  }

  // Step 6: Entity Extraction (50 entities) & Final Report
  checkSignal();
  onProgress(6, "Extracting entities and assembling final report...");
  const extractionPrompt = `Extract exactly 50 regulatory entities from the following comprehensive summary. 
Ensure the output is a valid JSON array of 50 objects.
Summary: ${results.comprehensiveSummary}
Output as a JSON array of objects with fields: id, key, value, description.`;

  const extractionResponse = await ai.models.generateContent({
    model: settings.model,
    contents: extractionPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            key: { type: Type.STRING },
            value: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["id", "key", "value", "description"],
        },
      },
    },
  });
  try {
    results.entities = JSON.parse(extractionResponse.text || "[]");
  } catch (e) {
    console.error("Failed to parse entities JSON", e);
    results.entities = [];
  }

  checkSignal();
  const finalReportPrompt = settings.prompts.reportGeneration
    .replace("{{template}}", inputs.template)
    .replace("{{webSearch}}", results.webSearchSummary || "")
    .replace("{{compSummary}}", results.comprehensiveSummary || "")
    .replace("{{mockSummary}}", results.mockSummary || "")
    .replace("{{checklist}}", JSON.stringify(results.checklist))
    .replace("{{entities}}", JSON.stringify(results.entities));

  const finalReportResponse = await ai.models.generateContent({
    model: settings.model,
    contents: finalReportPrompt,
  });
  results.fullReport = finalReportResponse.text || "";

  // Step 7: Extract Follow-up Questions (Bonus Step for robustness)
  checkSignal();
  onProgress(7, "Finalizing follow-up questions...");
  const questionsPrompt = `Extract exactly 20 critical follow-up questions from the following report. 
Output as a JSON array of strings.
Report: ${results.fullReport}`;

  const questionsResponse = await ai.models.generateContent({
    model: settings.model,
    contents: questionsPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  try {
    results.followUpQuestions = JSON.parse(questionsResponse.text || "[]");
  } catch (e) {
    console.error("Failed to parse questions JSON", e);
    results.followUpQuestions = [];
  }

  return results as WorkflowResults;
}
