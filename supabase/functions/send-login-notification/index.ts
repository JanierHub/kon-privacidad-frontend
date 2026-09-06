import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { user_id, email, full_name, sign_in_time } = await req.json();

    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    const name = full_name || email.split("@")[0];
    const time = sign_in_time || new Date().toLocaleString("es-CO");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: #DB0160; color: white; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Kon-Privacidad</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Notificación de seguridad</p>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #333; font-size: 15px;">Hola <strong>${name}</strong>,</p>
          <p style="color: #333; font-size: 15px;">Se detectó un <strong>nuevo inicio de sesión</strong> en tu cuenta:</p>
          <div style="background: white; border-radius: 8px; padding: 12px; margin: 12px 0; border: 1px solid #e0e0e0;">
            <p style="margin: 4px 0; font-size: 13px; color: #666;">📧 <strong>Correo:</strong> ${email}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #666;">🕐 <strong>Fecha/Hora:</strong> ${time}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 16px;">
            Si no fuiste tú, cambia tu contraseña inmediatamente o contacta al administrador.
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
          <p style="color: #aaa; font-size: 11px; text-align: center;">
            Kon-Privacidad — Fundación Universitaria Konrad Lorenz
          </p>
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set - skipping email. Would send to:", email);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const FROM = Deno.env.get("RESEND_FROM") ?? "onboarding@resend.dev";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "🔔 Nuevo inicio de sesión — Kon-Privacidad",
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});