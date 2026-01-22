import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from '../database/connection.js';
import { runMigrations } from '../database/migrate.js';

dotenv.config();

async function ensureUser({ email, password, user_type, first_name, last_name, phone }) {
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    const userId = existing[0].id;
    await pool.execute(
      `UPDATE users SET first_name = ?, last_name = ?, phone = ?, user_type = ? WHERE id = ?`,
      [first_name, last_name, phone, user_type, userId]
    );
    return userId;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    `INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [email, password_hash, user_type, first_name, last_name, phone]
  );
  return result.insertId;
}

async function ensureSalon(ownerId, salon) {
  const [existing] = await pool.execute(
    'SELECT id FROM salons WHERE owner_id = ? LIMIT 1',
    [ownerId]
  );

  if (existing.length > 0) {
    const salonId = existing[0].id;
    await pool.execute(
      `UPDATE salons SET salon_name = ?, contact_name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip_code = ?, description = ?, status = ?, is_partner = ?, price_range = ?
       WHERE id = ?`,
      [
        salon.salon_name,
        salon.contact_name,
        salon.email,
        salon.phone,
        salon.address,
        salon.city,
        salon.state,
        salon.zip_code,
        salon.description,
        salon.status,
        salon.is_partner,
        salon.price_range,
        salonId,
      ]
    );
    return salonId;
  }

  const [result] = await pool.execute(
    `INSERT INTO salons (owner_id, salon_name, contact_name, email, phone, address, city, state, zip_code, description, status, is_partner, price_range)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ownerId,
      salon.salon_name,
      salon.contact_name,
      salon.email,
      salon.phone,
      salon.address,
      salon.city,
      salon.state,
      salon.zip_code,
      salon.description,
      salon.status,
      salon.is_partner,
      salon.price_range,
    ]
  );
  return result.insertId;
}

async function ensureCategories(salonId, categories) {
  await pool.execute('DELETE FROM salon_categories WHERE salon_id = ?', [salonId]);
  if (categories.length === 0) return;
  const values = categories.map((c) => [salonId, c]);
  await pool.query('INSERT INTO salon_categories (salon_id, category) VALUES ?', [values]);
}

async function ensureService(salonId, service) {
  const [existing] = await pool.execute(
    'SELECT id FROM services WHERE salon_id = ? AND name = ? LIMIT 1',
    [salonId, service.name]
  );

  if (existing.length > 0) {
    const serviceId = existing[0].id;
    await pool.execute(
      `UPDATE services SET category = ?, duration = ?, price = ?, description = ?, is_active = TRUE WHERE id = ?`,
      [service.category, service.duration, service.price, service.description, serviceId]
    );
    return serviceId;
  }

  const [result] = await pool.execute(
    `INSERT INTO services (salon_id, name, category, duration, price, description, is_active)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [salonId, service.name, service.category, service.duration, service.price, service.description]
  );
  return result.insertId;
}

async function ensureEmployee(salonId, employee) {
  const [existing] = await pool.execute(
    'SELECT id FROM employees WHERE salon_id = ? AND name = ? LIMIT 1',
    [salonId, employee.name]
  );

  if (existing.length > 0) {
    const employeeId = existing[0].id;
    await pool.execute(
      `UPDATE employees SET role = ?, email = ?, phone = ?, bio = ?, is_active = TRUE WHERE id = ?`,
      [employee.role, employee.email, employee.phone, employee.bio, employeeId]
    );
    return employeeId;
  }

  const [result] = await pool.execute(
    `INSERT INTO employees (salon_id, name, role, email, phone, bio, is_active)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [salonId, employee.name, employee.role, employee.email, employee.phone, employee.bio]
  );
  return result.insertId;
}

