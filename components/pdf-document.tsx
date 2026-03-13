// This file is intentionally NOT "use client" — it's loaded dynamically and only runs client-side.
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

interface ModelResult {
  model: string;
  label: string;
  score: number;
  mentioned: boolean;
}

interface CompetitorEntry {
  name: string;
  mention_rate: number;
  avg_position: number | null;
  recommend_count: number;
  sentiment: "positive" | "neutral" | "negative" | null;
}

interface ShareOfVoiceEntry {
  name: string;
  share: number;
  mentions: number;
  isBrand: boolean;
}

export interface PDFCompetitorsData {
  brand_profile: CompetitorEntry;
  competitors: CompetitorEntry[];
  share_of_voice: ShareOfVoiceEntry[];
  insights: string[];
}

export interface ShowsUpPDFProps {
  brand: string;
  score: number;
  date: string;
  category?: string;
  url?: string;
  modelResults: ModelResult[];
  recommendations: Recommendation[];
  categoryScores?: Record<string, number>;
  competitorsData?: PDFCompetitorsData;
}

// ── Color constants ────────────────────────────────────────────────────────────

const GREEN  = "#10B981";
const TEAL   = "#14B8A6";
const AMBER  = "#F59E0B";
const RED    = "#EF4444";
const DARK   = "#111827";
const DARKGRAY  = "#374151";
const MIDGRAY   = "#6B7280";
const LIGHTGRAY = "#F3F4F6";
const DIVIDER   = "#E5E7EB";

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 71 ? GREEN : s >= 51 ? TEAL : s >= 31 ? AMBER : RED;
}

function barColor(s: number) {
  return s >= 51 ? GREEN : s >= 31 ? AMBER : RED;
}

function scoreVerdict(s: number) {
  if (s >= 71) return "Excellent visibility — AI consistently recommends your brand";
  if (s >= 51) return "Good presence — appearing in most AI responses";
  if (s >= 31) return "Partial presence — room to grow";
  return "Low visibility — action needed";
}

function priorityColor(p: string): string {
  if (p === "High")   return RED;
  if (p === "Medium") return AMBER;
  return MIDGRAY;
}

const CATEGORY_LABELS: Record<string, string> = {
  awareness:       "Direct Awareness",
  discovery:       "Category Discovery",
  competitive:     "Competitive Positioning",
  purchase_intent: "Purchase Intent",
  alternatives:    "Alternatives",
  reputation:      "Reputation & Reviews",
};

const CATEGORY_ORDER = [
  "awareness", "discovery", "competitive",
  "purchase_intent", "alternatives", "reputation",
];

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 48,
    paddingBottom: 72,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
  },
  // Header strip
  headerStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: GREEN,
  },
  // Logo row
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },
  logoText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
  },
  logoSep: {
    width: 1,
    height: 14,
    backgroundColor: DIVIDER,
    marginHorizontal: 8,
  },
  logoSubtitle: {
    fontSize: 11,
    color: MIDGRAY,
  },
  // Section titles
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  subsectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: MIDGRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 16,
  },
  // Brand header (Page 1)
  brandName: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },
  brandMeta: {
    fontSize: 10,
    color: MIDGRAY,
    marginBottom: 3,
  },
  // Score box
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    backgroundColor: LIGHTGRAY,
    borderRadius: 10,
    padding: 24,
    marginBottom: 24,
    marginTop: 4,
  },
  scoreNumber: {
    fontSize: 64,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
  },
  scoreOutOf: {
    fontSize: 18,
    color: MIDGRAY,
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 10,
    color: MIDGRAY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  scoreVerdict: {
    fontSize: 12,
    color: DARKGRAY,
    marginTop: 6,
    fontFamily: "Helvetica-BoldOblique",
  },
  // Category badge
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    color: "#3B82F6",
    fontFamily: "Helvetica-Bold",
  },
  // Bar
  barRow: {
    marginBottom: 10,
  },
  barLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barLabelText: {
    fontSize: 10,
    color: DARKGRAY,
  },
  barLabelValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  barTrack: {
    height: 7,
    backgroundColor: DIVIDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  // Platform row
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  platformLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformLabel: {
    fontSize: 11,
    color: DARKGRAY,
  },
  platformBadge: {
    fontSize: 9,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontFamily: "Helvetica-Bold",
  },
  platformScore: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  // Table
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: DIVIDER,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  tableCell: {
    fontSize: 10,
    color: DARKGRAY,
  },
  tableCellBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MIDGRAY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Insight row
  insightRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  insightArrow: {
    fontSize: 11,
    color: GREEN,
    marginTop: 1,
  },
  insightText: {
    fontSize: 10,
    color: DARKGRAY,
    lineHeight: 1.5,
    flex: 1,
  },
  // Recommendation card
  recCard: {
    backgroundColor: LIGHTGRAY,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  recBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    flex: 1,
  },
  recDesc: {
    fontSize: 9,
    color: MIDGRAY,
    lineHeight: 1.5,
    marginLeft: 46,
  },
  // Footer (fixed)
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: MIDGRAY,
  },
});

