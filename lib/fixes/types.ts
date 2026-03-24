export type FixType =
  | "llms-txt"
  | "schema"
  | "content-briefs"
  | "comparison-pages"
  | "citation-playbook"
  | "crawlability-audit"
  | "brand-narrative";

export const ALL_FIX_TYPES: FixType[] = [
  "llms-txt",
  "schema",
  "content-briefs",
  "comparison-pages",
  "citation-playbook",
  "crawlability-audit",
  "brand-narrative",
];

export interface GeneratedFix {
  filename: string;
  content: string;
  description: string;
  sizeBytes: number;
}

export interface FixInput {
  brand: string;
  category: string;
  url: string;
  niche?: string;
  competitors?: string[];
  category_scores?: Record<string, number>;
  recommendations?: Array<{ title: string; description: string; priority: string }>;
  types?: FixType[];
  region?: string; // region code e.g. 'sg', 'us' — adds regional context to generated files
}

export interface FixOutput {
  fixes: GeneratedFix[];
  brand: string;
  estimated_impact: string;
}
