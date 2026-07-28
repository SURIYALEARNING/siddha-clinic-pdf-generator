# Siddha Clinic PDF Generator

Full-stack clinic management & PDF document generator for **Lakshmi Health Care Centre Rockfort (LHCC)**.  
Generates Annexure-1, Cash Bill, Treatment Bill, and To-Whomsoever-It-May-Concern certificates.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [Production Configuration](#production-configuration)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion (Framer Motion) |
| **Backend** | Express 4, TypeScript 5.8, Mongoose 8, node-cron |
| **Database** | MongoDB 7 |
| **PDF** | jsPDF 4 + jspdf-autotable (client-side generation) |
| **Auth** | JWT (jsonwebtoken), bcryptjs (12 rounds) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Icons** | lucide-react |
| **Dev Tools** | tsx (watch mode), concurrently, vitest, supertest, Playwright |
| **Infrastructure** | Docker, Docker Compose, nginx (reverse proxy + SSL termination) |

---

## Architecture Overview

```
Browser (React SPA)
    │
    ├── /api/* ──► Express Backend (:4000) ──► MongoDB
    │                    │
    │                    ├── Auth (JWT, bcrypt)
    │                    ├── Doctors CRUD (multer uploads)
    │                    ├── Drafts CRUD (soft-delete, cron cleanup)
    │                    └── Settings (single-document upsert)
    │
    ├── PDF Generation (client-side via jsPDF)
    │
    └── Static Assets ──► nginx (production) or Vite dev server
```

**Data Flow:**
1. Patient info filled in PatientFormPage → synced to localStorage + context
2. Medicines added in MedicineEntryPage → auto-calculates totals
3. Save Draft → POST `/api/drafts` → MongoDB + localStorage fallback
4. Generate PDFs → validates form → saves draft → opens PreviewPage
5. PreviewPage → generates 4 PDF types in-browser using jsPDF

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 7 (local or Docker)
- npm or bun

### 1. Install Dependencies

```bash
# Frontend dependencies (root)
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy and edit .env
# Required variables:
VITE_API_URL=http://localhost:4000/api
MONGODB_URI=mongodb://localhost:27017/lhccpdf
JWT_SECRET=<your-random-secret>
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_EMAIL=admin@example.com
```

### 3. Start MongoDB

```bash
# Option A: Local install
mongod

# Option B: Docker
docker run -d -p 27017:27017 mongo:7
```

### 4. Run Development Server

```bash
# Run both frontend + backend simultaneously
npm run dev:all

# Or run separately:
npm run dev          # Frontend on http://localhost:3000
npm run dev:server   # Backend on http://localhost:4000
```

### 5. Build for Production

```bash
# Build frontend
npm run build         # Outputs to dist/

# Build backend
cd server && npm run build && cd ..  # Outputs to server/dist/
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend dev server (port 3000) |
| `npm run dev:server` | Start backend dev server (port 4000) |
| `npm run dev:all` | Start both frontend + backend concurrently |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-check (zero errors expected) |
| `npm test` | Run all frontend unit/component tests |
| `npm run test:watch` | Run frontend tests in watch mode |
| `npm run test:coverage` | Run frontend tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run frontend + E2E tests sequentially |

**From `server/`:**

| Command | Description |
|---|---|
| `npm run dev` | Start backend with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Start production server (compiled) |
| `npm test` | Run all backend tests (unit + integration + security) |
| `npm run test:watch` | Run backend tests in watch mode |
| `npm run test:coverage` | Run backend tests with coverage report |

---

## Project Structure

```
.
├── .env                          # Environment variables (gitignored)
├── .gitignore
├── .dockerignore
├── docker-compose.yml            # MongoDB + Backend + nginx orchestration
├── Dockerfile                    # Backend Docker image
├── vite.config.ts                # Vite config (React, Tailwind, path aliases)
├── vitest.config.ts              # Frontend test config (jsdom, React plugins)
├── tsconfig.json                 # Frontend TypeScript config
├── index.html                    # Vite entry HTML
├── package.json                  # Frontend dependencies + scripts
│
├── nginx/
│   ├── Dockerfile                # Multi-stage: build React → serve via nginx
│   ├── nginx.conf                # Base nginx config
│   └── conf.d/
│       ├── http.conf             # HTTP → HTTPS redirect
│       └── https.conf            # SSL termination + reverse proxy to backend
│
├── src/                          # Frontend source
│   ├── main.tsx                  # React entry, router, providers
│   ├── App.tsx                   # App shell (sidebar + header + pages)
│   ├── index.css                 # Tailwind imports
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   ├── assets/                   # Static images (logo, seals, footer)
│   ├── test/
│   │   └── setup.ts              # Vitest setup (jest-dom matchers, mocks)
│   ├── utils/
│   │   ├── numberToWords.ts      # INR amount → English words
│   │   ├── defaultImages.ts      # Canvas-generated default logo/signature
│   │   └── __tests__/            # Unit tests for utils
│   ├── services/
│   │   ├── api.ts                # HTTP client (fetch, JWT, FormData)
│   │   ├── pdfService.ts         # Barrel re-export of all PDF generators
│   │   ├── pdfHelpers.ts         # Shared PDF drawing utils
│   │   ├── annexurePdf.ts        # Annexure-1 PDF generator
│   │   ├── cashBillPdf.ts        # Cash Bill / Invoice PDF generator
│   │   ├── toWhomsoeverPdf.ts    # Certificate PDF generator
│   │   ├── treatmentBillPdf.ts   # Treatment Bill PDF generator
│   │   └── __tests__/            # Unit tests for services
│   ├── context/
│   │   ├── AuthContext.tsx        # Auth state (login, register, JWT)
│   │   ├── ClinicContext.tsx      # Main app state (patients, meds, drafts)
│   │   ├── ToastContext.tsx       # Toast notification system
│   │   └── __tests__/            # Unit tests for contexts
│   ├── components/
│   │   ├── Sidebar.tsx            # Navigation sidebar (responsive drawer)
│   │   ├── Header.tsx             # Top bar (save, new, generate buttons)
│   │   ├── ToastContainer.tsx     # Toast notifications UI
│   │   ├── ProtectedRoute.tsx     # Auth guard wrapper
│   │   └── __tests__/            # Unit tests for components
│   └── pages/
│       ├── LoginPage.tsx          # Email/password login
│       ├── RegisterPage.tsx       # Two-step registration (OTP)
│       ├── ForgotPasswordPage.tsx  # Three-step password reset
│       ├── DashboardPage.tsx      # Stats, active drafts, patient list
│       ├── PatientFormPage.tsx    # Patient demographics form
│       ├── MedicineEntryPage.tsx  # Medicine prescription matrix
│       ├── PreviewPage.tsx        # PDF preview hub (4 document types)
│       └── SettingsPage.tsx       # Clinic settings, doctor management
│
├── server/                       # Backend source
│   ├── package.json              # Backend dependencies + scripts
│   ├── tsconfig.json
│   ├── vitest.config.ts          # Backend test config (node, mongodb-memory-server)
│   ├── server.ts                 # Express app entry point
│   ├── config/
│   │   └── db.ts                 # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification middleware
│   │   ├── validate.ts           # express-validator rules for all routes
│   │   └── upload.ts             # Multer config (disk storage, 2MB, images only)
│   ├── models/
│   │   ├── User.ts               # User schema (name, email, hashed password)
│   │   ├── Otp.ts                 # OTP schema (TTL index, types)
│   │   ├── Doctor.ts             # Doctor schema (name, qualification, images)
│   │   ├── Draft.ts              # Draft schema (patientInfo, medicines, soft-delete)
│   │   └── Setting.ts            # Clinic settings schema (single document)
│   ├── controllers/
│   │   ├── authController.ts     # Register, login, OTP, password reset
│   │   ├── doctorController.ts   # CRUD with file uploads
│   │   ├── draftController.ts    # CRUD with soft-delete
│   │   └── settingController.ts  # Get/upsert clinic settings
│   ├── routes/
│   │   ├── auth.ts               # /api/auth endpoints
│   │   ├── doctor.ts             # /api/doctors endpoints
│   │   ├── draft.ts              # /api/drafts endpoints
│   │   └── settings.ts           # /api/settings endpoints
│   ├── utils/
│   │   └── email.ts              # Nodemailer transporter + OTP email sender
│   ├── jobs/
│   │   └── cleanupDrafts.ts      # Daily cron: purge soft-deleted drafts >30 days
│   ├── __tests__/                # Backend tests
│   │   ├── setup.ts              # mongodb-memory-server setup
│   │   ├── middleware/           # Auth & validation middleware tests
│   │   ├── controllers/          # Controller unit tests
│   │   ├── integration/          # Full API integration tests
│   │   └── security.test.ts      # Security & performance tests
│   └── uploads/doctors/          # Uploaded doctor images (gitignored)
│
└── e2e/                          # Playwright E2E tests
    ├── playwright.config.ts
    ├── auth-flows.spec.ts
    ├── patient-flow.spec.ts
    └── pdf-generation.spec.ts
```

---

## Frontend

### Pages

| Page | Route | Description |
|---|---|---|
| **LoginPage** | `/login` | Email/password authentication with "remember me" |
| **RegisterPage** | `/register` | Two-step: (1) name/email/password form, (2) 6-digit OTP verification |
| **ForgotPasswordPage** | `/forgot-password` | Three-step: email → OTP + new password → success |
| **DashboardPage** | `/` (tab) | Welcome banner, 4 stat cards, active draft tracker, saved patient history table |
| **PatientFormPage** | `/` (tab) | Patient demographics: name, company, address, country, phone, OP No, age, sex, passport/ID, diagnosis, date, invoice (auto-generated), ref no |
| **MedicineEntryPage** | `/` (tab) | Full prescription matrix: medicine name (datalist), pack qty, dosage unit, rate, total (auto-calc), morning/noon/night dosage, food instruction, remarks. Row operations: add, delete, duplicate, reorder. Payment mode split (online/cash). |
| **PreviewPage** | `/` (tab) | Document hub with 4 PDF types, live iframe preview with zoom, download single/all, print, open in new tab |
| **SettingsPage** | `/` (tab) | Doctor management (add/remove with image upload), clinic profile (name, address, phone, email, website, footer text), drag-and-drop signature upload |

### Contexts

| Context | Responsibility |
|---|---|
| **AuthContext** | User state, JWT persistence in localStorage, login/register/forgot-password flows, token verification on mount |
| **ClinicContext** | Central state: clinic settings, patient info, medicines, drafts, doctors. Auto-syncs to localStorage. Async API sync for draft/doctor/settings CRUD. Form validation logic. Payment mode tracking. |
| **ToastContext** | Toast notification queue with auto-dismiss (4s). Types: success, error, info. |

### PDF Services (client-side, via jsPDF)

| Generator | Output |
|---|---|
| `annexurePdf.ts` | Annexure-1: Medicine dosage schedule formatted for customs clearance |
| `cashBillPdf.ts` | Cash Bill / Invoice with auto-table, totals, INR words, payment mode split |
| `treatmentBillPdf.ts` | Treatment Bill with patient details, diagnosis, payment split, GSTN, disclaimers |
| `toWhomsoeverPdf.ts` | "To Whomsoever It May Concern" certification letter |

---

## Backend

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret key for signing JWTs |
| `ADMIN_EMAIL` | Yes | — | Email to receive registration OTPs |
| `EMAIL_USER` | Yes | — | Gmail address for sending OTPs |
| `EMAIL_PASS` | Yes | — | Gmail app password |
| `PORT` | No | `4000` | Backend listen port |
| `CLIENT_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `VITE_API_URL` | No | `http://localhost:4000/api` | Backend URL (frontend) |

The server **fails fast** at startup if any required env var (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `EMAIL_USER`, `EMAIL_PASS`) is missing.

### Middleware Stack (applied in order)

1. **Helmet** — Security headers (XSS, content-type sniffing, frame options, etc.)
2. **CORS** — Restricted to `CLIENT_ORIGIN`
3. **Rate Limiter (global)** — 200 requests per 15 minutes
4. **Rate Limiter (auth)** — 20 requests per 15 minutes (applied to `/api/auth`)
5. **`express.json`** — 5MB body limit
6. **mongo-sanitize** — Prevents NoSQL injection (`$ne`, `$gt`, `$where`, etc.)
7. **Static files** — `/uploads` serves doctor images
8. **Routes** — Auth, Doctors, Drafts, Settings
9. **404 handler** — JSON error for unknown routes
10. **Global error handler** — Catches Multer errors, file-too-large, unexpected errors

### Models

| Model | Key Fields |
|---|---|
| **User** | `name`, `email` (unique, lowercase), `password` (hashed) |
| **Otp** | `email`, `otp`, `type` (registration/forgot-password), `expiresAt` (TTL index), `verified` |
| **Doctor** | `name`, `qualification` (default B.S.M.S), `signature` (URL), `seal` (URL), timestamps |
| **Draft** | `patientInfo` (sub-document), `medicines` (array), `isDeleted`, `deletedBy`, `deletedAt`, timestamps |
| **Setting** | `logo`, `name`, `address`, `phone`, `email`, `website`, `signature`, `footerText`, `selectedDoctorId`, timestamps |

### Scheduled Jobs

- **Daily midnight cleanup** (`server/jobs/cleanupDrafts.ts`): Permanently deletes drafts soft-deleted more than 30 days ago.

---

## API Reference

All non-auth endpoints require `Authorization: Bearer <token>` header.

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Returns `{ status: "ok" }` |

### Authentication

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ name, email, password }` | OTP sent to admin email |
| POST | `/api/auth/verify-registration-otp` | No | `{ name, email, password, otp }` | JWT + user |
| POST | `/api/auth/login` | No | `{ email, password }` | JWT + user |
| POST | `/api/auth/forgot-password` | No | `{ email }` | Confirmation message |
| POST | `/api/auth/reset-password` | No | `{ email, otp, newPassword }` | Success message |
| GET | `/api/auth/me` | Yes | — | Current user |

### Doctors

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/doctors` | Yes | — | `{ doctors: [...] }` |
| POST | `/api/doctors` | Yes | FormData: `name`, `qualification`, `signature` (file), `seal` (file) | Created doctor |
| PUT | `/api/doctors/:id` | Yes | FormData or JSON | Updated doctor |
| DELETE | `/api/doctors/:id` | Yes | — | `{ message }` |

