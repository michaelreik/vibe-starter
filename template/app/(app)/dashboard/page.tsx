import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p className="text-muted-foreground">Signed in as {user?.email}</p>
    </div>
  );
}
