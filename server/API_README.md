Backend API Overview
====================

This document summarizes the main REST endpoints exposed by the backend. All routes are prefixed with `/api`.

Authentication
--------------
- `POST /api/auth/register` — Create user (customer or salon_owner) with email/password.
- `POST /api/auth/login` — Obtain JWT; returns `{ token, user }`.
- `GET /api/auth/me` — Return current user; requires `Authorization: Bearer <token>`.

Verification
------------
- `POST /api/verification/send-email` — Send email verification code.
- `POST /api/verification/send-phone` — Send phone verification code.
- `POST /api/verification/verify-email` — Verify email with code.
- `POST /api/verification/verify-phone` — Verify phone with code.

Users
-----
- `GET /api/users/profile` — Get current user profile.
- `PUT /api/users/profile` — Update profile fields.
- `GET /api/users/dashboard/stats` — Customer dashboard stats.
- `GET /api/users/salon-dashboard/stats` — Salon owner dashboard stats.
- `POST /api/users/favorites/:salonId` — Add favorite.
- `DELETE /api/users/favorites/:salonId` — Remove favorite.

Salons
------
- `GET /api/salons` — Public browse with query filters (`page`, `limit`, `search`, `city`, `category`, `minRating`, `priceRange`, `partnersOnly`).
- `GET /api/salons/:id` — Public salon detail (approved salons).
- `GET /api/salons/owner/my-salon` — Salon owner’s salon.
- `PUT /api/salons/owner/my-salon` — Update salon (owner).

Services
--------
- `GET /api/services/salon/:salonId?activeOnly=true|false` — List services for a salon.
- `POST /api/services` — Create service (owner).
- `PUT /api/services/:id` — Update service (owner).
- `DELETE /api/services/:id` — Delete service (owner).

Employees
---------
- `GET /api/employees/salon/:salonId` — List employees for a salon.
- `POST /api/employees` — Create employee (owner).
- `PUT /api/employees/:id` — Update employee (owner).
- `DELETE /api/employees/:id` — Delete employee (owner).

Appointments
------------
- `GET /api/appointments` — Query by `status`, `date`, `salonId`, `customerId` (filters optional, auth required).
- `GET /api/appointments/:id` — Appointment detail (auth).
- `POST /api/appointments` — Create appointment (auth).
- `PATCH /api/appointments/:id/status` — Update status (owner or involved customer).
- `PUT /api/appointments/:id` — Update appointment (owner or customer, rules enforced).
- `DELETE /api/appointments/:id` — Cancel appointment (auth, rules enforced).

Admin (requires admin JWT)
--------------------------
- `GET /api/admin/stats` — Platform stats.
- `GET /api/admin/salons/pending` — Pending salons with pagination.
- `GET /api/admin/salons` — All salons with optional `status` filter and pagination.
- `PATCH /api/admin/salons/:id/approve` — Approve salon.
- `PATCH /api/admin/salons/:id/reject` — Reject salon (optional `reason` body).
- `PATCH /api/admin/salons/:id/suspend` — Suspend salon (optional `reason` body).

Auth & Filtering Notes
----------------------
- Protected routes require `Authorization: Bearer <token>`.
- Role guards: salon-owner routes require `user_type = 'salon_owner'`; admin routes require `user_type = 'admin'`.
- Public salon browsing filters (`/api/salons`) are applied on the backend (SQL WHERE + pagination).
- Admin salon listing filters (`status`, `page`, `limit`) are applied on the backend.

Migrations
----------
- On server start, migrations/schema checks run automatically to keep the database up to date.

