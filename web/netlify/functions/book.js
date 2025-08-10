// netlify/functions/book.js
const nodemailer = require("nodemailer");

// Build an .ics calendar invite
function icsForMeeting(iso, durationMin, summary, description) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMin * 60000);
  const toICS = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `layra-${Date.now()}@lrconsulting.xyz`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Layra//Booking//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${(description || "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const corsHeaders = (originHeader) => {
  const list = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const allow = list.includes("*") ? "*" : (list.includes(originHeader) ? originHeader : list[0] || "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
};

exports.handler = async (event) => {
  const headers = corsHeaders(event.headers.origin || "");

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { name, email, phone, notes, iso, tz } = JSON.parse(event.body || "{}");
    if (!name || !email || !iso) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Missing fields" }) };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // STARTTLS on 587
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const when = new Date(iso);
    const human = when.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
    const recipients = [
      process.env.TO_1,
      process.env.TO_2,
      process.env.TO_3,
      email, // client also receives confirmation + invite
    ].filter(Boolean).join(",");

    const subject = `New booking: ${name} — ${human}`;
    const text = [
      `New Layra booking`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "n/a"}`,
      `Local time: ${human} (${tz || "local"})`,
      `Notes:`,
      notes || "",
    ].join("\n");

    const ics = icsForMeeting(iso, 45, "Layra Appointment", `${name} — ${email}\n${notes || ""}`);

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: recipients,
      subject,
      text,
      replyTo: email, // so you can reply straight to the client
      attachments: [
        {
          filename: "invite.ics",
          content: ics,
          contentType: "text/calendar; charset=UTF-8; method=REQUEST",
        },
      ],
    });

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false }) };
  }
};
