// ── Types ─────────────────────────────────────────────────────────────────────

export type ScoreCategory =
  | "awareness"
  | "discovery"
  | "competitive"
  | "reputation"
  | "alternatives"
  | "purchase_intent";

export interface Query {
  id: string;
  text: string;
  scoreCategory: ScoreCategory;
}

export interface QueryConfig {
  type: "quick_check" | "standard" | "deep";
  addons: string[];
}

/** A function that calls an AI model and returns text — injected from the scan route */
export type AICallFn = (prompt: string, maxTokens?: number) => Promise<string>;

// ── Quick Check — 8 queries ───────────────────────────────────────────────────

function buildQuickQueries(brand: string, space: string, competitors: string[]): Query[] {
  const comp1 = competitors[0] ?? "competitors";
  return [
    { id: "q_what_is",      text: `What is ${brand}?`,                                                       scoreCategory: "awareness"       },
    { id: "q_best_cat",     text: `What are the best ${space} companies?`,                                   scoreCategory: "discovery"       },
    { id: "q_compare",      text: `How does ${brand} compare to competitors in ${space}?`,                   scoreCategory: "competitive"     },
    { id: "q_recommend",    text: `Would you recommend ${brand}?`,                                           scoreCategory: "reputation"      },
    { id: "q_alternatives", text: `What are alternatives to ${brand}?`,                                      scoreCategory: "alternatives"    },
    { id: "q_smb",          text: `Is ${brand} good for small businesses?`,                                  scoreCategory: "purchase_intent" },
    { id: "q_strengths",    text: `What are the strengths of ${brand}?`,                                     scoreCategory: "reputation"      },
    { id: "q_best_2026",    text: `Best ${space} in 2026?`,                                                  scoreCategory: "discovery"       },
  ];
  void comp1; // referenced for future personalisation
}

// ── Standard extras — 12 additional queries (total: 20) ──────────────────────

function buildStandardExtras(brand: string, space: string, competitors: string[]): Query[] {
  const comp1 = competitors[0] ?? "its main competitor";
  const comp2 = competitors[1] ?? "leading alternatives";
  return [
    { id: "s_products",     text: `Tell me about ${brand} — what products or services do they offer?`,      scoreCategory: "awareness"       },
    { id: "s_consider",     text: `I need a good ${space} solution — what should I consider?`,              scoreCategory: "discovery"       },
    { id: "s_vs_comp1",     text: `What are the pros and cons of ${brand} vs ${comp1}?`,                    scoreCategory: "competitive"     },
    { id: "s_vs_comp2",     text: `What are the pros and cons of ${brand} vs ${comp2}?`,                    scoreCategory: "competitive"     },
    { id: "s_reviews",      text: `${brand} reviews — what do customers say?`,                              scoreCategory: "reputation"      },
    { id: "s_different",    text: `What makes ${brand} different from other ${space} tools?`,               scoreCategory: "competitive"     },
    { id: "s_startups",     text: `Best ${space} for startups?`,                                            scoreCategory: "purchase_intent" },
    { id: "s_enterprise",   text: `Best ${space} for enterprise?`,                                          scoreCategory: "purchase_intent" },
    { id: "s_trusted",      text: `Most trusted ${space} brands?`,                                          scoreCategory: "reputation"      },
    { id: "s_support",      text: `${space} with the best customer support?`,                               scoreCategory: "reputation"      },
    { id: "s_value",        text: `Which ${space} gives the best value for money?`,                         scoreCategory: "purchase_intent" },
    { id: "s_userfriendly", text: `What's the most user-friendly ${space} solution?`,                       scoreCategory: "purchase_intent" },
  ];
}

// ── Persona Analysis — 15 queries (5 personas × 3) ───────────────────────────