// ── Sub-components ─────────────────────────────────────────────────────────────

function HeaderStrip() {
  return <View style={S.headerStrip} fixed />;
}

function LogoRow({ subtitle }: { subtitle?: string }) {
  return (
    <View style={S.logoRow}>
      <Text style={S.logoText}>ShowsUp</Text>
      <View style={S.logoSep} />
      <Text style={S.logoSubtitle}>{subtitle ?? "AI Visibility Report"}</Text>
    </View>
  );
}

function Footer({ date }: { date: string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>Generated by ShowsUp — showsup.co · {date}</Text>
      <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = barColor(score);
  return (
    <View style={S.barRow}>
      <View style={S.barLabel}>
        <Text style={S.barLabelText}>{label}</Text>
        <Text style={[S.barLabelValue, { color }]}>{score}/100</Text>
      </View>
      <View style={S.barTrack}>
        <View style={{ height: 7, width: `${score}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

const MODEL_COLORS: Record<string, string> = {
  chatgpt: GREEN,
  claude: "#C084FC",
  gemini: "#60A5FA",
};

// ── Page 1: Brand Overview + Score ────────────────────────────────────────────

function Page1({
  brand, score, date, category, url, modelResults,
}: Pick<ShowsUpPDFProps, "brand" | "score" | "date" | "category" | "url" | "modelResults">) {
  const color = scoreColor(score);
  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow />

      {/* Brand header */}
      <Text style={S.brandName}>{brand}</Text>
      {url && <Text style={S.brandMeta}>{url}</Text>}
      <Text style={S.brandMeta}>{date}</Text>
      {category && (
        <View style={S.categoryBadge}>
          <Text style={S.categoryBadgeText}>{category}</Text>
        </View>
      )}

      {/* Score block */}
      <View style={[S.scoreBox, { marginTop: 20 }]}>
        <View>
          <Text style={[S.scoreNumber, { color }]}>{score}</Text>
          <Text style={S.scoreOutOf}>/100</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.scoreLabel}>Overall AI Visibility Score</Text>
          <Text style={[S.scoreVerdict, { color }]}>{scoreVerdict(score)}</Text>
        </View>
      </View>

      {/* Platform breakdown */}
      <Text style={S.sectionTitle}>Platform Scores</Text>
      {modelResults.map((mr) => {
        const dotColor = MODEL_COLORS[mr.model] ?? MIDGRAY;
        const sc = scoreColor(mr.score);
        return (
          <View key={mr.model} style={S.platformRow}>
            <View style={S.platformLeft}>
              <View style={[S.platformDot, { backgroundColor: dotColor }]} />
              <Text style={S.platformLabel}>{mr.label}</Text>
              <Text style={[
                S.platformBadge,
                mr.mentioned
                  ? { backgroundColor: "#D1FAE5", color: "#065F46" }
                  : { backgroundColor: LIGHTGRAY, color: MIDGRAY },
              ]}>
                {mr.mentioned ? "Mentioned" : "Not found"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 100 }}>
                <ScoreBar label="" score={mr.score} />
              </View>
              <Text style={[S.platformScore, { color: sc }]}>{mr.score}</Text>
            </View>
          </View>
        );
      })}

      <Footer date={date} />
    </Page>
  );
}

// ── Page 2: Visibility Breakdown ──────────────────────────────────────────────

function Page2({
  categoryScores, overallScore, date,
}: { categoryScores?: Record<string, number>; overallScore: number; date: string }) {
  // Use real scores when available; fall back to overall score as proxy
  const hasReal = !!(categoryScores && Object.values(categoryScores).some((v) => v > 0));
  const scores  = hasReal ? categoryScores! : Object.fromEntries(CATEGORY_ORDER.map((c) => [c, overallScore]));

  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="Visibility Breakdown" />
      <Text style={S.sectionTitle}>Visibility Breakdown</Text>
      <Text style={{ fontSize: 10, color: MIDGRAY, marginBottom: 20, lineHeight: 1.5 }}>
        {hasReal
          ? "How your brand performs across different types of AI queries. Each score reflects the weighted combination of mention rate, position, recommendations, and sentiment."
          : "Detailed per-category scores are available on new scans. The chart below shows your overall AI visibility score across all query types."}
      </Text>
      <View>
        {CATEGORY_ORDER.map((cat) => (
          <View key={cat} style={{ marginBottom: 14 }}>
            <ScoreBar label={CATEGORY_LABELS[cat] ?? cat} score={scores[cat] ?? 0} />
          </View>
        ))}
      </View>
      {!hasReal && (
        <Text style={{ fontSize: 9, color: MIDGRAY, marginTop: 8, fontFamily: "Helvetica-Oblique" }}>
          * Run a new scan to see per-category breakdown scores.
        </Text>
      )}
      <Footer date={date} />
    </Page>
  );
}

// ── Page 3: Competitive Benchmark ─────────────────────────────────────────────

const SOV_COLORS = [GREEN, "#60A5FA", "#C084FC", AMBER, "#F472B6"];

function Page3({
  competitorsData, brand, date,
}: { competitorsData: PDFCompetitorsData; brand: string; date: string }) {
  const { brand_profile, competitors, share_of_voice, insights } = competitorsData;
  const allEntries = [brand_profile, ...competitors];

  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="Competitive Benchmark" />
      <Text style={S.sectionTitle}>Competitive Benchmark</Text>

      {/* Share of Voice */}
      {share_of_voice.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={S.subsectionTitle}>Share of Voice</Text>
          {share_of_voice.map((entry, i) => (
            <View key={entry.name} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: entry.isBrand ? DARK : DARKGRAY, fontFamily: entry.isBrand ? "Helvetica-Bold" : "Helvetica" }}>
                  {entry.name}{entry.isBrand ? " (you)" : ""}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: SOV_COLORS[i % SOV_COLORS.length] }}>
                  {entry.share}%
                </Text>
              </View>
              <View style={S.barTrack}>
                <View style={{ height: 7, width: `${entry.share}%`, backgroundColor: SOV_COLORS[i % SOV_COLORS.length], borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Head-to-Head table */}
      {allEntries.length > 1 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={S.subsectionTitle}>Head-to-Head</Text>
          <View style={S.table}>
            <View style={S.tableHeader}>
              <Text style={[S.tableHeaderCell, { flex: 2 }]}>Brand</Text>
              <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Mention Rate</Text>
              <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Avg Position</Text>
              <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Recommended</Text>
              <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Sentiment</Text>
            </View>
            {allEntries.map((entry, i) => {
              const isBrand = i === 0;
              const sentColor = entry.sentiment === "positive" ? GREEN : entry.sentiment === "negative" ? RED : MIDGRAY;
              return (
                <View key={entry.name} style={S.tableRow}>
                  <Text style={[isBrand ? S.tableCellBold : S.tableCell, { flex: 2 }]}>
                    {entry.name}{isBrand ? " ✦" : ""}
                  </Text>
                  <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>{entry.mention_rate}%</Text>
                  <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>
                    {entry.avg_position !== null ? `#${entry.avg_position}` : "—"}
                  </Text>
                  <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>{entry.recommend_count}×</Text>
                  <Text style={[S.tableCell, { flex: 1, textAlign: "right", color: sentColor }]}>
                    {entry.sentiment ? entry.sentiment.charAt(0).toUpperCase() + entry.sentiment.slice(1) : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={{ fontSize: 8, color: MIDGRAY, marginTop: 6 }}>✦ = {brand} (your brand)</Text>
        </View>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <View>
          <Text style={S.subsectionTitle}>Key Insights</Text>
          {insights.map((insight, i) => (
            <View key={i} style={S.insightRow}>
              <Text style={S.insightArrow}>→</Text>
              <Text style={S.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      <Footer date={date} />
    </Page>
  );
}

// ── Page 4: Recommendations ───────────────────────────────────────────────────

function scoreBasedFallbacks(score: number): Recommendation[] {
  const recs: Recommendation[] = [];
  if (score < 30) {
    recs.push({ title: "Establish AI-friendly content", description: "Create clear, authoritative content about your brand that AI models can reference. Focus on your unique value proposition and ensure your website clearly explains what you do.", priority: "High" });
    recs.push({ title: "Build brand mentions across the web", description: "Get cited in industry publications, review sites, and comparison articles to increase your brand's presence in AI training data and retrieval.", priority: "High" });
  } else if (score < 60) {
    recs.push({ title: "Strengthen competitive positioning", description: "Publish comparison content between your brand and key competitors to appear in alternative-seeking queries across AI models.", priority: "High" });
    recs.push({ title: "Improve category discovery", description: "Ensure your brand appears on major review and listing sites for your category — G2, Capterra, Trustpilot, and similar platforms that AI models frequently cite.", priority: "High" });
  } else {
    recs.push({ title: "Maintain and expand your AI presence", description: "Your brand has good AI visibility. Continue creating high-quality content and getting cited in authoritative sources to hold and grow your position.", priority: "Medium" });
  }
  recs.push({ title: "Optimise for category keywords", description: "Ensure your website prominently features relevant industry terminology so AI models consistently associate your brand with the right category.", priority: "Medium" });
  recs.push({ title: "Gather and publish customer reviews", description: "AI models frequently cite review content. Actively collect testimonials and ensure they appear on authoritative platforms like G2, Capterra, and Trustpilot.", priority: "Medium" });
  recs.push({ title: "Monitor your AI visibility regularly", description: "Run weekly scans to track progress, identify which query types are improving, and measure the impact of your content efforts over time.", priority: "Low" });
  return recs.slice(0, 5);
}

function buildAutoRecs(
  categoryScores: Record<string, number> | undefined,
  existingRecs: Recommendation[],
  score: number,
  topCompetitor?: string
): Recommendation[] {
  const recs = [...existingRecs];

  // When there's nothing at all, generate from overall score
  if (recs.length === 0 && !categoryScores) {
    return scoreBasedFallbacks(score);
  }

  if (!categoryScores) return recs.slice(0, 5);

  // Augment with category-specific guidance if the existing recs are sparse
  const extra: Recommendation[] = [];

  if ((categoryScores["awareness"] ?? 100) < 50) {
    extra.push({ title: "Improve direct awareness", description: "Ensure your brand has a strong Wikipedia page, updated LinkedIn profile, and clear brand positioning so AI models recognise it directly.", priority: "High" });
  }
  if ((categoryScores["discovery"] ?? 100) < 50) {
    extra.push({ title: "Boost category discovery", description: "Create comprehensive comparison content and get listed on major review sites like G2, Capterra, or Trustpilot to appear in category searches.", priority: "High" });
  }
  if ((categoryScores["competitive"] ?? 100) < 50) {
    extra.push({ title: "Strengthen competitive positioning", description: `Publish detailed comparison pages showing your advantages${topCompetitor ? ` over ${topCompetitor}` : " over key competitors"} to surface in competitive queries.`, priority: "High" });
  }
  if ((categoryScores["purchase_intent"] ?? 100) < 50) {
    extra.push({ title: "Improve purchase-intent visibility", description: "Create buying guides, pricing pages, and 'best for' content targeting specific use cases to appear in high-intent queries.", priority: "Medium" });
  }
  if ((categoryScores["alternatives"] ?? 100) < 50) {
    extra.push({ title: "Increase 'alternatives to' presence", description: "Ensure your brand is mentioned on comparison and alternatives sites — submit to AlternativeTo, Slant, and niche directories.", priority: "Medium" });
  }
  if ((categoryScores["reputation"] ?? 100) < 50) {
    extra.push({ title: "Strengthen reputation signals", description: "Encourage customer reviews, case studies, and media coverage. AI models frequently cite well-reviewed brands in trust-related queries.", priority: "Medium" });
  }

  // Merge: keep existing then fill with extras that don't duplicate
  const existingTitles = new Set(recs.map((r) => r.title.toLowerCase()));
  for (const e of extra) {
    if (!existingTitles.has(e.title.toLowerCase())) recs.push(e);
    if (recs.length >= 5) break;
  }

  return recs.slice(0, 5);
}

function Page4({
  recommendations, categoryScores, competitorsData, date, score,
}: {
  recommendations: Recommendation[];
  categoryScores?: Record<string, number>;
  competitorsData?: PDFCompetitorsData;
  date: string;
  score: number;
}) {
  const topCompetitor = competitorsData?.competitors?.[0]?.name;
  const finalRecs = buildAutoRecs(categoryScores, recommendations, score, topCompetitor);

  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="Recommendations" />
      <Text style={S.sectionTitle}>Recommendations</Text>
      <Text style={{ fontSize: 10, color: MIDGRAY, marginBottom: 20, lineHeight: 1.5 }}>
        Prioritised actions to improve your AI visibility score, based on your scan results.
      </Text>

      {finalRecs.map((rec, i) => {
        const bg = rec.priority === "High" ? "#FEF2F2" : rec.priority === "Medium" ? "#FFFBEB" : LIGHTGRAY;
        const pColor = priorityColor(rec.priority);
        const pBg   = rec.priority === "High" ? "#FEE2E2" : rec.priority === "Medium" ? "#FEF3C7" : DIVIDER;
        return (
          <View key={i} style={[S.recCard, { backgroundColor: bg }]} wrap={false}>
            <View style={S.recHeader}>
              <Text style={[S.recBadge, { backgroundColor: pBg, color: pColor }]}>
                {rec.priority}
              </Text>
              <Text style={S.recTitle}>{`${i + 1}. ${rec.title}`}</Text>
            </View>
            <Text style={S.recDesc}>{rec.description}</Text>
          </View>
        );
      })}

      {/* Competitive insights as extra recommendations */}
      {competitorsData?.insights && competitorsData.insights.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={S.subsectionTitle}>Competitive Context</Text>
          {competitorsData.insights.map((ins, i) => (
            <View key={i} style={S.insightRow}>
              <Text style={S.insightArrow}>→</Text>
              <Text style={S.insightText}>{ins}</Text>
            </View>
          ))}
        </View>
      )}

      <Footer date={date} />
    </Page>
  );
}

// ── Extended types for tiered PDFs ────────────────────────────────────────────

export interface ImprovementPlanItem {
  title: string;
  description: string;
  impact: string;
  effort: string;
  affected_categories: string[];
}

export interface ExtendedPDFProps extends ShowsUpPDFProps {
  improvementPlan?: {
    quick_wins: ImprovementPlanItem[];
    this_month: ImprovementPlanItem[];
    this_quarter: ImprovementPlanItem[];
  } | null;
  citationData?: {
    cited_pages: Array<{ url: string; count: number }>;
    insight: string;
  } | null;
  perceptionData?: {
    summary: string;
    positive_descriptors: string[];
    negative_descriptors: string[];
  } | null;
  scanResults?: Array<{
    model: string;
    prompt: string;
    brand_mentioned: boolean;
    score: number;
  }>;
  execSummary?: string;
}

// ── Free Sample PDF ────────────────────────────────────────────────────────────

function SampleCoverPage({ brand, score, date }: { brand: string; score: number; date: string }) {
  const color = scoreColor(score);
  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow />

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
        <Text style={{ fontSize: 11, color: MIDGRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
          AI Visibility Report
        </Text>
        <Text style={{ fontSize: 40, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8, textAlign: "center" }}>
          {brand}
        </Text>
        <Text style={{ fontSize: 11, color: MIDGRAY, marginBottom: 40 }}>{date}</Text>

        {/* Score circle */}
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: LIGHTGRAY, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 56, fontFamily: "Helvetica-Bold", color }}>{score}</Text>
          <Text style={{ fontSize: 13, color: MIDGRAY }}>/ 100</Text>
        </View>

        <Text style={{ fontSize: 14, fontFamily: "Helvetica-BoldOblique", color, marginBottom: 8 }}>
          {scoreVerdict(score)}
        </Text>
        <Text style={{ fontSize: 10, color: MIDGRAY, textAlign: "center", maxWidth: 300 }}>
          This is a sample preview of your AI Visibility Report.
          Unlock the full report for complete competitive analysis, recommendations, and improvement plan.
        </Text>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: DIVIDER, paddingTop: 16, alignItems: "center" }}>
        <Text style={{ fontSize: 10, color: MIDGRAY }}>Generated by ShowsUp — showsup.co</Text>
      </View>
    </Page>
  );
}

function SampleScoresPage({ modelResults, date }: { modelResults: ShowsUpPDFProps["modelResults"]; date: string }) {
  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="Platform Scores" />
      <Text style={S.sectionTitle}>Platform Breakdown</Text>
      {modelResults.map((mr) => {
        const dotColor = MODEL_COLORS[mr.model] ?? MIDGRAY;
        const sc = scoreColor(mr.score);
        return (
          <View key={mr.model} style={S.platformRow}>
            <View style={S.platformLeft}>
              <View style={[S.platformDot, { backgroundColor: dotColor }]} />
              <Text style={S.platformLabel}>{mr.label}</Text>
              <Text style={[S.platformBadge, mr.mentioned ? { backgroundColor: "#D1FAE5", color: "#065F46" } : { backgroundColor: LIGHTGRAY, color: MIDGRAY }]}>
                {mr.mentioned ? "Mentioned" : "Not found"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 100 }}><ScoreBar label="" score={mr.score} /></View>
              <Text style={[S.platformScore, { color: sc }]}>{mr.score}</Text>
            </View>
          </View>
        );
      })}
      <Footer date={date} />
    </Page>
  );
}

function SampleWatermarkPage({ brand, date }: { brand: string; date: string }) {
  const blurRow = (width1: number, width2?: number) => (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
      <View style={{ height: 10, width: `${width1}%`, backgroundColor: DIVIDER, borderRadius: 3 }} />
      {width2 && <View style={{ height: 10, width: `${width2}%`, backgroundColor: LIGHTGRAY, borderRadius: 3 }} />}
    </View>
  );

  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="Full Report Preview" />

      {/* Watermark */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 10 }}>
        <Text style={{
          fontSize: 72, fontFamily: "Helvetica-Bold",
          color: "rgba(0,0,0,0.06)", transform: "rotate(-35deg)",
          letterSpacing: 4,
        }}>
          SAMPLE
        </Text>
      </View>

      <Text style={S.sectionTitle}>Competitor Analysis</Text>
      {blurRow(60, 30)}
      {blurRow(45, 40)}
      {blurRow(70, 20)}
      {blurRow(55, 35)}

      <Text style={[S.sectionTitle, { marginTop: 20 }]}>Recommendations</Text>
      {blurRow(80)}
      {blurRow(65, 25)}
      {blurRow(75)}
      {blurRow(50, 40)}

      <Text style={[S.sectionTitle, { marginTop: 20 }]}>Improvement Plan</Text>
      {blurRow(70, 20)}
      {blurRow(55, 35)}
      {blurRow(60, 30)}

      {/* CTA box */}
      <View style={{ marginTop: 24, backgroundColor: "#F0FDF4", borderRadius: 10, padding: 20, borderWidth: 1, borderColor: "#BBF7D0" }}>
        <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#065F46", marginBottom: 6, textAlign: "center" }}>
          Unlock the Full Report for {brand}
        </Text>
        <Text style={{ fontSize: 10, color: MIDGRAY, textAlign: "center", lineHeight: 1.6, marginBottom: 12 }}>
          Get complete competitor analysis, prioritised recommendations, improvement plan,
          citation tracking, sentiment analysis, and industry benchmarks.
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: GREEN, textAlign: "center" }}>
          showsup.co
        </Text>
      </View>

      <Footer date={date} />
    </Page>
  );
}

