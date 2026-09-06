import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "onboarding@resend.dev";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { email } = await req.json();

    if (!email || !email.endsWith("@konradlorenz.edu.co")) {
      return new Response(JSON.stringify({ error: "Solo correos @konradlorenz.edu.co" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error: upsertErr } = await adminClient
      .from("verification_codes")
      .upsert({ email, code, expires_at: expiresAt });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="background: #1A73E8; color: white; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Kon-Privacidad</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Confirmacion de registro</p>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #333; font-size: 15px;">Bienvenido a Kon-Privacidad.</p>
          <p style="color: #333; font-size: 15px;">Tu codigo de verificacion es:</p>
          <p style="letter-spacing: 8px; font-family: monospace; font-size: 34px; color: #1A73E8; font-weight: bold; margin: 16px 0;">${code}</p>
          <p style="color: #666; font-size: 12px;">Ingresa este codigo en la aplicacion para confirmar tu registro. Expira en 10 minutos.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
          <p style="color: #aaa; font-size: 11px;">Kon-Privacidad — Fundacion Universitaria Konrad Lorenz</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: `${code} es tu codigo de verificacion`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "No se pudo enviar el correo" }), {
        status: 500,
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