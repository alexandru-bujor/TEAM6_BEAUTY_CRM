import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';
import { sendEmailVerification } from './mailer.js';
import { sendSmsVerification } from './sms.js';

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

async function invalidatePrevious(userId, type) {
  if (!userId) return;
  await pool.execute(
    'UPDATE verification_codes SET used = TRUE WHERE user_id = ? AND type = ?',
    [userId, type]
  );
}

export async function sendEmailCode({ email, userId }) {
  if (!email) {
    throw new Error('Email is required to send verification code');
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await invalidatePrevious(userId, 'email');

  await pool.execute(
    'INSERT INTO verification_codes (user_id, code, type, email, expires_at) VALUES (?, ?, "email", ?, ?)',
    [userId || null, code, email, expiresAt]
  );

  try {
    const result = await sendEmailVerification(email, code);
    if (result.mocked) {
      console.log('\n📧 EMAIL VERIFICATION CODE');
      console.log('═══════════════════════════════════════');
      console.log(`Email: ${email}`);
      console.log(`Verification Code: ${code}`);
      console.log(`Expires at: ${expiresAt.toLocaleString()}`);
      console.log('═══════════════════════════════════════\n');
    }
  } catch (err) {
    console.warn('Email send failed, fallback to console:', err?.message || err);
    console.log('\n📧 EMAIL VERIFICATION CODE');
    console.log('═══════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expires at: ${expiresAt.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');
  }

  return { code, expiresAt };
}

export async function sendPhoneCode({ phone, userId }) {
  if (!phone) {
    throw new Error('Phone is required to send verification code');
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await invalidatePrevious(userId, 'phone');

  await pool.execute(
    'INSERT INTO verification_codes (user_id, code, type, phone, expires_at) VALUES (?, ?, "phone", ?, ?)',
    [userId || null, code, phone, expiresAt]
  );

  try {
    const result = await sendSmsVerification(phone, code);
    if (result.mocked) {
      console.log('\n📱 PHONE VERIFICATION CODE');
      console.log('═══════════════════════════════════════');
      console.log(`Phone: ${phone}`);
      console.log(`Verification Code: ${code}`);
      console.log(`Expires at: ${expiresAt.toLocaleString()}`);
      console.log('═══════════════════════════════════════\n');
    }
  } catch (err) {
    console.warn('SMS send failed, fallback to console:', err?.message || err);
    console.log('\n📱 PHONE VERIFICATION CODE');
    console.log('═══════════════════════════════════════');
    console.log(`Phone: ${phone}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expires at: ${expiresAt.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');
  }

  return { code, expiresAt };
}

