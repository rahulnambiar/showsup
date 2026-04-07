export interface Brand {
  name: string;
  url: string;
  category: string;
  subcategory?: string;
  stock_ticker?: string;
}

export const BRAND_INDEX: Brand[] = [
  // ── Technology (20) ──────────────────────────────────────────────────────
  { name: "Apple", url: "https://apple.com", category: "Technology", subcategory: "Consumer Electronics", stock_ticker: "AAPL" },
  { name: "Microsoft", url: "https://microsoft.com", category: "Technology", subcategory: "Software", stock_ticker: "MSFT" },
  { name: "Amazon", url: "https://amazon.com", category: "Technology", subcategory: "Cloud & Commerce", stock_ticker: "AMZN" },
  { name: "Google", url: "https://google.com", category: "Technology", subcategory: "Search & AI", stock_ticker: "GOOGL" },
  { name: "Samsung", url: "https://samsung.com", category: "Technology", subcategory: "Consumer Electronics", stock_ticker: "005930.KS" },
  { name: "IBM", url: "https://ibm.com", category: "Technology", subcategory: "Enterprise", stock_ticker: "IBM" },
  { name: "Intel", url: "https://intel.com", category: "Technology", subcategory: "Semiconductors", stock_ticker: "INTC" },
  { name: "Meta", url: "https://meta.com", category: "Technology", subcategory: "Social Media", stock_ticker: "META" },
  { name: "SAP", url: "https://sap.com", category: "Technology", subcategory: "Enterprise Software", stock_ticker: "SAP" },
  { name: "Oracle", url: "https://oracle.com", category: "Technology", subcategory: "Enterprise Software", stock_ticker: "ORCL" },
  { name: "Accenture", url: "https://accenture.com", category: "Technology", subcategory: "Consulting", stock_ticker: "ACN" },
  { name: "Cisco", url: "https://cisco.com", category: "Technology", subcategory: "Networking", stock_ticker: "CSCO" },
  { name: "Salesforce", url: "https://salesforce.com", category: "Technology", subcategory: "CRM", stock_ticker: "CRM" },
  { name: "Adobe", url: "https://adobe.com", category: "Technology", subcategory: "Creative Software", stock_ticker: "ADBE" },
  { name: "Nvidia", url: "https://nvidia.com", category: "Technology", subcategory: "Semiconductors", stock_ticker: "NVDA" },
  { name: "Zoom", url: "https://zoom.us", category: "Technology", subcategory: "Communications", stock_ticker: "ZM" },
  { name: "Xiaomi", url: "https://xiaomi.com", category: "Technology", subcategory: "Consumer Electronics", stock_ticker: "1810.HK" },
  { name: "Huawei", url: "https://huawei.com", category: "Technology", subcategory: "Telecom Equipment" },
  { name: "Snap", url: "https://snap.com", category: "Technology", subcategory: "Social Media", stock_ticker: "SNAP" },
  { name: "Shopify", url: "https://shopify.com", category: "Technology", subcategory: "E-Commerce Platform", stock_ticker: "SHOP" },

  // ── Automotive (10) ──────────────────────────────────────────────────────
  { name: "Toyota", url: "https://toyota.com", category: "Automotive", stock_ticker: "TM" },
  { name: "Mercedes-Benz", url: "https://mercedes-benz.com", category: "Automotive", stock_ticker: "MBG.DE" },
  { name: "BMW", url: "https://bmw.com", category: "Automotive", stock_ticker: "BMW.DE" },
  { name: "Tesla", url: "https://tesla.com", category: "Automotive", subcategory: "EV", stock_ticker: "TSLA" },
  { name: "Hyundai", url: "https://hyundai.com", category: "Automotive", stock_ticker: "005380.KS" },
  { name: "Audi", url: "https://audi.com", category: "Automotive" },
  { name: "Honda", url: "https://honda.com", category: "Automotive", stock_ticker: "HMC" },
  { name: "Porsche", url: "https://porsche.com", category: "Automotive", stock_ticker: "P911.DE" },
  { name: "Volkswagen", url: "https://volkswagen.com", category: "Automotive", stock_ticker: "VOW.DE" },
  { name: "Ford", url: "https://ford.com", category: "Automotive", stock_ticker: "F" },

  // ── Luxury (5) ───────────────────────────────────────────────────────────
  { name: "Louis Vuitton", url: "https://louisvuitton.com", category: "Luxury", stock_ticker: "MC.PA" },
  { name: "Hermès", url: "https://hermes.com", category: "Luxury", stock_ticker: "RMS.PA" },
  { name: "Gucci", url: "https://gucci.com", category: "Luxury", stock_ticker: "KER.PA" },
  { name: "Chanel", url: "https://chanel.com", category: "Luxury" },
  { name: "Rolex", url: "https://rolex.com", category: "Luxury" },

  // ── Fashion (5) ──────────────────────────────────────────────────────────
  { name: "Nike", url: "https://nike.com", category: "Fashion", subcategory: "Sporting Goods", stock_ticker: "NKE" },
  { name: "Zara", url: "https://zara.com", category: "Fashion", stock_ticker: "ITX.MC" },
  { name: "H&M", url: "https://hm.com", category: "Fashion", stock_ticker: "HMB.ST" },
  { name: "Burberry", url: "https://burberry.com", category: "Fashion", stock_ticker: "BRBY.L" },
  { name: "Levi Strauss", url: "https://levi.com", category: "Fashion", stock_ticker: "LEVI" },

  // ── Consumer Goods (8) ───────────────────────────────────────────────────
  { name: "Nestlé", url: "https://nestle.com", category: "Consumer Goods", stock_ticker: "NESN.SW" },
  { name: "Procter & Gamble", url: "https://pg.com", category: "Consumer Goods", stock_ticker: "PG" },
  { name: "Unilever", url: "https://unilever.com", category: "Consumer Goods", stock_ticker: "ULVR.L" },
  { name: "L'Oréal", url: "https://loreal.com", category: "Consumer Goods", stock_ticker: "OR.PA" },
  { name: "Kellogg's", url: "https://kelloggs.com", category: "Consumer Goods", stock_ticker: "K" },
  { name: "Lego", url: "https://lego.com", category: "Consumer Goods" },
  { name: "Colgate-Palmolive", url: "https://colgatepalmolive.com", category: "Consumer Goods", stock_ticker: "CL" },
  { name: "3M", url: "https://3m.com", category: "Consumer Goods", stock_ticker: "MMM" },

  // ── Food & Beverage (5) ──────────────────────────────────────────────────
  { name: "Coca-Cola", url: "https://coca-cola.com", category: "Food & Beverage", stock_ticker: "KO" },
  { name: "McDonald's", url: "https://mcdonalds.com", category: "Food & Beverage", stock_ticker: "MCD" },
  { name: "Starbucks", url: "https://starbucks.com", category: "Food & Beverage", stock_ticker: "SBUX" },
  { name: "Pepsi", url: "https://pepsi.com", category: "Food & Beverage", stock_ticker: "PEP" },
  { name: "AB InBev", url: "https://ab-inbev.com", category: "Food & Beverage", stock_ticker: "BUD" },

  // ── Financial Services (8) ───────────────────────────────────────────────
  { name: "JPMorgan Chase", url: "https://jpmorganchase.com", category: "Financial Services", stock_ticker: "JPM" },
  { name: "Visa", url: "https://visa.com", category: "Financial Services", stock_ticker: "V" },
  { name: "Mastercard", url: "https://mastercard.com", category: "Financial Services", stock_ticker: "MA" },
  { name: "Goldman Sachs", url: "https://goldmansachs.com", category: "Financial Services", stock_ticker: "GS" },
  { name: "American Express", url: "https://americanexpress.com", category: "Financial Services", stock_ticker: "AXP" },
  { name: "HSBC", url: "https://hsbc.com", category: "Financial Services", stock_ticker: "HSBA.L" },
  { name: "Citigroup", url: "https://citi.com", category: "Financial Services", stock_ticker: "C" },
  { name: "Morgan Stanley", url: "https://morganstanley.com", category: "Financial Services", stock_ticker: "MS" },

  // ── Insurance (2) ────────────────────────────────────────────────────────
  { name: "Allianz", url: "https://allianz.com", category: "Insurance", stock_ticker: "ALV.DE" },
  { name: "AXA", url: "https://axa.com", category: "Insurance", stock_ticker: "CS.PA" },

  // ── Entertainment (6) ────────────────────────────────────────────────────
  { name: "Disney", url: "https://disney.com", category: "Entertainment", stock_ticker: "DIS" },
  { name: "Netflix", url: "https://netflix.com", category: "Entertainment", stock_ticker: "NFLX" },
  { name: "Spotify", url: "https://spotify.com", category: "Entertainment", stock_ticker: "SPOT" },
  { name: "Nintendo", url: "https://nintendo.com", category: "Entertainment", stock_ticker: "7974.T" },
  { name: "Warner Bros", url: "https://warnerbros.com", category: "Entertainment", stock_ticker: "WBD" },
  { name: "Paramount", url: "https://paramount.com", category: "Entertainment", stock_ticker: "PARA" },

  // ── Media (4) ────────────────────────────────────────────────────────────
  { name: "TikTok", url: "https://tiktok.com", category: "Media", subcategory: "Social Video" },
  { name: "Twitter", url: "https://x.com", category: "Media", subcategory: "Social Media" },
  { name: "LinkedIn", url: "https://linkedin.com", category: "Media", subcategory: "Professional Network" },
  { name: "Bloomberg", url: "https://bloomberg.com", category: "Media", subcategory: "Financial Media" },

  // ── Travel (5) ───────────────────────────────────────────────────────────
  { name: "Airbnb", url: "https://airbnb.com", category: "Travel", stock_ticker: "ABNB" },
  { name: "Uber", url: "https://uber.com", category: "Travel", stock_ticker: "UBER" },
  { name: "Booking.com", url: "https://booking.com", category: "Travel", stock_ticker: "BKNG" },
  { name: "Expedia", url: "https://expedia.com", category: "Travel", stock_ticker: "EXPE" },
  { name: "Delta Air Lines", url: "https://delta.com", category: "Travel", stock_ticker: "DAL" },

  // ── Hospitality (3) ──────────────────────────────────────────────────────
  { name: "Marriott", url: "https://marriott.com", category: "Hospitality", stock_ticker: "MAR" },
  { name: "Hilton", url: "https://hilton.com", category: "Hospitality", stock_ticker: "HLT" },
  { name: "Hyatt", url: "https://hyatt.com", category: "Hospitality", stock_ticker: "H" },

  // ── Retail (4) ───────────────────────────────────────────────────────────
  { name: "IKEA", url: "https://ikea.com", category: "Retail" },
  { name: "Walmart", url: "https://walmart.com", category: "Retail", stock_ticker: "WMT" },
  { name: "Target", url: "https://target.com", category: "Retail", stock_ticker: "TGT" },
  { name: "eBay", url: "https://ebay.com", category: "Retail", stock_ticker: "EBAY" },

  // ── Telecom (4) ──────────────────────────────────────────────────────────
  { name: "AT&T", url: "https://att.com", category: "Telecom", stock_ticker: "T" },
  { name: "Verizon", url: "https://verizon.com", category: "Telecom", stock_ticker: "VZ" },
  { name: "T-Mobile", url: "https://t-mobile.com", category: "Telecom", stock_ticker: "TMUS" },
  { name: "Vodafone", url: "https://vodafone.com", category: "Telecom", stock_ticker: "VOD" },

  // ── Logistics (3) ────────────────────────────────────────────────────────
  { name: "UPS", url: "https://ups.com", category: "Logistics", stock_ticker: "UPS" },
  { name: "FedEx", url: "https://fedex.com", category: "Logistics", stock_ticker: "FDX" },
  { name: "DHL", url: "https://dhl.com", category: "Logistics", stock_ticker: "DHL.DE" },

  // ── Healthcare (4) ───────────────────────────────────────────────────────
  { name: "Pfizer", url: "https://pfizer.com", category: "Healthcare", stock_ticker: "PFE" },
  { name: "Johnson & Johnson", url: "https://jnj.com", category: "Healthcare", stock_ticker: "JNJ" },
  { name: "AstraZeneca", url: "https://astrazeneca.com", category: "Healthcare", stock_ticker: "AZN" },
  { name: "Medtronic", url: "https://medtronic.com", category: "Healthcare", stock_ticker: "MDT" },

  // ── Industrial (2) ───────────────────────────────────────────────────────
  { name: "Siemens", url: "https://siemens.com", category: "Industrial", stock_ticker: "SIE.DE" },
  { name: "Caterpillar", url: "https://caterpillar.com", category: "Industrial", stock_ticker: "CAT" },

  // ── Energy (2) ───────────────────────────────────────────────────────────
  { name: "Shell", url: "https://shell.com", category: "Energy", stock_ticker: "SHEL" },
  { name: "ExxonMobil", url: "https://exxonmobil.com", category: "Energy", stock_ticker: "XOM" },
];

export const CATEGORIES = Array.from(new Set(BRAND_INDEX.map((b) => b.category)));

export const PUBLIC_COMPANIES = BRAND_INDEX.filter((b) => !!b.stock_ticker);
