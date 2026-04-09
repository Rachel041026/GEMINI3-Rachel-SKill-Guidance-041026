/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings, PainterStyle } from "./types";

export const PAINTER_STYLES: PainterStyle[] = [
  { id: 'modern', name: 'Modern', description: 'Slate-based, clean, professional.' },
  { id: 'van-gogh', name: 'Van Gogh', description: 'Swirling blue/yellow gradients with an oil-canvas texture.' },
  { id: 'picasso', name: 'Picasso', description: 'Geometric, sharp-edged borders with cubist color palettes.' },
  { id: 'monet', name: 'Monet', description: 'Soft pastel gradients with a subtle blur and paper-fiber texture.' },
  { id: 'banksy', name: 'Banksy', description: 'High-contrast grayscale with a stencil-on-stucco feel.' },
  { id: 'warhol', name: 'Warhol', description: 'High-saturation pop-art colors (Cyan/Magenta/Yellow).' },
  { id: 'klimt', name: 'Klimt', description: 'Gold-leaf textures with ornate, warm yellow gradients.' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-3-flash-preview',
  language: 'zh',
  painterStyle: 'modern',
  prompts: {
    webSearch: `Search for FDA related 510(k) summaries and guidance related to the following information:
{{guidance}}
{{notes}}
Create a comprehensive summary of the results in markdown in 2000~3000 words.`,
    comprehensiveSummary: `Based on the web search results and the provided guidance/notes, create a comprehensive 510(k) summary.
Grounding Context: {{grounding}}
User Guidance: {{guidance}}
User Notes: {{notes}}
Word count: 3000~4000 words.`,
    checklist: `Create EXACTLY 50 items for a 510(k) review checklist with annotations based on the provided guidance. 
Ensure the list is comprehensive and covers all regulatory aspects mentioned.
Language: Traditional Chinese (zh-TW).
Guidance: {{guidance}}
Output as a JSON array of objects with fields: id, category, item, annotation.`,
    mockSummary: `Create a detailed mock 510(k) summary for the following device information. If no device info is provided, create a plausible one for a "Stationary X-ray System".
Device Info: {{deviceInfo}}
Word count: 3000~4000 words. Markdown format. Include sections for Device Description, Indications for Use, and Substantial Equivalence.`,
    checklistFilling: `Review the provided Mock Summary against the Checklist. 
For each item in the checklist, provide a specific comment based on the mock summary and assign a status: 'compliant', 'non-compliant', 'pending', or 'na'.
Mock Summary: {{mockSummary}}
Checklist: {{checklist}}
Output as a JSON array of objects with fields: id, category, item, annotation, comment, status.`,
    reportGeneration: `Assemble a final, professional 510(k) Review Report in Markdown using the provided template and data.
Data to include:
- Web Search Summary: {{webSearch}}
- Comprehensive Summary: {{compSummary}}
- Mock Summary: {{mockSummary}}
- Filled Checklist: {{checklist}}
- Extracted Entities: {{entities}}

Template: {{template}}
Ensure all tables are properly formatted and the tone is formal and regulatory-focused.`
  }
};

export const DEFAULT_TEMPLATE = `510(k) 審查報告：[裝置名稱] ([510(k) 編號])
1. 執行摘要 (Executive Summary)
2. 行政與分類資訊 (Administrative and Classification Information)
3. 裝置描述 (Device Description)
4. 適應症 (Indications for Use)
5. 實質等效性比較 (Substantial Equivalence Discussion)
6. 符合之共識標準 (Consensus Standards)
7. 性能數據：軟體驗證與確認 (V&V)
8. 詳細審查清單 (Detailed Review Checklist)
9. 數據集中提取的 20 個關鍵實體 (Extracted Entities)
10. 結論 (Conclusion)
11. 後續審查追蹤問題 (20 Follow-up Questions)`;
