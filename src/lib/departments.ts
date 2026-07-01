import { getSupabaseAdmin } from "./supabaseAdmin";
import type { Department } from "./types";

export async function getAllActiveDepartments(): Promise<Department[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("departments")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Department[];
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("departments")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Department | null;
}