// ── Improvement Plan Pages ─────────────────────────────────────────────────────

function ImprovementPlanPage({ plan, date }: { plan: NonNullable<ExtendedPDFProps["improvementPlan"]>; date: string }) {
  const tiers = [
    { key: "quick_wins" as const,   label: "Quick Wins",   color: GREEN,     desc: "Do this week"    },
    { key: "this_month" as const,   label: "This Month",   color: AMBER,     desc: "Do this month"   },
    { key: "this_quarter" as const, label: "This Quarter", color: "#6366F1", desc: "Do this quarter" },
  ];

  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="AI Improvement Plan" />
      <Text style={S.sectionTitle}>90-Day Improvement Plan</Text>
      <Text style={{ fontSize: 10, color: MIDGRAY, marginBottom: 16, lineHeight: 1.5 }}>
        A prioritised action plan to boost your AI visibility score.
        Items are sorted by expected impact relative to implementation effort.
      </Text>

      {tiers.map(({ key, label, color, desc }) => {
        const items = plan[key] ?? [];
        if (items.length === 0) return null;
        return (
          <View key={key} style={{ marginBottom: 16 }} wrap={false}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK }}>{label}</Text>
              <Text style={{ fontSize: 8, color, fontFamily: "Helvetica-Bold" }}>— {desc}</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={{ backgroundColor: LIGHTGRAY, borderRadius: 6, padding: 10, marginBottom: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK, flex: 1 }}>{item.title}</Text>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Text style={{ fontSize: 8, color: GREEN, fontFamily: "Helvetica-Bold" }}>{item.impact}</Text>
                    <Text style={{ fontSize: 8, color: MIDGRAY }}>· {item.effort}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 9, color: MIDGRAY, lineHeight: 1.4 }}>{item.description}</Text>
              </View>
            ))}
          </View>
        );
      })}

      <Footer date={date} />
    </Page>
  );
}

