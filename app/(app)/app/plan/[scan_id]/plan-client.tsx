"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  X,
  Info,
  Download,
  RefreshCw,
  Zap,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AeoScore {
  score: number;
  summary: string;
}

interface AeoScores {
  entity_strength: AeoScore;
  training_data: AeoScore;
  content_citability: AeoScore;
  citation_sources: AeoScore;
  competitive_narrative: AeoScore;
  content_freshness: AeoScore;
  multi_platform: AeoScore;
  intent_alignment: AeoScore;
  mention_positioning: AeoScore;
  crawler_readiness: AeoScore;
}

interface PlanItem {
  id: string;
  layer: string;
  funnel_stage: "awareness" | "consideration" | "competition" | "conversion";
  issue_type: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  why_it_matters: string;
  research_backing: string;
  current_state: string | null;
  desired_state: string | null;
  specific_page: string | null;
  target_query: string | null;
  addresses_competitor: string | null;
  action_steps: string;
  impact: string;
  effort: string;
  verification_type: string;
  status: "not_started" | "in_progress" | "marked_fixed" | "verified" | "failed" | "skipped";
  verified_at: string | null;
  verification_result: Record<string, unknown>;
}

interface PlanClientProps {
  scanId: string;
  brand: string;
  scanDate: string;
  overallScore: number;
  websiteUrl: string | null;
  initialItems: PlanItem[];
  isSample?: boolean;
  tokenBalance?: number;
  planTokenCost?: number;
  aeoScores: AeoScores | null;
  overallAeoReadiness: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  {
    id: "awareness",
    emoji: "🔍",
    label: "AWARENESS",
    subtitle: "Do AI platforms know you exist?",
    layers: ["entity_strength", "training_data", "crawler_readiness"],
  },
  {
    id: "consideration",
    emoji: "🏆",
    label: "CONSIDERATION",
    subtitle: "Does AI include you in category discussions?",
    layers: ["content_citability", "content_freshness", "intent_alignment"],
  },
  {
    id: "competition",
    emoji: "⚔️",
    label: "COMPETITION",
    subtitle: "Do you beat competitors in AI responses?",
    layers: ["competitive_narrative", "mention_positioning"],
  },
  {
    id: "conversion",
    emoji: "💰",
    label: "CONVERSION",
    subtitle: "Does AI help people choose you?",
    layers: ["citation_sources", "multi_platform"],
  },
] as const;

const AEO_DIMENSION_KEYS = [
  "entity_strength",
  "training_data",
  "content_citability",
  "citation_sources",
  "competitive_narrative",
  "content_freshness",
  "multi_platform",
  "intent_alignment",
  "mention_positioning",
  "crawler_readiness",
] as const;

type AeoDimensionKey = (typeof AEO_DIMENSION_KEYS)[number];

const DIMENSION_LABELS: Record<AeoDimensionKey, string> = {
  entity_strength: "Entity Strength",
  training_data: "Training Data",
  content_citability: "Content Citability",
  citation_sources: "Citation Sources",
  competitive_narrative: "Competitive Narrative",
  content_freshness: "Content Freshness",
  multi_platform: "Multi-Platform",
  intent_alignment: "Intent Alignment",
  mention_positioning: "Mention Positioning",
  crawler_readiness: "Crawler Readiness",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#9CA3AF",
};

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high: "bg-amber-100 text-amber-700 border border-amber-200",
  medium: "bg-blue-100 text-blue-700 border border-blue-200",
  low: "bg-gray-100 text-gray-600 border border-gray-200",
};

const LAYER_EXPLAINERS: Record<
  string,
  {
    title: string;
    intro: string;
    analogy: string;
    findings: Array<{ stat: string; source: string }>;
    measures: string[];
  }
