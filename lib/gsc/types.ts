export interface GscQuery {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
}

export interface GscPage {
  page: string;
  impressions: number;
  clicks: number;
  position: number;
}

export interface GscData {
  site_url: string;
  synced_at: string;
  branded: {
    impressions: number;
    clicks: number;
    top_queries: GscQuery[];
  };
  non_branded: {
    impressions: number;
    clicks: number;
    top_queries: GscQuery[];
  };
  ai_queries: GscQuery[];      // Long-form / conversational queries
  top_pages: GscPage[];
}
