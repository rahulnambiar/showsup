import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        // Clean up store data on uninstall
        await prisma.scan.deleteMany({ where: { shop } }).catch(() => {});
        await prisma.productScore.deleteMany({ where: { shop } }).catch(() => {});
        await prisma.store.delete({ where: { id: shop } }).catch(() => {});
        await prisma.session.deleteMany({ where: { shop } }).catch(() => {});
      }
      break;

    case "SHOP_UPDATE":
      // Keep store name/email in sync
      if (payload) {
        const p = payload as any;
        await prisma.store.upsert({
          where:  { id: shop },
          update: { name: p.name, email: p.email },
          create: { id: shop, name: p.name, email: p.email },
        }).catch(() => {});
      }
      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response("OK", { status: 200 });
};
