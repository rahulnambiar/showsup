export interface Region {
  code: string;
  name: string;
  flag: string;
  prompt_suffix: string;
}

export const REGIONS: Region[] = [
  { code: "global", name: "Global",         flag: "🌍", prompt_suffix: "" },
  { code: "us",     name: "United States",  flag: "🇺🇸", prompt_suffix: "for businesses in the United States" },
  { code: "uk",     name: "United Kingdom", flag: "🇬🇧", prompt_suffix: "in the UK market" },
  { code: "eu",     name: "Europe",         flag: "🇪🇺", prompt_suffix: "for the European market" },
  { code: "sg",     name: "Singapore",      flag: "🇸🇬", prompt_suffix: "in Singapore" },
  { code: "sea",    name: "Southeast Asia", flag: "🌏", prompt_suffix: "in Southeast Asia" },
  { code: "au",     name: "Australia",      flag: "🇦🇺", prompt_suffix: "in Australia" },
  { code: "in",     name: "India",          flag: "🇮🇳", prompt_suffix: "in India" },
  { code: "me",     name: "Middle East",    flag: "🇦🇪", prompt_suffix: "in the Middle East region" },
  { code: "latam",  name: "Latin America",  flag: "🌎", prompt_suffix: "in Latin America" },
];

export const REGION_MAP: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.code, r])
);

export function getRegion(code: string): Region {
  return REGION_MAP[code] ?? REGIONS[0]!;
}
