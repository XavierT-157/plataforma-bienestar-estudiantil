import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EstudiantePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user.user_metadata?.name || user.email;

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Bienvenido, {userName}
        </h2>
        <p className="text-gray-600">
          Panel de estudiante - Aquí podrás acceder a los servicios de bienestar estudiantil.
        </p>
      </div>
    </div>
  );
}
