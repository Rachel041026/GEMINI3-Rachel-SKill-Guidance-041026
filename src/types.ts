/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PainterStyleId = 'modern' | 'van-gogh' | 'picasso' | 'monet' | 'banksy' | 'warhol' | 'klimt';

export interface PainterStyle {
  id: PainterStyleId;
  name: string;
  description: string;
}

export interface Entity {
  id: string;
  key: string;
  value: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  annotation: string;
  comment?: string;
  status: 'pending' | 'compliant' | 'non-compliant' | 'na';
}

export interface WorkflowResults {
  webSearchSummary: string;
  comprehensiveSummary: string;
  mockSummary: string;
  checklist: ChecklistItem[];
  entities: Entity[];
  followUpQuestions: string[];
  fullReport: string;
}

export interface AppSettings {
  model: string;
  language: 'zh' | 'en';
  painterStyle: PainterStyleId;
  prompts: {
    webSearch: string;
    comprehensiveSummary: string;
    checklist: string;
    mockSummary: string;
    checklistFilling: string;
    reportGeneration: string;
  };
}

export type AgentStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
