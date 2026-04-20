import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JuryShell } from "./_components/jury-shell";

export default async function JuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  
  // Buscar role da tabela profiles
  const { data: profile } = user ? await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single() : { data: null };
  
  const role = profile?.role || user?.app_metadata?.role;

  if (!user || role !== "jurado") {
    redirect("/admin/login");
  }

  return (
    <JuryShell
      userEmail={user.email ?? ""}
      userName={profile?.name || (user.user_metadata?.name as string | undefined) || "Jurado"}
    >
      {children}
    </JuryShell>
  );
}
