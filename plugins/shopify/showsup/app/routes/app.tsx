import { type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app"           rel="home">Dashboard</a>
        <a href="/app/scan">Scan</a>
        <a href="/app/fixes">AI Fixes</a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Something went wrong</h1>
      <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, overflow: "auto" }}>
        {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
      </pre>
    </div>
  );
}
