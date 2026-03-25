-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "domain" TEXT,
    "currency" TEXT,
    "primaryLocale" TEXT,
    "planName" TEXT NOT NULL DEFAULT 'free',
    "billingId" TEXT,
    "apiToken" TEXT,
    "cloudUrl" TEXT,
    "autoScanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "regions" TEXT NOT NULL DEFAULT '["global"]',
    "scanDepth" TEXT NOT NULL DEFAULT 'standard',
    "category" TEXT NOT NULL DEFAULT 'E-commerce',
    "llmstxtDeployed" BOOLEAN NOT NULL DEFAULT false,
    "llmstxtContent" TEXT,
    "llmstxtDeployedAt" DATETIME,
    "schemaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "overallScore" INTEGER,
    "chatgptScore" INTEGER,
    "claudeScore" INTEGER,
    "geminiScore" INTEGER,
    "perplexityScore" INTEGER,
    "shareOfVoice" REAL,
    "queryCount" INTEGER,
    "queriesWon" INTEGER,
    "queriesMissed" INTEGER,
    "errorMessage" TEXT,
    "rawResults" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Scan_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productType" TEXT,
    "handle" TEXT,
    "score" INTEGER,
    "queriesWon" INTEGER,
    "queriesMissed" INTEGER,
    "topQuery" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductScore_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Scan_shop_idx" ON "Scan"("shop");
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");
CREATE INDEX "ProductScore_shop_idx" ON "ProductScore"("shop");
CREATE UNIQUE INDEX "ProductScore_shop_productId_key" ON "ProductScore"("shop", "productId");
