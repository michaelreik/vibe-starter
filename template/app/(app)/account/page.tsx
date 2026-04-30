import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/account-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <AccountForm
        email={profile?.email ?? user?.email ?? ""}
        initialFullName={profile?.full_name ?? ""}
      />
    </div>
  );
}
