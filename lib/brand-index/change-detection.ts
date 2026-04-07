/**
 * Website change detection: compares two brand_snapshots rows and returns
 * an array of typed change objects describing what shifted month-over-month.
 */

export type ChangeType =
  | "llms_txt_added"
  | "llms_txt_removed"
  | "llms_txt_updated"
  | "meta_description_changed"
  | "h1_changed"
  | "faq_schema_added"
  | "faq_schema_removed"
  | "org_schema_added"
  | "org_schema_removed"
  | "crawler_policy_changed"
  | "sitemap_added"
  | "sitemap_removed";

export interface BrandChange {
  type: ChangeType;
  detail: string;
  old_value: string | boolean | null;
  new_value: string | boolean | null;
}

export interface SnapshotRow {
  brand_url: string;
  month: string;
  homepage_h1: string | null;
  meta_description: string | null;
  llms_txt_exists: boolean;
  llms_txt_length: number;
  schema_types: string[];
  faq_schema_exists: boolean;
  org_schema_exists: boolean;
  robots_txt_ai_rules: Record<string, { allowed: boolean | null }>;
  sitemap_exists: boolean;
}

export function detectChanges(
  prev: SnapshotRow | null,
  curr: SnapshotRow
): BrandChange[] {
  if (!prev) return [];

  const changes: BrandChange[] = [];

  // ── llms.txt ─────────────────────────────────────────────────────────────

  if (!prev.llms_txt_exists && curr.llms_txt_exists) {
    changes.push({
      type: "llms_txt_added",
      detail: "llms.txt file appeared on the website",
      old_value: false,
      new_value: true,
    });
  } else if (prev.llms_txt_exists && !curr.llms_txt_exists) {
    changes.push({
      type: "llms_txt_removed",
      detail: "llms.txt file was removed from the website",
      old_value: true,
      new_value: false,
    });
  } else if (
    prev.llms_txt_exists &&
    curr.llms_txt_exists &&
    Math.abs((curr.llms_txt_length ?? 0) - (prev.llms_txt_length ?? 0)) > 50
  ) {
    changes.push({
      type: "llms_txt_updated",
      detail: `llms.txt length changed from ${prev.llms_txt_length} to ${curr.llms_txt_length} chars`,
      old_value: String(prev.llms_txt_length),
      new_value: String(curr.llms_txt_length),
    });
  }

  // ── Meta description ─────────────────────────────────────────────────────

  if (
    prev.meta_description !== curr.meta_description &&
    (prev.meta_description || curr.meta_description)
  ) {
    changes.push({
      type: "meta_description_changed",
      detail: "Meta description was updated",
      old_value: prev.meta_description,
      new_value: curr.meta_description,
    });
  }

  // ── H1 ───────────────────────────────────────────────────────────────────

  if (
    prev.homepage_h1 !== curr.homepage_h1 &&
    (prev.homepage_h1 || curr.homepage_h1)
  ) {
    changes.push({
      type: "h1_changed",
      detail: "Homepage H1 heading was updated",
      old_value: prev.homepage_h1,
      new_value: curr.homepage_h1,
    });
  }

  // ── Schema: FAQ ───────────────────────────────────────────────────────────

  if (!prev.faq_schema_exists && curr.faq_schema_exists) {
    changes.push({
      type: "faq_schema_added",
      detail: "FAQPage schema markup was added",
      old_value: false,
      new_value: true,
    });
  } else if (prev.faq_schema_exists && !curr.faq_schema_exists) {
    changes.push({
      type: "faq_schema_removed",
      detail: "FAQPage schema markup was removed",
      old_value: true,
      new_value: false,
    });
  }

  // ── Schema: Organization ──────────────────────────────────────────────────

  if (!prev.org_schema_exists && curr.org_schema_exists) {
    changes.push({
      type: "org_schema_added",
      detail: "Organization schema markup was added",
      old_value: false,
      new_value: true,
    });
  } else if (prev.org_schema_exists && !curr.org_schema_exists) {
    changes.push({
      type: "org_schema_removed",
      detail: "Organization schema markup was removed",
      old_value: true,
      new_value: false,
    });
  }

  // ── AI crawler policy ─────────────────────────────────────────────────────

  const prevRules = prev.robots_txt_ai_rules ?? {};
  const currRules = curr.robots_txt_ai_rules ?? {};
  const allBots = new Set([...Object.keys(prevRules), ...Object.keys(currRules)]);

  for (const bot of Array.from(allBots)) {
    const prevAllowed = prevRules[bot]?.allowed ?? null;
    const currAllowed = currRules[bot]?.allowed ?? null;
    if (prevAllowed !== currAllowed) {
      const direction =
        currAllowed === false ? "blocked" : currAllowed === true ? "allowed" : "unset";
      changes.push({
        type: "crawler_policy_changed",
        detail: `${bot} crawler policy changed to ${direction}`,
        old_value: prevAllowed === null ? "unset" : String(prevAllowed),
        new_value: currAllowed === null ? "unset" : String(currAllowed),
      });
    }
  }

  // ── Sitemap ───────────────────────────────────────────────────────────────

  if (!prev.sitemap_exists && curr.sitemap_exists) {
    changes.push({
      type: "sitemap_added",
      detail: "sitemap.xml appeared on the website",
      old_value: false,
      new_value: true,
    });
  } else if (prev.sitemap_exists && !curr.sitemap_exists) {
    changes.push({
      type: "sitemap_removed",
      detail: "sitemap.xml was removed from the website",
      old_value: true,
      new_value: false,
    });
  }

  return changes;
}
