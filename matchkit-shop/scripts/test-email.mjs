// Sends one test email to check the email settings in .env.local.
// Uses Resend when RESEND_API_KEY is set, otherwise Mailgun (same rule as the shop).
//   npm run mail:test -- you@example.com

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run mail:test -- you@example.com");
  process.exit(1);
}

const subject = "MatchKit test email";
const text = "If you can read this, email is set up correctly for MatchKit order confirmations.";

async function viaResend() {
  const from = process.env.RESEND_FROM || "MatchKit <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  return { provider: "Resend", res, hints: {
    401: "The API key is wrong or was deleted. Create a new one in Resend → API Keys.",
    403: "Without a verified domain, Resend only sends to the email address you signed up with. Send to that address.",
    422: "Check RESEND_FROM. Without a verified domain it must use onboarding@resend.dev.",
  } };
}

async function viaMailgun() {
  const { MAILGUN_API_KEY: key, MAILGUN_DOMAIN: domain } = process.env;
  if (!domain) throw new Error("MAILGUN_DOMAIN must be set in .env.local");
  const base = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";
  const body = new FormData();
  body.set("from", process.env.MAILGUN_FROM || `MatchKit <postmaster@${domain}>`);
  body.set("to", to);
  body.set("subject", subject);
  body.set("text", text);
  const res = await fetch(`${base}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` },
    body,
  });
  return { provider: "Mailgun", res, hints: {
    401: "The API key is wrong, or MAILGUN_API_BASE is the wrong region (US vs EU).",
    403: "Sandbox domains can only send to authorized recipients. Add and confirm this address in Mailgun.",
    404: "MAILGUN_DOMAIN doesn't match a domain in your account (or it's in the other region).",
  } };
}

if (!process.env.RESEND_API_KEY && !process.env.MAILGUN_API_KEY) {
  console.error("Set RESEND_API_KEY (or MAILGUN_API_KEY and MAILGUN_DOMAIN) in .env.local");
  process.exit(1);
}

const { provider, res, hints } = process.env.RESEND_API_KEY ? await viaResend() : await viaMailgun();
const reply = await res.text();

if (res.ok) {
  console.log(`Sent with ${provider}. Check ${to} (and the spam folder).`);
} else {
  console.error(`${provider} said ${res.status}: ${reply}`);
  if (hints[res.status]) console.error(`→ ${hints[res.status]}`);
  process.exit(1);
}
