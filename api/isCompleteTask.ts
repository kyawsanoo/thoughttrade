import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { user_id, task_id } = req.body;

  if (!user_id || !task_id) {
    return res.status(400).json({ ok: false, message: "Missing user_id or task_id" });
  }

  const { data, error } = await supabase
    .from("user_task_completion")
    .select("*")
    .eq("user_id", user_id)
    .eq("task_id", task_id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.json({
    ok: true,
    isCompleted: !!data,
    task: data,
  });
}