### Drafts

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/drafts` | Yes | — | `{ drafts: [...] }` (excludes soft-deleted) |
| POST | `/api/drafts` | Yes | `{ draftId?, patientInfo, medicines }` | Created/updated draft |
| DELETE | `/api/drafts/:id` | Yes | — | Soft-deleted `{ message }` |

### Settings

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/settings` | Yes | — | `{ settings }` or `null` |
| PUT | `/api/settings` | Yes | Settings fields | Upserted settings (single document) |

---

## Testing

The project has **3 layers of tests**: unit, integration/API, and E2E.

### Test Coverage Summary

| Category | Tests | What It Covers |
|---|---|---|
| **Frontend Unit** | 60 | Utils (numberToWords, defaultImages, pdfHelpers), API service layer, ToastContext, AuthContext, ProtectedRoute |
| **Backend Unit** | 81 | Auth middleware, validation rules (20 variants), auth controllers (16), doctor CRUD (8), draft CRUD (6), settings (4), Helmet headers, rate limiting, NoSQL injection prevention, input size limits, response time |
| **Backend Integration** | 14 | Full auth flows (register→OTP→login), password reset, protected endpoints, doctor CRUD via HTTP, draft CRUD via HTTP, settings UPSERT, validation error responses |
| **E2E (Playwright)** | 8 | Login page rendering, navigation, patient form fields, medicine entry, preview PDF options, sidebar navigation |

