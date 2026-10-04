import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: "Supabase server configuration is missing" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("success_stories")
      .select("id,name,avatar_url,loan_type,amount,approval_time,rating,is_verified,location,profession,loan_tenure,like_count,love_count,wow_count")
      .order("rating", { ascending: false })
      .limit(10);

    if (error) {
      console.error("success-stories API error:", error);
      return res.status(500).json({ ok: false, error: "Could not load success stories" });
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ ok: true, data: data || [] });
  } catch (error) {
    console.error("success-stories API exception:", error);
    return res.status(500).json({ ok: false, error: "Could not load success stories" });
  }
}
