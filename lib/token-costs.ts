export const TOKEN_COSTS = {
  // Report types
  QUICK_CHECK: 50,         // Basic score, 2 platforms, 8 queries
  STANDARD_REPORT: 150,    // 20 queries, 2 platforms, 3 competitors, recommendations
  DEEP_ANALYSIS: 400,      // 50 queries, all platforms, 5 competitors, everything

  // Add-ons
  ADD_COMPETITOR: 30,      // Per additional competitor
  ADD_PLATFORM: 40,        // Per additional AI platform
  PERSONA_ANALYSIS: 50,    // Test from 5 buyer perspectives
  COMMERCE_DEEP_DIVE: 50,  // 15 purchase-intent queries
  SENTIMENT_DEEP_DIVE: 30, // Detailed brand perception
  IMPROVEMENT_PLAN: 40,    // 3-tier action roadmap
  CITATION_TRACKING: 25,   // Track which pages AI cites
  CATEGORY_BENCHMARK: 35,  // Compare to industry averages

  // Actions
  CUSTOM_QUERY: 5,         // Try your own query
  RESCAN_DISCOUNT: 0.75,   // 25% discount on re-scanning same brand
  PDF_FULL: 25,            // Full PDF export
  PDF_PREMIUM: 50,         // Board-ready PDF
} as const;