### Running Tests

```bash
# Frontend tests (60 tests)
npm test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report

# Backend tests (81 tests)
cd server && npm test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report

# E2E tests (requires running app)
npm run test:e2e

# All tests
npm run test:all
```

### Test Architecture

**Frontend** (`vitest` + `@testing-library/react` + `jsdom`):
- Tests run in a simulated browser environment (jsdom)
- API calls are mocked (global `fetch` or `vi.mock`)
- Canvas is mocked for defaultImages tests
- Context providers are wrapped around components for integration-style testing

**Backend** (`vitest` + `supertest` + `mongodb-memory-server`):
- Tests use an in-memory MongoDB instance (no external DB needed)
- Each test starts with a clean database
- Controller unit tests mock Express req/res objects
- Integration tests use supertest to make real HTTP requests
- Security tests validate Helmet headers, rate limiting, NoSQL sanitization, and input size limits

**E2E** (`@playwright/test`):
- Tests run against the actual running application
- Chromium browser automation
- Screenshots on failure, trace on retry

---

## Docker Deployment

### Architecture

```
docker-compose.yml
├── mongodb (mongo:7) — persisted data volume
├── backend (node:20-alpine, tsx runner)
└── nginx (multi-stage: React build → nginx:alpine)
    ├── serves static frontend (dist/)
    ├── reverse proxies /api/* to backend
    ├── reverse proxies /uploads/* to backend
    └── SSL termination with Let's Encrypt
```

