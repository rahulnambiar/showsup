import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your account and preferences.</p>
      </div>
      <Card className="bg-[#111827] border-white/10">
        <CardHeader>
          <CardTitle className="text-base text-white">Account</CardTitle>
          <CardDescription className="text-gray-500">Your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">Settings coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
