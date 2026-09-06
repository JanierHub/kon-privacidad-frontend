import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");

    const { target_id, target_email } = await req.json();

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: caller, error: authErr } = await adminClient.auth.getUser(jwt);
    if (authErr || !caller.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    let targetId = target_id;

    if (!targetId && target_email) {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", target_email)
        .single();
      if (!targetProfile?.id) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      targetId = targetProfile.id;
    }

    if (!targetId) {
      targetId = caller.user.id;
    }

    if (!isAdmin && targetId !== caller.user.id) {
      return new Response(
        JSON.stringify({ error: "Solo un administrador puede eliminar cuentas de otros usuarios" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (caller.user.email) {
      await adminClient.from("verification_codes").delete().eq("email", caller.user.email);
    }

    const { error } = await adminClient.auth.admin.deleteUser(targetId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: targetId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});