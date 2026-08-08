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

const BOOKING_URL = "https://metsmediahouse.com.au/book/?skip=1";

const firstNameOf = (name) => String(name || "").trim().split(/\s+/)[0] || "there";

const looksSendable = (email) => /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(String(email || "").trim());

function confirmationHtml(data) {
  const first = esc(firstNameOf(data.name));
  return `<div style="font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:520px">
<p>Thanks ${first}, we have your application.</p>
<p>If you haven't picked a time yet, you can do that here.</p>
<p><a href="${BOOKING_URL}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Book your time</a></p>
<p>Before we speak we will go through your website and socials properly, so we turn up already knowing your operation instead of asking you to walk us through it.</p>
<p>The call itself is thirty minutes of questions. What you sell, who you are trying to reach, what has worked and what has not. Then we tell you straight what we would do about it.</p>
<p>Nothing to prepare. Just be somewhere you can talk properly.</p>
<p>Jordan and Callum<br>Mets Media House</p>
</div>`;
}

async function send(env, payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("resend failed", res.status, await res.text());
    return false;
  }
  return true;
}

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

  const notified = await send(env, {
    from,
    to,
    reply_to: data.email || undefined,
    subject: `Application: ${val(data.name)} - ${val(data.business).slice(0, 60)}`,
    html,
  });

  // Confirmation to the applicant. Never let this failing affect the response,
  // the internal notification is the one that matters.
  let confirmed = false;
  if (looksSendable(data.email)) {
    try {
      confirmed = await send(env, {
        from,
        to: [String(data.email).trim()],
        reply_to: "callum@metsmediahouse.com.au",
        subject: "We have your application",
        html: confirmationHtml(data),
      });
    } catch (error) {
      console.error("confirmation send threw", error);
    }
  }

  if (!notified) {
    return new Response(JSON.stringify({ ok: false, error: "send failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, confirmed }), {
    headers: { "content-type": "application/json" },
  });
}
