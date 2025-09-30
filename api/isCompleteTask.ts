import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Data = {
  ok: boolean;
  message?: string;
  data?: any;
  completed_at?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    console.log("API route called");
    console.log("Method:", req.method);
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "OK" : "MISSING");
    console.log(
      "SUPABASE_KEY:",
      process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING"
    );

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not set");
    }

    const supabase: SupabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (req.method !== "POST") {
      console.log("Method not allowed");
      return res
        .status(405)
        .json({ ok: false, message: "Method not allowed" });
    }

    const { user_id, task_id } = req.body as { user_id?: string; task_id?: string };

    if (!user_id || !task_id) {
      console.log("Missing user_id or task_id");
      return res
        .status(400)
        .json({ ok: false, message: "Missing user_id or task_id" });
    }

    const { data: existing, error: selectError } = await supabase
      .from("user_task_completion")
      .select("*")
      .eq("user_id", user_id)
      .eq("task_id", task_id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.log("Select error:", selectError);
      return res.status(500).json({ ok: false, message: selectError.message });
    }

    if (existing) {
      console.log("Task already completed");
      return res.json({
        ok: true,
        message: "Task already completed",
        completed_at: existing.completed_at,
      });
    }

    const { data, error: insertError } = await supabase
      .from("user_task_completion")
      .insert([{ user_id, task_id, completed_at: new Date().toISOString() }])
      .select()
      .single();

    if (insertError) {
      console.log("Insert error:", insertError);
      return res.status(500).json({ ok: false, message: insertError.message });
    }

    console.log("Task completed:", data);
    return res.json({ ok: true, data });
  } catch (err: any) {
    console.log("Catch error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
}
