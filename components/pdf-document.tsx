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
