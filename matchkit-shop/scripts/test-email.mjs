// Sends one test email through Mailgun to check the settings in .env.local.
//   npm run mail:test -- you@example.com

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run mail:test -- you@example.com");
  process.exit(1);
}

const { MAILGUN_API_KEY: key, MAILGUN_DOMAIN: domain } = process.env;
const base = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";
const from = process.env.MAILGUN_FROM || `MatchKit <postmaster@${domain}>`;

if (!key || !domain) {
  console.error("MAILGUN_API_KEY and MAILGUN_DOMAIN must be set in .env.local");
  process.exit(1);
}

const body = new FormData();
body.set("from", from);
body.set("to", to);
body.set("subject", "MatchKit test email");
body.set("text", "If you can read this, Mailgun is set up correctly for MatchKit order confirmations.");

const res = await fetch(`${base}/v3/${domain}/messages`, {
  method: "POST",
  headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` },
  body,
});
const text = await res.text();

if (res.ok) {
  console.log(`Sent. Mailgun accepted the message for ${to}. Check the inbox (and spam folder).`);
} else {
  console.error(`Mailgun said ${res.status}: ${text}`);
  if (res.status === 401) console.error("→ The API key is wrong, or MAILGUN_API_BASE is the wrong region (US vs EU).");
  if (res.status === 403) console.error("→ Sandbox domains can only send to authorized recipients. Add and confirm this address in Mailgun.");
  if (res.status === 404) console.error("→ MAILGUN_DOMAIN doesn't match a domain in your account (or it's in the other region).");
  process.exit(1);
}