// ── Appendix Page ──────────────────────────────────────────────────────────────

function AppendixPage({ scanResults, brand, date }: {
  scanResults: NonNullable<ExtendedPDFProps["scanResults"]>;
  brand: string;
  date: string;
}) {
  const byModel: Record<string, typeof scanResults> = {};
  for (const r of scanResults) {
    if (!byModel[r.model]) byModel[r.model] = [];
    byModel[r.model]!.push(r);
  }

  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <LogoRow subtitle="Query Appendix" />
      <Text style={S.sectionTitle}>Appendix — All Queries</Text>
      <Text style={{ fontSize: 10, color: MIDGRAY, marginBottom: 16 }}>
        Summary of all {scanResults.length} queries tested across AI platforms for {brand}.
      </Text>

      {Object.entries(byModel).map(([modelId, results]) => {
        const mentioned = results.filter(r => r.brand_mentioned).length;
        const avgScore  = Math.round(results.reduce((s, r) => s + r.score, 0) / Math.max(1, results.length));
        const label     = modelId === "chatgpt" ? "ChatGPT" : modelId === "claude" ? "Claude" : modelId;
        return (
          <View key={modelId} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1.5, borderBottomColor: DIVIDER, marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK }}>{label}</Text>
              <Text style={{ fontSize: 10, color: MIDGRAY }}>
                {mentioned}/{results.length} mentions · Avg score: {avgScore}
              </Text>
            </View>
            {results.map((r, i) => (
              <View key={i} style={{ flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: LIGHTGRAY }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: r.brand_mentioned ? "#D1FAE5" : LIGHTGRAY, alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 1, flexShrink: 0 }}>
                  <Text style={{ fontSize: 7, color: r.brand_mentioned ? "#065F46" : MIDGRAY }}>{r.brand_mentioned ? "✓" : "✗"}</Text>
                </View>
                <Text style={{ fontSize: 9, color: DARKGRAY, flex: 1, lineHeight: 1.4 }}>{r.prompt}</Text>
                <Text style={{ fontSize: 9, color: scoreColor(r.score), fontFamily: "Helvetica-Bold", marginLeft: 8 }}>{r.score}</Text>
              </View>
            ))}
          </View>
        );
      })}

      <Footer date={date} />
    </Page>
  );
}

