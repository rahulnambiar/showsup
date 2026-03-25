// ── Scan ──────────────────────────────────────────────────────────────────────

export interface ScanResult {
  domain:         string;
  overall_score:  number;
  chatgpt_score?: number;
  claude_score?:  number;
  gemini_score?:  number;
  perplexity_score?: number;
  share_of_voice?: number;
  queries_won?:   number;
  queries_missed?: number;
  query_count?:   number;
  recommendations?: Recommendation[];
  competitors?:   CompetitorData[];
  scanned_at:     number; // unix ms
}

export interface Recommendation {
  title:       string;
  impact:      "high" | "medium" | "low";
  description?: string;
  fix?:        string;
}

export interface CompetitorData {
  name:          string;
  domain:        string;
  score?:        number;
  share_of_voice?: number;
}

// ── Monitor session ────────────────────────────────────────────────────────────

export interface MonitorSession {
  platform:       AIPlatform;
  startedAt:      number;
  responses:      number;
  brandMentions:  BrandMention[];
  competitors:    CompetitorMention[];
}

export interface BrandMention {
  brand:     string;
  context:   string;   // surrounding text snippet
  sentiment: "positive" | "neutral" | "negative";
  responseIndex: number;
}

export interface CompetitorMention {
  brand:   string;
  count:   number;
  context: string;
}

// ── Storage ────────────────────────────────────────────────────────────────────

export interface ExtensionSettings {
  apiToken:         string;
  brandName:        string;
  brandDomain:      string;
  trackedBrands:    string[];   // additional brand name variants
  competitors:      string[];   // competitor brand names to watch
  cloudUrl:         string;
  showBadge:        boolean;
  monitorEnabled:   boolean;
  notifyOnMention:  boolean;
  theme:            "dark" | "light";
}

export interface StoredScan {
  [domain: string]: ScanResult;
}

export interface BadgeState {
  domain:   string;
  score:    number;
  color:    string;
}

// ── AI Platforms ───────────────────────────────────────────────────────────────

export type AIPlatform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "copilot"
  | "unknown";

export interface PlatformConfig {
  name:              string;
  color:             string;
  responseSelector:  string;
  inputSelector:     string;
}

export const PLATFORM_CONFIGS: Record<AIPlatform, PlatformConfig> = {
  chatgpt: {
    name:             "ChatGPT",
    color:            "#10a37f",
    responseSelector: "[data-message-author-role='assistant'] .markdown",
    inputSelector:    "#prompt-textarea",
  },
  claude: {
    name:             "Claude",
    color:            "#cc785c",
    responseSelector: "[data-is-streaming] .font-claude-message, .font-claude-message",
    inputSelector:    '[contenteditable="true"]',
  },
  gemini: {
    name:             "Gemini",
    color:            "#4285f4",
    responseSelector: ".model-response-text, .response-content",
    inputSelector:    "rich-textarea textarea, .ql-editor",
  },
  perplexity: {
    name:             "Perplexity",
    color:            "#20b8cd",
    responseSelector: ".prose, [data-testid='answer-text']",
    inputSelector:    "textarea",
  },
  copilot: {
    name:             "Copilot",
    color:            "#0078d4",
    responseSelector: ".cib-message-content, [data-testid='cib-message']",
    inputSelector:    "#searchbox",
  },
  unknown: {
    name:             "AI Chat",
    color:            "#6b7280",
    responseSelector: ".response, .answer, .message",
    inputSelector:    "textarea",
  },
};

// ── Messages (content ↔ background ↔ popup) ───────────────────────────────────

export type Message =
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: Partial<ExtensionSettings> }
  | { type: "TRIGGER_SCAN"; domain: string }
  | { type: "GET_SCAN"; domain: string }
  | { type: "GET_MONITOR_SESSION" }
  | { type: "MONITOR_EVENT"; event: MonitorEvent }
  | { type: "OPEN_POPUP" }
  | { type: "PING" };

export type MonitorEvent =
  | { kind: "brand_mention";     mention: BrandMention }
  | { kind: "competitor_mention"; mention: CompetitorMention }
  | { kind: "response_complete"; text: string; index: number }
  | { kind: "session_reset" };
