import nodemailer from 'nodemailer';

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmailVerification(email, code, extra = {}) {
  const subject = 'Your Lume verification code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`;

  if (!transporter) {
    console.log('\n📧 [SMTP not configured] Email verification fallback');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    return { mocked: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
    ...extra,
  });

  return { mocked: false };
}

export async function sendGenericEmail(to, subject, text, html) {
  if (!transporter) {
    console.log('\n📧 [SMTP not configured] Email fallback');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || '');
    return { mocked: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { mocked: false };
}

