import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Child = { id: string; name: string; grade: string | null };

/** Children belonging to the signed-in parent. RLS keeps other parents out. */
export const listChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("children")
      .select("id, name, grade")
      .order("created_at", { ascending: true });
    if (error) throw new Error("فهرست کودکان بارگذاری نشد.");
    return (data ?? []) as Child[];
  });

export const addChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(60),
        grade: z.string().trim().max(40).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("children")
      .insert({ name: data.name, grade: data.grade, parent_id: context.userId })
      .select("id, name, grade")
      .single();
    if (error) throw new Error("افزودن کودک ممکن نشد.");
    return row as Child;
  });

export const deleteChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("children").delete().eq("id", data.id);
    if (error) throw new Error("حذف کودک ممکن نشد.");
    return { ok: true };
  });
