<div align="center">

# 🩺 DocAppoint

### A role-based doctor appointment platform — web, API and Android, in one project

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-F05340)](https://www.better-auth.com/)
[![Capacitor](https://img.shields.io/badge/Android-Capacitor-119EFF?logo=capacitor)](https://capacitorjs.com/)

**[🌐 Live app](https://docappointproject.netlify.app)** ·
**[💻 Client](https://github.com/IM-Tamim/doctor-appointment-client)** ·
**[⚙️ Server](https://github.com/IM-Tamim/doctor-appointment-server)** ·
**[📱 Mobile](https://github.com/IM-Tamim/doctor-appointment-mobile)**

</div>

---

## What it is

DocAppoint is a hospital-and-doctor booking platform built for Bangladesh. A patient
searches verified doctors, books a numbered serial in a real time slot, pays online or
in cash, joins a video consultation, and walks away with a QR-verifiable digital
prescription. Doctors run their own day from a dashboard with a live queue. Hospital
managers maintain their hospital profile, doctor roster and ambulance fleet. Admins
gate every doctor behind manual approval and own the money rules.

It is one product in three deployables:

| Folder | What it is | Stack |
|---|---|---|
| **[`next/`](./next)** | The web app + auth server + PWA | Next.js 16 (App Router), React 19, Tailwind 4, DaisyUI 5, Better Auth, next-intl |
| **[`node/`](./node)** | The REST API — all business logic | Express, MongoDB driver, Zod, PDFKit, Nodemailer |
| **[`mobile/`](./mobile)** | Android shell around the live site | Capacitor |

Rough size: **32 pages**, **49 components**, **89 API endpoints**, **13 MongoDB
collections**, **1,055 translated strings** across English and Bangla.

---

## 👥 Four roles

| Role | Stored as | How you get it | What it can do |
|---|---|---|---|
| 🧑 **Patient** | `patient` | Default for every signup | Search and compare doctors, book / reschedule / cancel, pay, join video calls, track live queue position, save doctors, add family profiles, review visits, download prescriptions, register as a blood donor |
| 🩺 **Doctor** | `doctor` | Apply → **admin approval** | Own appointments (confirm / complete / no-show), weekly availability + leave days, run the live queue, write digital prescriptions, set fee and consultation type, mark cash received |
| 🏥 **Hospital manager** | `hospital_admin` | An admin assigns it, together with a hospital | One hospital only: its contact details, logo, departments; list and unlist already-approved doctors; manage its ambulances |
| 🛡️ **Admin** | `admin` | `node/scripts/make-admin.js` only | Approve / reject doctors, suspend and reactivate any user, grant or revoke managers, create and edit hospitals, view all payments, set the refund policy, platform analytics |

The role lives on the user document with `input: false`, so **a client can never send a
role at signup** — no self-promotion to doctor or admin. There is no public path to
`admin` at all.

---

## ✨ Features

**Booking**

- Real availability: per-weekday sessions, slot length, patients-per-hour, leave days
- Numbered serials per day, so a slot maps to an actual queue position
- Unpaid online bookings **hold the slot for 10 minutes**, then release it
- Reschedule and cancel against a **configurable refund policy** (full / partial / doctor-cancel percentages, free reschedule count)
- Video consultations over Jitsi Meet — an unguessable room name is the link, so no account or API key is needed

**Money**

- SSLCommerz (sandbox and live), a clearly-labelled demo mobile-banking flow, or cash at the hospital
- Every path funnels through one **idempotent `markPaid()`**, so the browser redirect and the server-to-server IPN can both arrive without double counting
- PDF receipts, and an admin ledger of every payment

**Clinical**

- **Live queue** — the doctor taps "Next patient"; patients see their position, and whoever is two away gets notified
- **Digital prescriptions** — a PDF carrying a QR code that opens a public verify page, so a pharmacist can check it without an account
- Dose patterns like `1+0+1` become **medicine-reminder notifications** on the right days
- Follow-up suggestions after a completed visit

**Emergency**

- Blood donor registry with the 90-day donation gap enforced, and urgent requests that notify matching donors
- Ambulance directory per hospital (Basic / AC / ICU / Freezer)

**AI assistant**

- Symptom → specialty suggestions via Gemini, constrained to a **fixed enum of our own specialties** and then matched against real doctors in the database, so it cannot invent a doctor
- A keyword **red-flag check runs on every message regardless of the model** (chest pain, stroke signs, self-harm… in English and Bangla) and always wins
- A keyword classifier takes over when no API key is set or the call fails — the feature degrades, it does not break

**Platform**

- Email/password with **OTP email verification**, plus Google OAuth
- In-app notification bell and email on every state change (Nodemailer / Gmail SMTP)
- **English / Bangla** throughout, switched by cookie — URLs never change
- **PWA**: installable, hand-written service worker, offline page
- Light/dark theme, responsive down to phone width
- Installable **Android APK** wrapping the live site

---

## 🏗️ How the pieces fit

```
                 ┌─────────────────────────────────────┐
  Browser / PWA  │  next/  — Next.js 16                │
  Android (APK) ─┤                                     │
                 │  • pages & server components        │
                 │  • Better Auth  ──> issues JWT      │
                 │  • /api/auth/jwks   (public keys)   │
                 │  • proxy.js         (edge guard)    │
                 └───────────────┬─────────────────────┘
                                 │  Bearer JWT
                                 ▼
                 ┌─────────────────────────────────────┐
                 │  node/  — Express API               │
                 │  verifyToken      → JWKS verify     │
                 │  requireRole(...) → 403 otherwise   │
                 │  89 endpoints, all business logic   │
                 └───────────────┬─────────────────────┘
                                 ▼
                 ┌─────────────────────────────────────┐
                 │  MongoDB Atlas — one database       │
                 └─────────────────────────────────────┘
```

**The auth handshake is the interesting part.** Better Auth lives in the Next app and
issues the JWTs. Express verifies them against the client's **JWKS endpoint** — public
keys fetched over HTTP — so the two services share **no secret**. They deploy
independently, and keys rotate without redeploying the API.

Authorization is then checked in four places on purpose, each doing only what it can
afford to:

1. `next/src/proxy.js` — edge guard. Only parses the session cookie (no DB, no Node APIs, so it bundles cleanly on Netlify's Deno edge runtime). **Optimistic by design** — it proves a cookie exists, not that it is valid.
2. `dashboard/layout.jsx` — validates the real session, the role, and suspended status.
3. `SessionGuard` — client-side route guard.
4. The Express API — verifies the JWT, then enforces role **and** record ownership.

A forged cookie therefore buys a redirect-free page load and nothing else.

---

## 🗄️ Data model

13 collections in one database:

| Collection | Holds |
|---|---|
| `user` | Better Auth accounts, extended with `role`, `status`, `phone`, `hospitalId`, `profiles[]` (family), `savedDoctors[]` |
| `doctors` | Doctor profiles and applications (`approvalStatus`), availability, fee, specialty, `hospitalId` |
| `appointments` | Bookings: date, time, serial, status, payment state, meeting URL |
| `payments` | The ledger — one entry per settled payment or refund |
| `prescriptions` | Medicines, dose patterns, reminder state, verify token |
| `queues` | The serial now being served, per doctor per date |
| `hospitals` | Hospital profiles, departments, logo and cover |
| `ambulances` | Fleet per hospital |
| `donors`, `bloodRequests` | Blood donor registry and urgent requests |
| `notifications` | The in-app bell feed |
| `settings` | Refund policy and other admin-tunable config |
| `downloadTokens` | Short-lived tokens for PDF links |

---

## ⚙️ Running it locally

Needs Node 20+, a MongoDB Atlas URI, and — for file uploads — a Cloudinary account.

**1. API** — `node/`

```bash
cd node && npm install && cp .env.example .env && npm run dev
```

Fill in `MONGO_URI`, `DB_NAME`, `CLIENT_URL`, and optionally `GMAIL_*`, `SSLCZ_*`,
`GEMINI_API_KEY`. Serves on `http://localhost:8000`.

**2. Web app** — `next/`

```bash
cd next && npm install && cp .env.example .env && npm run dev
```

Fill in `MONGO_URI`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_*`, `NEXT_PUBLIC_SERVER_URL`,
`CLOUDINARY_*`. Serves on `http://localhost:3000`.

**3. First admin** — sign up normally through the UI, then:

```bash
cd node && node scripts/make-admin.js you@example.com
```

**4. Sample data** (optional) — `next/scripts/seed.mjs` resets and seeds everything
(hospitals, doctors, patients, managers, 60 days of history). `seed-managers.mjs` tops
up just the hospital-manager accounts and is safe to re-run on a live database.

**5. Android APK** (optional) — `mobile/`

```bash
cd mobile && npm install && npm run set-url -- https://your-site.netlify.app && npm run build:apk
```

The URL must be `https` — cleartext HTTP is disabled by the Android network policy.

### Keys you can skip

The app degrades instead of breaking. No `GEMINI_API_KEY` → the assistant falls back to
keyword matching. No `SSLCZ_*` → the demo payment flow and cash still work. No
`CLOUDINARY_*` → image fields still accept a pasted link. No `GMAIL_*` → in-app
notifications still land, emails do not.

---

## 🚀 Deployment

- **Web app** → Netlify (`next/netlify.toml`). It needs a Node runtime, not a static export: it has middleware, an auth route handler, and per-request server components.
- **API** → any Node host (Render, Railway, Fly). Set `CLIENT_URL`, or production CORS blocks every browser request and every JWT fails to verify — the server logs a fatal warning for exactly this case.
- **Android** → `mobile/` loads the deployed URL in a WebView, so **a Netlify deploy updates the app instantly**; the APK only gets rebuilt when the shell itself changes.

---

## 📐 Decisions worth knowing

The things in here that look odd are usually load-bearing:

- **Session cookie caching is off.** Admin actions (approve, suspend, assign manager) write straight to MongoDB; a cached session cookie would not see those writes and kept serving stale roles. One extra DB read per request is cheaper than that class of bug.
- **Notification emails are fire-and-forget.** Awaiting Gmail's SMTP handshake on hosts that throttle outbound SMTP made a booking take **121 seconds** instead of about one. The appointment had already been saved; only the spinner was stuck.
- **`middleware.js` is `proxy.js`.** Next 16 renamed it. It also cannot import the MongoDB driver, because Netlify compiles middleware to a Deno edge function where Node's `net` / `tls` / `dns` do not exist.
- **The service worker is hand-written,** not generated by `next-pwa`/Workbox, which lag new Next releases. Nothing personal or authenticated is ever written to the cache.
- **No Google sign-in inside the Android app.** Google blocks OAuth in embedded WebViews (`disallowed_useragent`), and the session cookie would land in the system browser instead of the app. The app shows a note and uses email/password rather than a button that silently fails.
- **A DNS fallback at boot.** When the host's resolver is loopback-only, the server switches to public DNS — otherwise the Atlas SRV lookup fails before anything else runs.
- **Hospital name and city are admin-only,** even for that hospital's own manager: those two fields identify the hospital platform-wide.

---

<div align="center">
Built as a full-stack semester project — RUET, ETE Dept.
</div>
