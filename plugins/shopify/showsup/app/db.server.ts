import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple Prisma instances in dev HMR
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export { prisma };