// ── Executive Summary Page (Board-Ready) ──────────────────────────────────────

function ExecSummaryPage({ brand, score, category, execSummary, date }: {
  brand: string; score: number; category?: string; execSummary: string; date: string;
}) {
  const color = scoreColor(score);
  return (
    <Page size="A4" style={S.page}>
      <HeaderStrip />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <LogoRow subtitle="Board-Ready Report" />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 9, color: MIDGRAY, textTransform: "uppercase", letterSpacing: 0.5 }}>Prepared for Leadership</Text>
          <Text style={{ fontSize: 9, color: MIDGRAY }}>{date}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 4 }}>
        AI Visibility Report
      </Text>
      <Text style={{ fontSize: 16, color: scoreColor(score), fontFamily: "Helvetica-Bold", marginBottom: 20 }}>
        {brand}{category ? ` — ${category}` : ""}
      </Text>

      {/* Score highlight */}
      <View style={{ flexDirection: "row", gap: 20, marginBottom: 24, backgroundColor: LIGHTGRAY, borderRadius: 8, padding: 16 }}>
        <View style={{ alignItems: "center", justifyContent: "center", width: 80 }}>
          <Text style={{ fontSize: 48, fontFamily: "Helvetica-Bold", color, lineHeight: 1 }}>{score}</Text>
          <Text style={{ fontSize: 10, color: MIDGRAY }}>/100</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color, marginBottom: 4 }}>{scoreVerdict(score)}</Text>
          <Text style={{ fontSize: 9, color: MIDGRAY, lineHeight: 1.5 }}>
            AI Visibility Score reflects how frequently and prominently your brand appears in responses
            from large language models when users ask questions in your category.
          </Text>
        </View>
      </View>

      <Text style={S.sectionTitle}>Executive Summary</Text>
      <Text style={{ fontSize: 11, color: DARKGRAY, lineHeight: 1.7 }}>{execSummary}</Text>

      <Footer date={date} />
    </Page>
  );
}

