import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function TrendsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Trends</h1>
        <p className="text-gray-400 text-sm">Track how your AI visibility changes over time.</p>
      </div>
      <Card className="bg-[#111827] border-white/10 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <CardTitle className="text-white text-base font-semibold">No trend data yet</CardTitle>
          <p className="text-gray-500 text-sm">Run multiple scans over time to see trends.</p>
        </CardContent>
      </Card>
    </div>
  );
}