function buildPersonaQueries(brand: string, space: string): Query[] {
  return [
    // Small Business Owner
    { id: "p_smb_1",    text: `As a small business owner, which ${space} would you recommend?`,                   scoreCategory: "purchase_intent" },
    { id: "p_smb_2",    text: `Best ${space} for a small team of 5–10 people?`,                                   scoreCategory: "purchase_intent" },
    { id: "p_smb_3",    text: `Which ${space} is easiest to set up for a non-technical founder?`,                  scoreCategory: "purchase_intent" },
    // Enterprise Buyer
    { id: "p_ent_1",    text: `I'm evaluating ${space} for a large organisation. What should I consider?`,        scoreCategory: "discovery"       },
    { id: "p_ent_2",    text: `Which ${space} has the best enterprise security and compliance features?`,          scoreCategory: "discovery"       },
    { id: "p_ent_3",    text: `Best ${space} that scales to thousands of users?`,                                  scoreCategory: "discovery"       },
    // Budget-Conscious
    { id: "p_budget_1", text: `What's the cheapest good ${space} option?`,                                        scoreCategory: "purchase_intent" },
    { id: "p_budget_2", text: `Best free or low-cost ${space} for startups?`,                                     scoreCategory: "purchase_intent" },
    { id: "p_budget_3", text: `Is ${brand} affordable compared to other ${space} solutions?`,                     scoreCategory: "purchase_intent" },
    // Tech-Savvy
    { id: "p_tech_1",   text: `What's the most innovative ${space} tool with the best API?`,                      scoreCategory: "discovery"       },
    { id: "p_tech_2",   text: `Which ${space} has the best developer integrations and documentation?`,            scoreCategory: "discovery"       },
    { id: "p_tech_3",   text: `Best ${space} for a tech-savvy team that wants maximum customisation?`,            scoreCategory: "discovery"       },
    // First-Timer
    { id: "p_new_1",    text: `I've never used ${space} before. Where should I start?`,                           scoreCategory: "awareness"       },
    { id: "p_new_2",    text: `What's the easiest ${space} for beginners?`,                                       scoreCategory: "awareness"       },
    { id: "p_new_3",    text: `${brand} for beginners — is it easy to learn?`,                                    scoreCategory: "awareness"       },
  ];
}

// ── Commerce Deep Dive — 8 hardcoded queries ─────────────────────────────────

function buildCommerceQueries(brand: string, space: string, competitors: string[]): Query[] {
  const comp1 = competitors[0] ?? "alternatives";
  return [
    { id: "c_families",   text: `Best ${space} for families`,                                                     scoreCategory: "purchase_intent" },
    { id: "c_cheapest",   text: `Cheapest ${space} options in 2026`,                                              scoreCategory: "purchase_intent" },
    { id: "c_price_cmp",  text: `Compare ${space} prices — best value?`,                                          scoreCategory: "purchase_intent" },
    { id: "c_free_trial", text: `${space} with the best free trial`,                                              scoreCategory: "purchase_intent" },
    { id: "c_vs_comp1",   text: `Should I buy ${brand} or ${comp1}?`,                                             scoreCategory: "competitive"     },
    { id: "c_worth",      text: `Is ${brand} worth the price?`,                                                   scoreCategory: "reputation"      },
    { id: "c_deals",      text: `Best ${space} deals right now`,                                                   scoreCategory: "purchase_intent" },
    { id: "c_guarantee",  text: `Which ${space} has the best money-back guarantee?`,                               scoreCategory: "purchase_intent" },
  ];
}

// ── Deep Analysis — 30 extra queries (Claude-assisted) ───────────────────────