// ── Board-Ready Cover Page ─────────────────────────────────────────────────────

function BoardCoverPage({ brand, score, date, category }: { brand: string; score: number; date: string; category?: string }) {
  const color = scoreColor(score);
  return (
    <Page size="A4" style={{ backgroundColor: DARK, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0 }}>
      {/* Green top band */}
      <View style={{ backgroundColor: GREEN, height: 8 }} />

      <View style={{ flex: 1, paddingHorizontal: 56, paddingTop: 64, paddingBottom: 48 }}>
        {/* Logo */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 80 }}>
          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: GREEN }}>ShowsUp</Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>AI Visibility Intelligence</Text>
        </View>

        {/* Main title area */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
            Board-Ready Report
          </Text>
          <Text style={{ fontSize: 44, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 8, lineHeight: 1.1 }}>
            {brand}
          </Text>
          {category && (
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>{category}</Text>
          )}

          {/* Score */}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 72, fontFamily: "Helvetica-Bold", color, lineHeight: 1 }}>{score}</Text>
            <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>/100</Text>
          </View>
          <Text style={{ fontSize: 14, color, fontFamily: "Helvetica-BoldOblique" }}>{scoreVerdict(score)}</Text>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 16 }}>
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>CONFIDENTIAL — {date}</Text>
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>showsup.co</Text>
        </View>
      </View>
    </Page>
  );
}

