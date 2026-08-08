// POST /api/apply
// Receives a completed application from /apply and emails it to the team.
// Cloudflare Pages env vars required: RESEND_API_KEY. Optional: APPLY_TO, APPLY_FROM.

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const val = (v) => {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "(none selected)";
  const s = String(v ?? "").trim();
  return s.length ? s : "(blank)";
};

const ROWS = [
  ["Name", "name"],
  ["Email", "email"],
  ["Website", "website"],
  ["State", "state"],
  ["Monthly marketing budget", "budget"],
  ["What the business does", "business"],
  ["Why they need content", "contentReasons"],
  ["...in their words", "contentReasonsOther"],
  ["Services they want", "services"],
  ["...in their words", "servicesOther"],
  ["Timeline", "timeline"],
];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const to = (env.APPLY_TO || "callum@metsmediahouse.com.au,jordan@metsmediahouse.com.au")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = env.APPLY_FROM || "Mets Apply <apply@metsmediahouse.com.au>";

  const body = ROWS.map(
    ([label, key]) =>
      `<tr><td style="padding:6px 14px 6px 0;vertical-align:top;color:#888;white-space:nowrap">${esc(
        label
      )}</td><td style="padding:6px 0;vertical-align:top"><strong>${esc(
        val(data[key])
      )}</strong></td></tr>`
  ).join("");

  const meta = [
    `Submitted: ${esc(data.submittedAt || new Date().toISOString())}`,
    `Referrer: ${esc(data.referrer || "(none)")}`,
    `Landing page: ${esc(data.landingPage || "(unknown)")}`,
  ].join("<br>");

  const html = `<div style="font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111">
<h2 style="margin:0 0 4px">New application: ${esc(val(data.name))}</h2>
<p style="margin:0 0 18px;color:#666">They are on their way to the booking page now. Check the calendar for a matching booking.</p>
<table style="border-collapse:collapse">${body}</table>
<p style="margin:22px 0 0;font-size:12px;color:#999">${meta}</p>
</div>`;

  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "no api key" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: data.email || undefined,
      subject: `Application: ${val(data.name)} - ${val(data.business).slice(0, 60)}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("resend failed", res.status, await res.text());
    return new Response(JSON.stringify({ ok: false, error: "send failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