async function buildDeepExtras(
  brand: string,
  space: string,
  competitors: string[],
  callAI: AICallFn,
): Promise<Query[]> {
  const extras: Query[] = [];

  // 5 long-tail persona queries
  const longtails = [
    { persona: "startup founder",                    need: "is affordable and scales quickly"       },
    { persona: "budget-conscious SMB owner",         need: "offers the best value for money"        },
    { persona: "large enterprise procurement manager", need: "has strong security and compliance"   },
    { persona: "solo professional",                  need: "is easy to use without a tech team"     },
    { persona: "team migrating from a legacy tool",  need: "makes the switch straightforward"       },
  ];
  longtails.forEach(({ persona, need }, i) => {
    extras.push({
      id: `d_longtail_${i}`,
      text: `I'm a ${persona} looking for ${space} that ${need}. What would you recommend?`,
      scoreCategory: "purchase_intent",
    });
  });

  // 5 per-competitor comparison queries
  const compsForDeep = competitors.slice(0, 5);
  for (let i = 0; i < 5; i++) {
    const comp = compsForDeep[i];
    extras.push({
      id: `d_vs_${i}`,
      text: comp
        ? `${brand} vs ${comp} — which is better and why?`
        : `How does ${brand} compare to the top ${space} tools?`,
      scoreCategory: "competitive",
    });
  }

  // 3 pricing/value queries
  extras.push({ id: "d_price_1", text: `How much does ${brand} cost?`,                                               scoreCategory: "purchase_intent" });
  extras.push({ id: "d_price_2", text: `Is ${brand} pricing competitive compared to alternatives?`,                   scoreCategory: "purchase_intent" });
  extras.push({ id: "d_price_3", text: `Best ${space} for the price in 2026?`,                                        scoreCategory: "purchase_intent" });

  // 2 switching queries
  const sw1 = competitors[0] ?? "existing solutions";
  const sw2 = competitors[1] ?? "other tools";
  extras.push({ id: "d_switch_1", text: `Should I switch from ${sw1} to ${brand}?`,                                  scoreCategory: "alternatives"    });
  extras.push({ id: "d_switch_2", text: `How difficult is it to migrate from ${sw2} to ${brand}?`,                   scoreCategory: "alternatives"    });

  // 15 category-specific queries generated by Claude
  try {
    const genPrompt = `Generate exactly 15 specific search queries that someone researching "${space}" would type into an AI assistant.
Include a variety of: use-case queries, comparison queries, pain-point queries, feature-specific queries, and decision-criteria queries.
Do NOT mention "${brand}" by name — these should be general category queries where the brand may or may not come up.
Return ONLY a JSON array of 15 strings. No explanation, no markdown, no extra text.`;

    const text = await callAI(genPrompt, 800);
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as string[];
      const valid = parsed.filter((q) => typeof q === "string" && q.trim().length > 10).slice(0, 15);

      // Distribute score categories across the 15 generated queries
      const catAssignment: ScoreCategory[] = [
        "discovery", "discovery", "discovery",
        "purchase_intent", "purchase_intent", "purchase_intent",
        "competitive", "competitive",
        "reputation", "reputation",
        "alternatives", "alternatives",
        "awareness", "awareness", "discovery",
      ];
      valid.forEach((q, i) => {
        extras.push({
          id: `d_cat_${i}`,
          text: q.trim(),
          scoreCategory: catAssignment[i] ?? "discovery",
        });
      });
    }
  } catch {
    // Fallback: add hardcoded category-agnostic deep queries
    const fallbacks: Array<{ text: string; scoreCategory: ScoreCategory }> = [
      { text: `${space} industry trends in 2026`,                                scoreCategory: "discovery"       },
      { text: `What features matter most when choosing ${space}?`,               scoreCategory: "discovery"       },
      { text: `How do companies evaluate and select ${space}?`,                  scoreCategory: "discovery"       },
      { text: `${space} case studies and real-world success stories`,            scoreCategory: "reputation"      },
      { text: `Common mistakes when choosing ${space}`,                          scoreCategory: "discovery"       },
    ];
    fallbacks.forEach((f, i) => extras.push({ id: `d_cat_fallback_${i}`, ...f }));
  }

  return extras;
}

// ── Commerce AI extras — 5 Claude-generated purchase queries ─────────────────

async function buildCommerceAIExtras(space: string, callAI: AICallFn): Promise<Query[]> {
  try {
    const genPrompt = `Generate exactly 5 purchase-intent questions someone would ask an AI before buying ${space}.
Focus on specific buying decisions, value comparisons, or situational needs.
Return ONLY a JSON array of 5 strings.`;

    const text = await callAI(genPrompt, 400);
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as string[];
    return parsed
      .filter((q) => typeof q === "string" && q.trim().length > 10)
      .slice(0, 5)
      .map((q, i) => ({ id: `cc_${i}`, text: q.trim(), scoreCategory: "purchase_intent" as ScoreCategory }));
  } catch {
    return [];
  }
}

// ── Deduplicate by normalised text ────────────────────────────────────────────

function deduplicateQueries(queries: Query[]): Query[] {
  const seen = new Set<string>();
  return queries.filter((q) => {
    const key = q.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main exported function ────────────────────────────────────────────────────

export async function generateQueries(
  brand: string,
  category: string,
  niche: string,
  competitors: string[],
  config: QueryConfig,
  callAI: AICallFn,
): Promise<Query[]> {
  const space = niche || category;

  const quick = buildQuickQueries(brand, space, competitors);

  if (config.type === "quick_check") {
    return deduplicateQueries(quick);
  }

  const standardExtras = buildStandardExtras(brand, space, competitors);
  const standard = [...quick, ...standardExtras];

  // Collect addon queries (run Claude generations in parallel where needed)
  const addonPromises: Promise<Query[]>[] = [];

  if (config.addons.includes("persona_analysis")) {
    addonPromises.push(Promise.resolve(buildPersonaQueries(brand, space)));
  }

  if (config.addons.includes("commerce_deep_dive")) {
    const hardcoded = buildCommerceQueries(brand, space, competitors);
    addonPromises.push(
      buildCommerceAIExtras(space, callAI).then((ai) => [...hardcoded, ...ai])
    );
  }

  if (config.type === "deep") {
    addonPromises.push(buildDeepExtras(brand, space, competitors, callAI));
  }

  const addonResults = await Promise.all(addonPromises);
  const allAddonQueries = addonResults.flat();

  return deduplicateQueries([...standard, ...allAddonQueries]);
}