// ── Three-tier Document exports ────────────────────────────────────────────────

export function FreeSamplePDF(props: ExtendedPDFProps) {
  const { brand, score, date, modelResults } = props;
  return (
    <Document title={`ShowsUp Sample — ${brand}`} author="ShowsUp" creator="ShowsUp (showsup.co)">
      <SampleCoverPage brand={brand} score={score} date={date} />
      <SampleScoresPage modelResults={modelResults} date={date} />
      <SampleWatermarkPage brand={brand} date={date} />
    </Document>
  );
}

export function FullReportPDF(props: ExtendedPDFProps) {
  const { brand, score, date, category, url, modelResults, recommendations, categoryScores, competitorsData, improvementPlan, scanResults } = props;
  const hasCompetitors = !!(competitorsData && competitorsData.competitors.length > 0);
  return (
    <Document title={`ShowsUp Report — ${brand}`} author="ShowsUp" creator="ShowsUp (showsup.co)">
      <Page1 brand={brand} score={score} date={date} category={category} url={url} modelResults={modelResults} />
      <Page2 categoryScores={categoryScores} overallScore={score} date={date} />
      {hasCompetitors && <Page3 competitorsData={competitorsData!} brand={brand} date={date} />}
      <Page4 recommendations={recommendations} categoryScores={categoryScores} competitorsData={competitorsData} date={date} score={score} />
      {improvementPlan && <ImprovementPlanPage plan={improvementPlan} date={date} />}
      {scanResults && scanResults.length > 0 && <AppendixPage scanResults={scanResults} brand={brand} date={date} />}
    </Document>
  );
}