### Deploy

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with production values

# 2. Set up SSL certificates (first time)
docker run -it --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly \
  -d lhccpdf.lakshmihealthcarecentrerockfort.com

# 3. Build and start
docker compose up -d --build
```

### Production nginx Configuration

- **HTTP** (port 80): Redirects all traffic to HTTPS
- **HTTPS** (port 443):
  - SSL via Let's Encrypt certificates
  - Gzip compression for text assets
  - `/api/*` proxied to backend container
  - `/uploads/*` proxied to backend container
  - `/*` serves React SPA with fallback to `index.html`

---

## Security Features

| Feature | Implementation |
|---|---|
| **JWT Authentication** | 7-day expiry, Bearer token on all protected routes |
| **Password Hashing** | bcrypt with 12 salt rounds |
| **Helmet Headers** | XSS, content-type sniffing, frame options, DNS prefetch, etc. |
| **CORS** | Restricted to `CLIENT_ORIGIN` env var |
| **Rate Limiting** | Global 200/15min, Auth 20/15min |
| **NoSQL Injection** | `express-mongo-sanitize` strips `$` and `.` from input |
| **Input Validation** | express-validator on all POST/PUT routes |
| **File Upload** | Multer: 2MB limit, images only (MIME type filter) |
| **Body Size Limit** | 5MB via `express.json({ limit: '5mb' })` |
| **Env Validation** | Server crashes at startup if any required env var is missing |
| **Secrets** | `.env*` in `.gitignore`, JWT secret is a 64-byte hex string |
| **Soft Delete** | Drafts are soft-deleted, permanently purged after 30 days |

---

## Troubleshooting

### Server fails to start

```
Missing required environment variable: MONGODB_URI
```
→ Ensure `.env` file exists with all required variables at the project root.

### MongoDB connection refused

```
MongoDB connection error: MongooseError: connect ECONNREFUSED ::1:27017
```
→ Start MongoDB: `mongod` or `docker run -d -p 27017:27017 mongo:7`

### Email sending fails

```
Failed to send email
```
→ Verify `EMAIL_USER` and `EMAIL_PASS` (use a Gmail app password, not your regular password).  
→ For Gmail: enable 2FA, generate app password at https://myaccount.google.com/apppasswords.

### File upload fails

```
File too large (max 2MB)
```
→ Ensure uploaded images are under 2MB. Only JPEG, PNG, GIF, WebP are allowed.

### CORS errors in browser

```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```
→ Set `CLIENT_ORIGIN=http://localhost:3000` in `.env` and restart the backend.

### Tests fail with MongoDB

```
MongoMemoryServer: Failed to start MongoDB instance
```
→ Ensure you have a C++ build toolchain installed (required by mongodb-memory-server):
  ```bash
  # Windows: Install Visual Studio Build Tools
  # macOS: xcode-select --install
  # Linux: sudo apt install build-essential
  ```

### TypeScript compilation errors on server files

The lint script (`npm run lint`) only checks frontend files. To check server files:
```bash
cd server && npx tsc --noEmit
```
