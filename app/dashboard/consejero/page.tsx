import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ConsejeroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || user.user_metadata?.name || user.email;

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Bienvenido, {userName}
        </h2>
        <p className="text-gray-600">
          Panel de consejero - Aquí podrás gestionar los servicios de bienestar estudiantil.
        </p>
      </div>
    </div>
  );
}