> = {
  entity_strength: {
    title: "Why AI needs to recognize your brand as a unique entity",
    intro:
      "LLMs treat brands as nodes in a knowledge graph. The stronger and more consistent your entity description across the web, the more confidently AI recommends you.",
    analogy:
      "Think of it like a Wikipedia disambiguation page: if your brand name is also a common word or shares a name with other businesses, AI gets confused and mentions you less often.",
    findings: [
      {
        stat: "Brands with consistent entity descriptions across 4+ platforms are 2.8x more likely to be cited",
        source: "Digital Bloom, 2025 AI Visibility Report",
      },
      {
        stat: "Wikipedia presence is the strongest single predictor of LLM brand recognition",
        source: "Omniscient Digital, 23K+ Citation Study",
      },
    ],
    measures: [
      "Brand description consistency across website and AI responses",
      "Wikipedia/Wikidata entry existence",
      "Brand name uniqueness vs generic words",
      "Clear brand role assignment by AI (market leader, budget option, etc.)",
    ],
  },
  training_data: {
    title: "Where AI learned about your brand (and where it didn't)",
    intro:
      "Before AI platforms can recommend your brand, they need to have 'learned' about it during training. This happens through the websites and publications included in training datasets.",
    analogy:
      "It's like reputation by association: if your brand is mentioned in the New York Times, Wikipedia, and top industry publications, AI trusts you. If you only appear on your own website, AI barely knows you exist.",
    findings: [
      {
        stat: "OpenAI Tier 1 training sources: Wikipedia, licensed publishers, GPTBot-accessible sites",
        source: "AirOps, LLM Citation Analysis",
      },
      {
        stat: "Reddit mentions (3+ upvotes) significantly improve brand recognition in Tier 2 sources",
        source: "Evertune, Brand Citation Research",
      },
    ],
    measures: [
      "Reddit presence in category subreddits",
      "Industry publication mentions",
      "Review platform presence (G2, Capterra, Trustpilot)",
      "Domain age and authority",
    ],
  },
  content_citability: {
    title: "How to structure content so AI quotes you",
    intro:
      "When AI answers questions, it doesn't read your entire page. It scans for 'extractable chunks' — self-contained passages that directly answer a question without requiring surrounding context.",
    analogy:
      "Think like a journalist on deadline: they need a quote they can use immediately. If your content needs 3 paragraphs of context before the key point, AI skips you and cites someone who leads with the answer.",
    findings: [
      {
        stat: "44.2% of LLM citations come from the first 30% of content (answer-first format)",
        source: "Kevin Indig, Analysis of 1.2M ChatGPT Answers, 2025",
      },
      {
        stat: "Self-contained answer chunks of 50-150 words get 2.3x more citations than unstructured prose",
        source: "Digital Bloom, 2025 AI Visibility Report",
      },
      {
        stat: "Adding statistics increases AI visibility by 22%",
        source: "iPullRank, Content Strategy for AI Visibility",
      },
      {
        stat: "Expert quotations boost AI citation likelihood by 37%",
        source: "iPullRank, 2025",
      },
    ],
    measures: [
      "Answer-first format (key claim in sentence 1?)",
      "Chunk structure (self-contained 50-150 word answers?)",
      "Data density (statistics per 500 words)",
      "Quote/testimonial presence",
      "Reading level (Flesch-Kincaid grade ~16)",
    ],
  },
  citation_sources: {
    title: "The websites AI trusts for recommendations",
    intro:
      "Different AI platforms use different sources to answer questions. Understanding which platforms cite from where lets you build a platform-specific strategy.",
    analogy:
      "Getting cited by AI is like getting cited in an academic paper: you need to appear in the journals that matter to that field. Being in the wrong journal (wrong platform) means you're invisible to that AI.",
    findings: [
      {
        stat: "ChatGPT cites from Bing top 10 with 87% correlation",
        source: "WebSpero Solutions, Cross-Platform Citation Study 2026",
      },
      {
        stat: "Only 11% of domains are cited by BOTH ChatGPT and Perplexity — platform strategy matters",
        source: "Seer Interactive, 500+ Citation Analysis",
      },
      {
        stat: "48% of branded citations come from earned media, 30% commercial, 23% owned content",
        source: "Digital Bloom, 2025",
      },
    ],
    measures: [
      "Bing search ranking (predicts ChatGPT citations)",
      "Google ranking (predicts AI Overview citations)",
      "Third-party review and comparison site presence",
      "Press and earned media coverage",
    ],
  },
  competitive_narrative: {
    title: "The story AI tells about you vs competitors",
    intro:
      "AI platforms don't just know facts about brands — they tell stories. The narrative AI assigns to your brand (innovative, expensive, enterprise-focused, etc.) shapes whether you're recommended for specific queries.",
    analogy:
      "It's like positioning in a buyer's mind: once a brand owns a word (Volvo = safety, Apple = premium), it's very hard to dislodge. AI has similar 'brand narratives' baked in from training.",
    findings: [
      {
        stat: "Brands in positions 1-2 receive 5x more consideration than position 3+",
        source: "Omniscient Digital, 23K+ Citation Study",
      },
      {
        stat: "Brand search volume is the strongest predictor of AI citation frequency (0.334 correlation)",
        source: "SourceCheckup, Nature Communications, Wu et al. 2025",
      },
    ],
    measures: [
      "AI-assigned adjectives vs competitor adjectives",
      "Category 'role' owned by brand (vs competitors)",
      "Narrative gap vs desired positioning",
      "Query types where competitors are consistently preferred",
    ],
  },
  content_freshness: {
    title: "Why AI ignores outdated content",
    intro:
      "AI platforms heavily favor recently updated content, both in their training data and in real-time search. Stale content gets deprioritized — even if it was once authoritative.",
    analogy:
      "It's like Google News: if your article is 3 years old, it won't appear for breaking news queries. AI has a similar recency bias, especially for rapidly-changing categories.",
    findings: [
      {
        stat: "65% of AI bot traffic targets content updated within the past year",
        source: "Digital Bloom, 2025 AI Visibility Report",
      },
      {
        stat: "79% of AI bot traffic targets content updated within 2 years",
        source: "Digital Bloom, 2025",
      },
    ],
    measures: [
      "Last-modified dates on key pages",
      "Blog/news publish frequency",
      "Presence of current-year references in content",
      "Product/pricing page update recency",
    ],
  },
  multi_platform: {
    title: "Why being everywhere makes AI notice you",
    intro:
      "AI platforms learn about brands from multiple independent sources. The more platforms where your brand appears consistently, the more 'real' and trustworthy it seems to AI.",
    analogy:
      "It's like credit scores: having accounts at 5 different banks looks more trustworthy than one account, even with the same total balance. Platform diversity signals legitimacy.",
    findings: [
      {
        stat: "Brands on 4+ platform types are 2.8x more likely to be cited by ChatGPT",
        source: "Digital Bloom, 2025 AI Visibility Report",
      },
      {
        stat: "Average cited domain age is 17 years — older, multi-platform brands win",
        source: "Omniscient Digital, Citation Research",
      },
    ],
    measures: [
      "Count of platforms: website, Wikipedia, review sites, social, Reddit, press, comparison sites, developer platforms, video, community forums",
      "Consistency of brand description across platforms",
      "Review volume and recency",
    ],
  },
  intent_alignment: {
    title: "Different AI platforms for different questions",
    intro:
      "Different AI platforms have different strengths for different query intents. ChatGPT excels at informational queries, while Google AI Overviews dominates commercial and transactional intent. Your strategy should match platform strengths.",
    analogy:
      "It's like advertising channels: TV for awareness, Google Search for purchase intent, LinkedIn for B2B. You need to be visible where your target buyers are asking questions.",
    findings: [
      {
        stat: "ChatGPT: 87% accurate on informational, 54% on transactional queries",
        source: "AirOps, Cross-Platform Intent Analysis",
      },
      {
        stat: "Google AI Overviews: 91% on commercial, 89% on transactional intent",
        source: "AirOps, 2025",
      },
      {
        stat: "Claude has the most balanced intent performance (3.1% std dev across types)",
        source: "WebSpero Solutions, 2026",
      },
    ],
    measures: [
      "Visibility breakdown by query intent type (informational/commercial/transactional)",
      "Platform-specific gaps by intent",
      "Content coverage for each intent type",
    ],
  },
  mention_positioning: {
    title: "First-mentioned brands win 5x more attention",
    intro:
      "When AI mentions multiple brands in a response, position matters enormously. The first brand mentioned gets disproportionate attention — both from the AI's narrative weighting and from the human reading the response.",
    analogy:
      "It's like search results: position 1 gets 10x the clicks of position 3. In AI responses, being mentioned first vs third can determine whether you get the recommendation.",
    findings: [
      {
        stat: "First-mentioned brands get 5x more consideration than third-mentioned brands",
        source: "Omniscient Digital, 23K+ Citation Study",
      },
      {
        stat: "44.2% of citations come from the first 30% of source content — answer-first content gets first mention",
        source: "Kevin Indig, 2025",
      },
    ],
    measures: [
      "Average mention position vs competitors",
      "Percentage of queries where brand is mentioned first",
      "Query types where brand consistently gets second or third mention",
      "Competitor content patterns that earn first mention",
    ],
  },
  crawler_readiness: {
    title: "Can AI actually read your website?",
    intro:
      "Even if your content is excellent, AI crawlers may not be able to access it. Technical barriers — robots.txt blocks, JavaScript-only rendering, slow load times — can make your website invisible to AI platforms.",
    analogy:
      "It's like a beautiful store with a locked door: no matter how good your products, customers can't buy if they can't get in. Technical crawler readiness is the locked door problem for AI.",
    findings: [
      {
        stat: "87% of ChatGPT SearchGPT citations match Bing's top 10 — being Bing-crawlable is essential",
        source: "WebSpero Solutions, 2026",
      },
      {
        stat: "IndexNow enables instant indexing in Bing/Copilot/Yandex — dramatically faster citation potential",
        source: "Microsoft, IndexNow Documentation",
      },
    ],
    measures: [
      "robots.txt rules for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, GoogleOther)",
      "/llms.txt existence and quality",
      "Server-side rendering vs client-side (CSR invisible to crawlers)",
      "Page load speed",
      "Sitemap freshness and URL count",
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function barColor(score: number): string {
  if (score >= 7) return "#10B981";
  if (score >= 4) return "#F59E0B";
  return "#EF4444";
}

function layerToKey(layer: string): AeoDimensionKey {
  return layer.toLowerCase().replace(/\s+/g, "_") as AeoDimensionKey;
}

function formatLayerLabel(layer: string): string {
  const key = layerToKey(layer);
  return DIMENSION_LABELS[key] ?? layer;
}

function priorityOrder(p: PlanItem["priority"]): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: PlanItem["status"] }) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "failed":
      return <X className="w-4 h-4 text-red-500" />;
    case "marked_fixed":
      return (
        <span className="w-4 h-4 rounded-full bg-amber-400 inline-block flex-shrink-0" />
      );
    case "in_progress":
      return (
        <span className="w-4 h-4 rounded-full border-2 border-blue-400 inline-block flex-shrink-0 relative">
          <span className="absolute inset-0 rounded-full bg-blue-400 clip-half" />
        </span>
      );
    case "skipped":
      return <Circle className="w-4 h-4 text-gray-400 line-through" />;
    default:
      return <Circle className="w-4 h-4 text-gray-300" />;
  }
}

