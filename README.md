<div align="center">

# 🩺 DocAppoint — Client

### A role-based doctor appointment booking platform for Patients, Doctors & Admins

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-error)](https://www.better-auth.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![DaisyUI](https://img.shields.io/badge/UI-DaisyUI-5A0EF8)](https://daisyui.com/)

**[🌐 Live Client](#)** · **[💻 Client Repo](#)** · **[⚙️ Live Server](#)** · **[🗄️ Server Repo](#)**

</div>

---

## ✨ Overview

DocAppoint connects **patients**, **doctors**, and **platform admins** in one place: patients discover and book verified doctors, doctors manage their own schedule and patients from a dashboard, and admins gate every doctor onboarding behind a manual approval step — so nobody can list themselves as a doctor without review.

## 👥 Three Roles, Three Experiences

| Role | What they can do |
|---|---|
| 🧑‍🦰 **Patient** | Browse/search doctors, book appointments, manage bookings, leave ratings & reviews, apply to become a doctor |
| 🩺 **Doctor** | View & manage own appointments (confirm/cancel/complete), set weekly availability, add prescriptions, edit profile |
| 🛡️ **Admin** | Review & approve/reject doctor applications, manage all users (suspend/reactivate), view platform-wide stats |

## 🚀 Features

- 🔐 Email/password + Google OAuth via **Better Auth**, JWT-based role verification
- 🩺 **Verified doctor onboarding** — credential submission → admin review → approval before going live
- 📅 Doctor-managed **availability calendar** (day/slot based)
- 🔔 **In-app + email notifications** on booking, status changes, and approvals (Nodemailer / Gmail SMTP)
- 📄 **Prescription upload** after a completed visit (Cloudinary)
- ⭐ Live-updating doctor ratings & reviews
- 🌗 Light/dark theme toggle, fully responsive UI
- 🧱 Clean architecture: server components fetch, client components handle interactivity, shared logic in `src/lib/`

## 🛠️ Tech Stack

**Frontend:** Next.js 15 (App Router), Tailwind CSS, DaisyUI, Swiper.js
**Auth:** Better Auth (JWT plugin, Google OAuth, role-based `additionalFields`)
**File storage:** Cloudinary (free tier, unsigned uploads)
**Deployment:** Vercel

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/              # signin, signup, forgot-password
│   └── (main)/
│       ├── home/            # landing page
│       ├── all-appointments/  # doctor search & listing
│       ├── doctors/[id]/    # doctor details + booking
│       ├── apply-doctor/    # patient → doctor application
│       └── dashboard/
│           ├── patient/     # bookings & profile
│           ├── doctor/      # appointments, availability, profile
│           └── admin/       # approvals, users, overview
├── components/
│   ├── shared/               # Navbar, Footer, SessionGuard, DashboardSidebar, NotificationBell...
│   ├── pages/                 # feature-specific components, grouped by page
│   └── ui/                    # small reusable UI pieces
└── lib/                        # doctors.js, admin.js, notifications.js, auth.js, auth-client.js
```

## ⚙️ Getting Started

```bash
git clone <this-repo>
cd docappoint-client
npm install
cp .env.example .env   # fill in the values (see below)
npm run dev
```

### Environment Variables

See [`.env.example`](./.env.example) — you'll need a MongoDB Atlas connection string, Better Auth secret, Google OAuth credentials, your deployed server URL, and (optional but recommended) Cloudinary keys for file uploads.

## 🔑 Creating the First Admin

There is no public signup path to the admin role — sign up normally, then run the `make-admin.js` script in the **server** repo against your account's email.

## 🧩 Related

This is the **client**. The Express + MongoDB API lives in the companion **[docappoint-server](#)** repo.

---

<div align="center">
Built as a full-stack ICT semester project — RUET, ETE Dept.
</div>
