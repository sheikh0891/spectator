import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Missing auth token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    // Admin client (service role) for role check + bulk insert
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) return json({ error: "Role check failed" }, 500);
    if (!roleRow) return json({ error: "Forbidden: admin only" }, 403);

    // Parse + validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const errors: Record<string, string> = {};
    const b = (body ?? {}) as Record<string, unknown>;

    const title = typeof b.title === "string" ? b.title.trim() : "";
    const rawBody = typeof b.body === "string" ? b.body.trim() : "";
    const urgent = b.urgent === true;

    if (!title) errors.title = "Le titre est requis";
    else if (title.length < 3) errors.title = "Titre trop court (min. 3)";
    else if (title.length > 120) errors.title = "Titre trop long (max. 120)";

    if (rawBody.length > 500) errors.body = "Message trop long (max. 500)";

    // Block dangerous payloads
    const dangerous = /<script|javascript:|onerror=|onload=/i;
    if (dangerous.test(title) || dangerous.test(rawBody)) {
      errors.title = errors.title ?? "Contenu non autorisé";
    }

    if (Object.keys(errors).length > 0) return json({ errors }, 400);

    // Fetch recipients
    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id");
    if (pErr) return json({ error: "Failed to load recipients" }, 500);
    if (!profiles || profiles.length === 0) {
      return json({ error: "Aucun destinataire" }, 400);
    }

    const rows = profiles.map((p) => ({
      user_id: p.id,
      title,
      body: rawBody || null,
      urgent,
    }));

    const { error: insErr } = await admin.from("notifications").insert(rows);
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, recipients: rows.length });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});