async function ensureAppointment(customerId, salonId, serviceId, employeeId) {
  const [existing] = await pool.execute(
    `SELECT id FROM appointments WHERE customer_id = ? AND salon_id = ? AND service_id = ? LIMIT 1`,
    [customerId, salonId, serviceId]
  );

  const now = new Date();
  const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  const dateStr = appointmentDate.toISOString().slice(0, 10);
  const timeStr = '10:00';

  if (existing.length > 0) {
    return existing[0].id;
  }

  await pool.execute(
    `INSERT INTO appointments (customer_id, salon_id, service_id, employee_id, appointment_date, appointment_time, duration, price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    [customerId, salonId, serviceId, employeeId, dateStr, timeStr, 60, 75]
  );
}

async function seed() {
  console.log('🏁 Running migrations before seeding...');
  await runMigrations();

  console.log('🌱 Seeding demo data...');

  const adminId = await ensureUser({
    email: 'admin@lume.com',
    password: 'admin123',
    user_type: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    phone: '+15550000001',
  });

  const customerId = await ensureUser({
    email: 'demo@lume.com',
    password: 'demo1234',
    user_type: 'customer',
    first_name: 'Demo',
    last_name: 'User',
    phone: '+15551234567',
  });

  const ownerId = await ensureUser({
    email: 'owner@lume.com',
    password: 'owner1234',
    user_type: 'salon_owner',
    first_name: 'Olivia',
    last_name: 'Owner',
    phone: '+15550001111',
  });

  const owner2Id = await ensureUser({
    email: 'owner2@lume.com',
    password: 'owner2345',
    user_type: 'salon_owner',
    first_name: 'Sam',
    last_name: 'Styles',
    phone: '+15550004444',
  });

  const salonId = await ensureSalon(ownerId, {
    salon_name: 'Glow Beauty Bar',
    contact_name: 'Olivia Owner',
    email: 'owner@lume.com',
    phone: '+15550001111',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    description: 'Full-service salon with modern vibes and expert stylists.',
    status: 'approved',
    is_partner: true,
    price_range: '$$$',
  });

  const salon2Id = await ensureSalon(owner2Id, {
    salon_name: 'Urban Chic Salon',
    contact_name: 'Sam Styles',
    email: 'owner2@lume.com',
    phone: '+15550004444',
    address: '456 Market Ave',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94107',
    description: 'Trendy cuts, vivid color, and downtown energy.',
    status: 'approved',
    is_partner: true,
    price_range: '$$',
  });

  await ensureCategories(salonId, ['hair', 'nails', 'skincare']);
  await ensureCategories(salon2Id, ['hair', 'color', 'barber']);

  const haircutServiceId = await ensureService(salonId, {
    name: 'Haircut & Style',
    category: 'hair',
    duration: 60,
    price: 75,
    description: 'Signature haircut with wash, blowout, and style.',
  });

  const facialServiceId = await ensureService(salonId, {
    name: 'Hydrating Facial',
    category: 'skincare',
    duration: 50,
    price: 95,
    description: 'Deep cleansing, exfoliation, and hydration boost.',
  });

  const colorServiceId = await ensureService(salon2Id, {
    name: 'Full Color Refresh',
    category: 'color',
    duration: 90,
    price: 140,
    description: 'Single-process color with shine treatment.',
  });

  const fadeServiceId = await ensureService(salon2Id, {
    name: 'Skin Fade + Beard',
    category: 'barber',
    duration: 50,
    price: 70,
    description: 'Tight fade with beard shape and hot towel finish.',
  });

  const blowoutServiceId = await ensureService(salon2Id, {
    name: 'Signature Blowout',
    category: 'hair',
    duration: 45,
    price: 55,
    description: 'Volume, polish, and finish for any occasion.',
  });

  const stylistId = await ensureEmployee(salonId, {
    name: 'Alex Rivera',
    role: 'Senior Stylist',
    email: 'alex@glowbeauty.com',
    phone: '+15550002222',
    bio: 'Specializes in precision cuts and color.',
  });

  const estheticianId = await ensureEmployee(salonId, {
    name: 'Jamie Kim',
    role: 'Esthetician',
    email: 'jamie@glowbeauty.com',
    phone: '+15550003333',
    bio: 'Loves custom facials and glowing skin routines.',
  });

  const coloristId = await ensureEmployee(salon2Id, {
    name: 'Taylor Vivid',
    role: 'Color Specialist',
    email: 'taylor@urbanchic.com',
    phone: '+15550005555',
    bio: 'Bold palettes and healthy hair focus.',
  });

  const barberId = await ensureEmployee(salon2Id, {
    name: 'Chris Fade',
    role: 'Barber',
    email: 'chris@urbanchic.com',
    phone: '+15550006666',
    bio: 'Precision fades and beard mastery.',
  });

  await ensureAppointment(customerId, salonId, haircutServiceId, stylistId);
  await ensureAppointment(customerId, salonId, facialServiceId, estheticianId);
  await ensureAppointment(customerId, salon2Id, colorServiceId, coloristId);
  await ensureAppointment(customerId, salon2Id, fadeServiceId, barberId);

  console.log('✅ Seed complete.');
  console.log('Demo logins:');
  console.log('- Admin: admin@lume.com / admin123');
  console.log('- Customer: demo@lume.com / demo1234');
  console.log('- Salon owner: owner@lume.com / owner1234');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

