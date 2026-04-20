import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Dish } from "@/lib/supabase/types";
import { PageHeader } from "../../_components/page-header";
import { DishesManager } from "./dishes-manager";

export const dynamic = "force-dynamic";

export default async function AdminDishesPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("dishes")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Pratos"
        description="Cadastre e edite os pratos que aparecerão na votação pública."
      />
      <DishesManager initialDishes={(data ?? []) as Dish[]} />
    </>
  );
}
