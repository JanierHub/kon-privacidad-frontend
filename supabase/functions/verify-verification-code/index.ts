import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: "email y code son requeridos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: stored, error: selErr } = await adminClient
      .from("verification_codes")
      .select("code, expires_at")
      .eq("email", email)
      .single();

    if (selErr || !stored) {
      return new Response(JSON.stringify({ error: "No hay un codigo pendiente para este correo" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (String(stored.code) !== String(code).trim()) {
      return new Response(JSON.stringify({ error: "Codigo incorrecto" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (new Date(stored.expires_at).getTime() < Date.now()) {
      await adminClient.from("verification_codes").delete().eq("email", email);
      return new Response(JSON.stringify({ error: "El codigo expiro" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await adminClient.from("verification_codes").delete().eq("email", email);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profile?.id) {
      const { error: upErr } = await adminClient.auth.admin.updateUserById(profile.id, {
        email_confirm: true,
      });
      if (upErr) {
        return new Response(JSON.stringify({ error: upErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "No se encontro el usuario" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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