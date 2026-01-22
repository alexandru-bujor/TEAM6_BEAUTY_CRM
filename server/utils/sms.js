import twilio from 'twilio';

let client = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendSmsVerification(phone, code) {
  const body = `Your Lume verification code is ${code}. It expires in 10 minutes.`;

  if (!client) {
    console.log('\n📱 [Twilio not configured] SMS verification fallback');
    console.log(`To: ${phone}`);
    console.log(`Code: ${code}`);
    return { mocked: true };
  }

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { mocked: false };
}

export async function sendGenericSms(to, body) {
  if (!client) {
    console.log('\n📱 [Twilio not configured] SMS fallback');
    console.log(`To: ${to}`);
    console.log(body);
    return { mocked: true };
  }

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  return { mocked: false };
}