function statusLabel(status: PlanItem["status"]): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "marked_fixed":
      return "Marked as fixed";
    case "verified":
      return "Verified";
    case "failed":
      return "Failed verification";
    case "skipped":
      return "Skipped";
  }
}

// ── Issue Card ────────────────────────────────────────────────────────────────

interface IssueCardProps {
  item: PlanItem;
  onStatusChange: (id: string, status: PlanItem["status"]) => Promise<void>;
  onVerify: (id: string) => Promise<void>;
  onExplainerOpen: (layerKey: string) => void;
  verifying: string | null;
}

function IssueCard({
  item,
  onStatusChange,
  onVerify,
  onExplainerOpen,
  verifying,
}: IssueCardProps) {
  const leftBorderColor = PRIORITY_COLORS[item.priority] ?? "#9CA3AF";
  const layerKey = layerToKey(item.layer);
  const isVerifying = verifying === item.id;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
      style={{ borderLeft: `4px solid ${leftBorderColor}` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${PRIORITY_BADGE_CLASSES[item.priority]}`}
        >
          {item.priority}
        </span>
        <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
          {formatLayerLabel(item.layer)}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
          {item.issue_type}
        </span>
        <div className="ml-auto">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
            {item.effort}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h4>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.description}</p>

      {/* Why this matters */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Why This Matters
          </span>
          <button
            type="button"
            onClick={() => onExplainerOpen(layerKey)}
            className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
            title="Learn more about this dimension"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-blue-800">{item.why_it_matters}</p>
        {item.research_backing && (
          <div className="mt-2 bg-blue-100 rounded p-2 text-xs text-blue-600">
            📊 {item.research_backing}
          </div>
        )}
      </div>

      {/* Current state / Desired state */}
      {(item.current_state || item.desired_state) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {item.current_state && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-600 uppercase mb-1">
                Current State
              </p>
              <p className="text-xs text-red-700 leading-relaxed">{item.current_state}</p>
            </div>
          )}
          {item.desired_state && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-600 uppercase mb-1">
                Desired State
              </p>
              <p className="text-xs text-green-700 leading-relaxed">{item.desired_state}</p>
            </div>
          )}
        </div>
      )}

      {/* Action steps */}
      <div className="bg-gray-50 rounded-lg p-4 mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          What To Do
        </p>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {item.action_steps}
        </p>
      </div>

      {/* Footer metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
        {item.specific_page && (
          <span>
            <span className="font-medium text-gray-600">Page:</span> {item.specific_page}
          </span>
        )}
        {item.target_query && (
          <span>
            <span className="font-medium text-gray-600">Query:</span> &ldquo;{item.target_query}&rdquo;
          </span>
        )}
        {item.addresses_competitor && (
          <span>
            <span className="font-medium text-gray-600">vs:</span>{" "}
            {item.addresses_competitor}
          </span>
        )}
        {item.impact && (
          <span className="text-emerald-600 font-medium">{item.impact}</span>
        )}
      </div>

      {/* Status row */}
      <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <StatusIcon status={item.status} />
          <span>{statusLabel(item.status)}</span>
          {item.verified_at && (
            <span className="text-gray-400">
              · {new Date(item.verified_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.status !== "verified" && item.status !== "skipped" && (
            <>
              {item.status !== "marked_fixed" && (
                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, "marked_fixed")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium"
                >
                  Mark as Fixed ✓
                </button>
              )}
              <button
                type="button"
                onClick={() => onStatusChange(item.id, "skipped")}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Skip
              </button>
            </>
          )}
          {item.status === "marked_fixed" && (
            <button
              type="button"
              onClick={() => onVerify(item.id)}
              disabled={isVerifying}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-medium disabled:opacity-60"
            >
              {isVerifying ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                </span>
              ) : (
                "Verify →"
              )}
            </button>
          )}
          {(item.status === "verified" || item.status === "skipped" || item.status === "failed") && (
            <button
              type="button"
              onClick={() => onStatusChange(item.id, "not_started")}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Explainer Modal ───────────────────────────────────────────────────────────

interface ExplainerModalProps {
  layerKey: string;
  onClose: () => void;
}

function ExplainerModal({ layerKey, onClose }: ExplainerModalProps) {
  const explainer = LAYER_EXPLAINERS[layerKey];
  if (!explainer) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-[560px] w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{explainer.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">{explainer.intro}</p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600 italic leading-relaxed">{explainer.analogy}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Key Research Findings
          </h3>
          <div className="space-y-2">
            {explainer.findings.map((finding, i) => (
              <div key={i} className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  {finding.stat}
                </p>
                <p className="text-xs text-blue-500 mt-1">{finding.source}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            How ShowsUp Measures This
          </h3>
          <ul className="space-y-1.5">
            {explainer.measures.map((measure, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                {measure}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={`/methodology#${layerKey}`}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
        >
          Read the full methodology →
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ── AEO Radar Section ─────────────────────────────────────────────────────────

interface AeoRadarProps {
  aeoScores: AeoScores;
  overallAeoReadiness: number | null;
  onDimensionClick: (layerKey: AeoDimensionKey) => void;
}

function AeoRadar({ aeoScores, overallAeoReadiness, onDimensionClick }: AeoRadarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          AEO Readiness
          {overallAeoReadiness !== null && (
            <span className="ml-2 text-2xl font-bold text-gray-800">
              {overallAeoReadiness}
              <span className="text-base text-gray-400 font-normal">/10</span>
            </span>
          )}
        </h2>
      </div>
      <div className="space-y-2.5">
        {AEO_DIMENSION_KEYS.map((key) => {
          const dimension = aeoScores[key];
          const score = dimension?.score ?? 0;
          const summary = dimension?.summary ?? "";
          const color = barColor(score);
          const pct = Math.round((score / 10) * 100);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDimensionClick(key)}
              title={summary}
              className="w-full flex items-center gap-3 group text-left hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
            >
              <span className="text-sm text-gray-700 flex-shrink-0 w-40 text-left">
                {DIMENSION_LABELS[key]}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span
                className="text-sm font-semibold flex-shrink-0 w-10 text-right"
                style={{ color }}
              >
                {score}/10
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Priority breakdown helper ─────────────────────────────────────────────────

function priorityBreakdown(items: PlanItem[]) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const item of items) counts[item.priority] = (counts[item.priority] ?? 0) + 1;
  return counts;
}

// ── Stage Section ─────────────────────────────────────────────────────────────

interface StageSectionProps {
  stage: (typeof FUNNEL_STAGES)[number];
  items: PlanItem[];
  aeoScores: AeoScores | null;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: PlanItem["status"]) => Promise<void>;
  onVerify: (id: string) => Promise<void>;
  onExplainerOpen: (layerKey: string) => void;
  verifying: string | null;
}

function StageSection({
  stage,
  items,
  aeoScores,
  expanded,
  onToggle,
  onStatusChange,
  onVerify,
  onExplainerOpen,
  verifying,
}: StageSectionProps) {
  const counts = priorityBreakdown(items);
  const stageScores = stage.layers
    .map((l) => aeoScores?.[l as AeoDimensionKey]?.score ?? 0)
    .filter((s) => s > 0);
  const avgScore =
    stageScores.length > 0
      ? Math.round(stageScores.reduce((a, b) => a + b, 0) / stageScores.length)
      : null;

  return (
    <div className="mb-4" id={`stage-${stage.id}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg">{stage.emoji}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 tracking-wide">
                {stage.label}
              </span>
              {avgScore !== null && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${barColor(avgScore)}20`,
                    color: barColor(avgScore),
                  }}
                >
                  {avgScore}/10
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{stage.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {counts.critical > 0 && (
              <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                {counts.critical} critical
              </span>
            )}
            {counts.high > 0 && (
              <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                {counts.high} high
              </span>
            )}
            {(counts.medium > 0 || counts.low > 0) && (
              <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {counts.medium + counts.low} more
              </span>
            )}
          </div>
          <span className="text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {expanded && items.length > 0 && (
        <div className="mt-3 space-y-3 pl-0">
          {items.map((item) => (
            <IssueCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onVerify={onVerify}
              onExplainerOpen={onExplainerOpen}
              verifying={verifying}
            />
          ))}
        </div>
      )}

      {expanded && items.length === 0 && (
        <div className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center text-sm text-gray-400">
          No items match the current filters for this stage.
        </div>
      )}
    </div>
  );
}

// ── Layer Section ─────────────────────────────────────────────────────────────

interface LayerSectionProps {
  layerKey: AeoDimensionKey;
  items: PlanItem[];
  aeoScores: AeoScores | null;
  onStatusChange: (id: string, status: PlanItem["status"]) => Promise<void>;
  onVerify: (id: string) => Promise<void>;
  onExplainerOpen: (layerKey: string) => void;
  verifying: string | null;
}

function LayerSection({
  layerKey,
  items,
  aeoScores,
  onStatusChange,
  onVerify,
  onExplainerOpen,
  verifying,
}: LayerSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const score = aeoScores?.[layerKey]?.score ?? null;
  const label = DIMENSION_LABELS[layerKey];

  if (items.length === 0) return null;

  return (
    <div className="mb-4" id={`layer-${layerKey}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-900">{label}</span>
          {score !== null && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${barColor(score)}20`,
                color: barColor(score),
              }}
            >
              {score}/10
            </span>
          )}
          <span className="text-xs text-gray-400">{items.length} items</span>
        </div>
        <span className="text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <IssueCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onVerify={onVerify}
              onExplainerOpen={onExplainerOpen}
              verifying={verifying}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PlanClient({
  scanId,
  brand,
  scanDate,
  overallScore,
  websiteUrl: _websiteUrl, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialItems,
  isSample = false,
  tokenBalance = 0,
  planTokenCost = 200,
  aeoScores,
  overallAeoReadiness,
}: PlanClientProps) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [viewMode, setViewMode] = useState<"funnel" | "layer">("funnel");
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [quickWinsOnly, setQuickWinsOnly] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(["awareness", "consideration", "competition", "conversion"])
  );
  const [activeExplainer, setActiveExplainer] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  // Status update
  async function updateStatus(itemId: string, newStatus: PlanItem["status"]) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
    );
    await fetch("/api/plan/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, status: newStatus }),
    });
  }

  // Verify item
  async function verifyItem(itemId: string) {
    setVerifying(itemId);
    const res = await fetch("/api/plan/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    });
    const data = await res.json();
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: data.passed ? "verified" : "failed",
              verified_at: new Date().toISOString(),
              verification_result: data,
            }
          : i
      )
    );
    setVerifying(null);
  }

  // Generate plan
  async function generatePlan() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: scanId }),
      });
      const data = await res.json();
      if (res.status === 402) {
        throw new Error(`Not enough tokens. You need ${data.required} tokens but have ${data.balance}.`);
      }
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      window.location.reload();
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Failed");
      setGenerating(false);
    }
  }

  // Filter
  function filterItems(source: PlanItem[]): PlanItem[] {
    let result = [...source];
    if (priorityFilter.length > 0)
      result = result.filter((i) => priorityFilter.includes(i.priority));
    if (quickWinsOnly)
      result = result.filter(
        (i) =>
          ["critical", "high"].includes(i.priority) &&
          ["5 minutes", "30 minutes", "1 hour"].includes(i.effort)
      );
    return result;
  }

  // Scroll to layer section
  function scrollToLayer(layerKey: AeoDimensionKey) {
    if (viewMode === "layer") {
      const el = document.getElementById(`layer-${layerKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Find which funnel stage contains this layer and expand it
      const stage = FUNNEL_STAGES.find((s) =>
        (s.layers as string[]).includes(layerKey)
      );
      if (stage) {
        setExpandedStages((prev) => {
          const next = new Set(prev);
          next.add(stage.id);
          return next;
        });
        setTimeout(() => {
          const el = document.getElementById(`stage-${stage.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }

  function togglePriorityFilter(p: string) {
    setPriorityFilter((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleStage(id: string) {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredItems = filterItems(items);
  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const total = items.length;
  const progressPct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link
                href={`/app/report/${scanId}`}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Report
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Improvement Plan — {brand}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Based on scan from {scanDate} · ShowsUp Score: {overallScore}/100
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                type="button"
                onClick={() => console.log("Re-verify all")}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Re-verify all
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {items.length === 0 ? (
            /* Fallback empty state (shouldn't normally appear) */
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-lg w-full text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Generate Your AI Improvement Plan
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  We&apos;ll analyze your website and scan data across 10 research-backed
                  dimensions to create a personalized improvement roadmap.
                </p>
                {generateError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {generateError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={generatePlan}
                  disabled={generating}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Sample paywall banner */}
              {isSample && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      Preview — Sample Plan for Dyson
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Generate your personalised plan to see real findings for {brand}.
                    </p>
                  </div>
                </div>
              )}

              {/* Blurred wrapper for sample mode */}
              <div className={isSample ? "relative" : ""}>
                {isSample && (
                  <div
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
                    style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.55)" }}
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-w-md w-full mx-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-7 h-7 text-emerald-500" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 mb-2">
                        Unlock Your AI Improvement Plan
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed mb-1">
                        Get a personalised, data-driven roadmap across 10 AEO dimensions
                        based on your actual scan for <strong>{brand}</strong>.
                      </p>
                      <p className="text-xs text-gray-400 mb-5">
                        Costs {planTokenCost} tokens · Balance: {tokenBalance === Infinity ? "unlimited" : tokenBalance}
                      </p>
                      {generateError && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                          {generateError}
                        </div>
                      )}
                      {(tokenBalance ?? 0) < (planTokenCost ?? 200) && tokenBalance !== Infinity ? (
                        <div className="text-sm text-red-600 font-medium">
                          Not enough tokens. You need {planTokenCost} but have {tokenBalance}.
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={generatePlan}
                          disabled={generating}
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
                        >
                          {generating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Generating your plan…
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Generate Plan ({planTokenCost} tokens)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Progress bar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Plan Progress
                  </span>
                  <span className="text-sm text-gray-500">
                    {verifiedCount} of {total} verified
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{ width: `${progressPct}%`, backgroundColor: "#10B981" }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{progressPct}% complete</p>
              </div>

              {/* AEO Readiness Radar */}
              {aeoScores && (
                <AeoRadar
                  aeoScores={aeoScores}
                  overallAeoReadiness={overallAeoReadiness}
                  onDimensionClick={scrollToLayer}
                />
              )}

              {/* Filter bar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
                {/* View toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("funnel")}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                      viewMode === "funnel"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    By Funnel
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("layer")}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                      viewMode === "layer"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    By Layer
                  </button>
                </div>

                {/* Priority filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: "all", label: "All" },
                    { key: "critical", label: "🔴 Critical" },
                    { key: "high", label: "🟡 High" },
                    { key: "medium", label: "🔵 Medium" },
                    { key: "low", label: "⚪ Low" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === "all") {
                          setPriorityFilter([]);
                        } else {
                          togglePriorityFilter(key);
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        key === "all" && priorityFilter.length === 0
                          ? "bg-gray-900 text-white border-gray-900"
                          : key !== "all" && priorityFilter.includes(key)
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Quick wins toggle */}
                <button
                  type="button"
                  onClick={() => setQuickWinsOnly((v) => !v)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    quickWinsOnly
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Quick Wins
                </button>

                {/* Item count */}
                <span className="text-xs text-gray-400 ml-auto">
                  {filteredItems.length} of {total} items
                </span>
              </div>

              {/* Content sections */}
              {viewMode === "funnel" ? (
                <div>
                  {FUNNEL_STAGES.map((stage) => {
                    const stageItems = filteredItems
                      .filter((i) => i.funnel_stage === stage.id)
                      .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

                    return (
                      <StageSection
                        key={stage.id}
                        stage={stage}
                        items={stageItems}
                        aeoScores={aeoScores}
                        expanded={expandedStages.has(stage.id)}
                        onToggle={() => toggleStage(stage.id)}
                        onStatusChange={updateStatus}
                        onVerify={verifyItem}
                        onExplainerOpen={setActiveExplainer}
                        verifying={verifying}
                      />
                    );
                  })}
                </div>
              ) : (
                <div>
                  {AEO_DIMENSION_KEYS.map((key) => {
                    const layerItems = filteredItems
                      .filter((i) => layerToKey(i.layer) === key)
                      .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

                    return (
                      <LayerSection
                        key={key}
                        layerKey={key}
                        items={layerItems}
                        aeoScores={aeoScores}
                        onStatusChange={updateStatus}
                        onVerify={verifyItem}
                        onExplainerOpen={setActiveExplainer}
                        verifying={verifying}
                      />
                    );
                  })}
                </div>
              )}
              </div>{/* end blurred wrapper */}
            </>
          )}
        </div>
      </div>

      {/* Explainer Modal */}
      {activeExplainer && (
        <ExplainerModal
          layerKey={activeExplainer}
          onClose={() => setActiveExplainer(null)}
        />
      )}
    </div>
  );
}
