import "server-only";
import { formatDate, formatNaira, KIT_LABELS, storageUrl } from "./format";

export type EmailOrder = {
  order_number: string;
  customer_name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  total: number;
  subtotal: number;
  created_at: string;
};

export type EmailOrderItem = {
  product_name: string;
  club_name: string;
  kit_type: string;
  image_path: string | null;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Message = { to: string; subject: string; html: string; text: string };

// Sends the order confirmation. Uses Resend when RESEND_API_KEY is set, otherwise Mailgun.
// Returns an error message instead of throwing, so a mail problem never loses an order.
export async function sendOrderConfirmation(order: EmailOrder, items: EmailOrderItem[]): Promise<string | null> {
  const message: Message = {
    to: `${order.customer_name} <${order.email}>`,
    subject: `Your MatchKit order ${order.order_number} is confirmed`,
    html: renderHtml(order, items),
    text: renderText(order, items),
  };
  if (process.env.RESEND_API_KEY) return sendWithResend(message);
  if (process.env.MAILGUN_API_KEY) return sendWithMailgun(message);
  return "No email provider configured (set RESEND_API_KEY, or MAILGUN_API_KEY and MAILGUN_DOMAIN).";
}

async function sendWithResend(message: Message): Promise<string | null> {
  // onboarding@resend.dev works without a verified domain, but then only delivers to the
  // email address the Resend account was created with.
  const from = process.env.RESEND_FROM || "MatchKit <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    });
    if (!res.ok) return `Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`;
    return null;
  } catch (e) {
    return `Could not reach Resend: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function sendWithMailgun(message: Message): Promise<string | null> {
  const apiKey = process.env.MAILGUN_API_KEY!;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!domain) return "Mailgun is not configured (MAILGUN_DOMAIN missing).";

  const base = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";
  const from = process.env.MAILGUN_FROM || `MatchKit <orders@${domain}>`;

  const body = new FormData();
  body.set("from", from);
  body.set("to", message.to);
  body.set("subject", message.subject);
  body.set("html", message.html);
  body.set("text", message.text);

  try {
    const res = await fetch(`${base}/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
      body,
    });
    if (!res.ok) return `Mailgun responded ${res.status}: ${(await res.text()).slice(0, 300)}`;
    return null;
  } catch (e) {
    return `Could not reach Mailgun: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function renderText(order: EmailOrder, items: EmailOrderItem[]) {
  return [
    `Hi ${order.customer_name},`,
    "",
    "Thanks for shopping with MatchKit. Your order is confirmed.",
    "",
    `Order number: ${order.order_number}`,
    `Order date: ${formatDate(order.created_at)}`,
    "",
    ...items.map(
      (i) => `- ${i.club_name} ${KIT_LABELS[i.kit_type] ?? i.kit_type} Jersey | Size ${i.size} | Qty ${i.quantity} | ${formatNaira(i.line_total)}`
    ),
    "",
    `Total: ${formatNaira(order.total)}`,
    "",
    `Delivering to: ${order.address}, ${order.city}, ${order.state}`,
    "",
    "MatchKit · Football jerseys",
  ].join("\n");
}

function renderHtml(order: EmailOrder, items: EmailOrderItem[]) {
  const logo = storageUrl("brand/matchkit-logo.jpeg");
  const rows = items
    .map((i) => {
      const img = storageUrl(i.image_path);
      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e2dbcd;width:72px;vertical-align:top">
          ${img ? `<img src="${img}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:contain;background:#eee8dc">` : ""}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e2dbcd;vertical-align:top;font-size:14px;color:#161513">
          ${esc(i.club_name)} ${esc(KIT_LABELS[i.kit_type] ?? i.kit_type)} Jersey<br>
          <span style="font-size:12px;color:#8b857a">Size ${esc(i.size)} &middot; Qty ${i.quantity} &middot; ${formatNaira(i.unit_price)} each</span>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e2dbcd;vertical-align:top;text-align:right;font-size:14px;color:#161513;white-space:nowrap">
          ${formatNaira(i.line_total)}
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8f4ec;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ec;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fdfbf7;padding:36px 32px">
        <tr><td align="center" style="padding-bottom:24px;border-bottom:1px solid #e2dbcd">
          ${logo ? `<img src="${logo}" alt="MatchKit" width="160" style="display:block;width:160px;height:auto">` : `<strong style="font-size:24px">MatchKit</strong>`}
        </td></tr>
        <tr><td style="padding:28px 0 8px">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#2d4b9a">Order confirmed</p>
          <h1 style="margin:0 0 14px;font-size:22px;font-weight:400;color:#161513">Thank you, ${esc(order.customer_name)}.</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4a463f">Your jerseys are reserved and your order has been received. Here are your details.</p>
        </td></tr>
        <tr><td style="padding:18px 0">
          <table role="presentation" width="100%" style="font-size:13px;color:#161513">
            <tr><td style="color:#8b857a;padding:3px 0">Order number</td><td align="right"><strong>${esc(order.order_number)}</strong></td></tr>
            <tr><td style="color:#8b857a;padding:3px 0">Order date</td><td align="right">${formatDate(order.created_at)}</td></tr>
          </table>
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:18px 0 4px">
          <table role="presentation" width="100%" style="font-size:14px;color:#161513">
            <tr><td style="color:#8b857a;padding:3px 0">Subtotal</td><td align="right">${formatNaira(order.subtotal)}</td></tr>
            <tr><td style="color:#8b857a;padding:3px 0">Delivery</td><td align="right">Free</td></tr>
            <tr><td style="padding:10px 0 0;font-size:16px"><strong>Total</strong></td><td align="right" style="padding:10px 0 0;font-size:16px"><strong>${formatNaira(order.total)}</strong></td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 0 0;border-top:1px solid #e2dbcd;margin-top:16px;font-size:13px;line-height:1.6;color:#4a463f">
          <p style="margin:16px 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b857a">Delivering to</p>
          ${esc(order.address)}<br>${esc(order.city)}, ${esc(order.state)}
        </td></tr>
        <tr><td align="center" style="padding-top:32px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b857a">
          MatchKit &middot; Football jerseys
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