export function BoardReadyPDF(props: ExtendedPDFProps) {
  const { brand, score, date, category, url, modelResults, recommendations, categoryScores, competitorsData, improvementPlan, scanResults, execSummary } = props;
  const hasCompetitors = !!(competitorsData && competitorsData.competitors.length > 0);
  const summary = execSummary ??
    `${brand} achieved an AI Visibility Score of ${score}/100, reflecting its current standing across major AI language models. ` +
    `The scan identified key opportunities to improve category discoverability and competitive positioning. ` +
    `Leadership should prioritise content optimisation and citation building as primary near-term initiatives to strengthen AI presence.`;
  return (
    <Document title={`ShowsUp Board Report — ${brand}`} author="ShowsUp" creator="ShowsUp (showsup.co)">
      <BoardCoverPage brand={brand} score={score} date={date} category={category} />
      <ExecSummaryPage brand={brand} score={score} category={category} execSummary={summary} date={date} />
      <Page1 brand={brand} score={score} date={date} category={category} url={url} modelResults={modelResults} />
      <Page2 categoryScores={categoryScores} overallScore={score} date={date} />
      {hasCompetitors && <Page3 competitorsData={competitorsData!} brand={brand} date={date} />}
      <Page4 recommendations={recommendations} categoryScores={categoryScores} competitorsData={competitorsData} date={date} score={score} />
      {improvementPlan && <ImprovementPlanPage plan={improvementPlan} date={date} />}
      {scanResults && scanResults.length > 0 && <AppendixPage scanResults={scanResults} brand={brand} date={date} />}
    </Document>
  );
}

// ── Document ───────────────────────────────────────────────────────────────────

export function ShowsUpPDF(props: ShowsUpPDFProps) {
  const {
    brand, score, date, category, url,
    modelResults, recommendations, categoryScores, competitorsData,
  } = props;

  const hasCompetitors = !!(competitorsData && competitorsData.competitors.length > 0);

  return (
    <Document
      title={`ShowsUp AI Visibility Report — ${brand}`}
      author="ShowsUp"
      subject={`AI Visibility Report for ${brand}`}
      creator="ShowsUp (showsup.co)"
    >
      <Page1
        brand={brand}
        score={score}
        date={date}
        category={category}
        url={url}
        modelResults={modelResults}
      />

      <Page2 categoryScores={categoryScores} overallScore={score} date={date} />

      {hasCompetitors && (
        <Page3 competitorsData={competitorsData!} brand={brand} date={date} />
      )}

      <Page4
        recommendations={recommendations}
        categoryScores={categoryScores}
        competitorsData={competitorsData}
        date={date}
        score={score}
      />
    </Document>
  );
}
