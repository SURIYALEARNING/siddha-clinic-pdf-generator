# Siddha Clinic PDF Generator — Production Readiness Documentation

## Project Overview

Full-stack clinic management & PDF document generator for Lakshmi Health Care Centre Rockfort.  
**Frontend:** React 19 + Vite 6 + TypeScript + Tailwind CSS 4  
**Backend:** Express 4 + Mongoose 8 + TypeScript  
**Database:** MongoDB  
**PDF:** jspdf + jspdf-autotable

---

## What Has Been Built

### Authentication System (`server/routes/auth.ts`)
- **POST** `/api/auth/register` — register new user, sends OTP to admin email  
- **POST** `/api/auth/verify-registration-otp` — verify OTP & complete registration  
- **POST** `/api/auth/login` — login with email/password, returns JWT  
- **POST** `/api/auth/forgot-password` — send password reset OTP  
- **POST** `/api/auth/reset-password` — verify OTP & reset password  
- **GET** `/api/auth/me` — get current user from token  

### Doctor Management (`server/routes/doctor.ts`)
- **GET** `/api/doctors` — list all doctors  
- **POST** `/api/doctors` — create doctor (name, qualification, signature image, seal image)  
- **PUT** `/api/doctors/:id` — update doctor  
- **DELETE** `/api/doctors/:id` — delete doctor  

All doctor routes use **multer** middleware for image upload (2MB limit, images only).  
Uploads stored in `server/uploads/doctors/` and served via `/uploads/doctors/`.

### Draft / Patient Record Management (`server/routes/draft.ts`)
- **GET** `/api/drafts` — list all drafts for authenticated user  
- **POST** `/api/drafts` — save draft (create or update by `draftId`)  
- **DELETE** `/api/drafts/:id` — delete draft  

Drafts include patient demographics + medicine formulations, stored per-user.

### Data Flow
1. **PatientFormPage** → fills patient info → calls `saveCurrentDraft()` → saves to MongoDB + local state  
2. **MedicineEntryPage** → adds medicines → calls `saveCurrentDraft()` → saves to MongoDB + local state  
3. **DashboardPage** → loads drafts from API on mount, displays with Load/Delete actions  
4. **SettingsPage** → manages doctors: add/remove via API with multer image upload, select doctor for signature  
5. **PreviewPage** → generates 4 PDF types (Annexure-1, Cash Bill, Treatment Bill, Certificate)  

---

## Files Modified/Created

### Backend — New Files
| File | Purpose |
|------|---------|
| `server/models/Doctor.ts` | Mongoose schema: name, qualification, signature, seal, timestamps |
| `server/controllers/doctorController.ts` | CRUD with multer file handling |
| `server/routes/doctor.ts` | Express router with auth + multer |
| `server/middleware/upload.ts` | Multer config: disk storage, 2MB limit, image-only filter |
| `server/models/Draft.ts` | Mongoose schema: userId, patientInfo, medicines, timestamps |
| `server/controllers/draftController.ts` | Get/save/delete drafts per user |
| `server/routes/draft.ts` | Express router with auth |
| `server/middleware/validate.ts` | express-validator rules for all routes + error handler |

### Backend — Modified Files
| File | Changes |
|------|---------|
| `server/server.ts` | Added `helmet`, `express-rate-limit` (global 200/15min, auth 20/15min), `express-mongo-sanitize`, `trust proxy`, CORS restricted to `CLIENT_ORIGIN`, `express.json` 5MB limit |
| `server/middleware/auth.ts` | Removed fallback JWT secret (now validated at startup) |
| `server/controllers/authController.ts` | Removed fallback JWT secret |
| `server/utils/email.ts` | Added try/catch around `sendMail` with error logging |
| `server/controllers/doctorController.ts` | Uses `X-Forwarded-Proto` for URL generation; removed redundant name validation |
| `server/routes/auth.ts` | Added validation middleware to all POST routes |
| `server/routes/doctor.ts` | Added validation middleware (name required, MongoDB ID params) |
| `server/routes/draft.ts` | Added validation middleware (patientInfo object, medicines array, MongoDB ID params) |

### Frontend — Modified Files
| File | Changes |
|------|---------|
| `src/services/api.ts` | Added `requestFormData()` helper; doctor create/update use FormData; added draft API methods |
| `src/context/ClinicContext.tsx` | Async `saveCurrentDraft()` (calls API); async `deleteDraft()`; fetch doctors + drafts from API on mount; `urlToBase64()` helper; removed `lhcc_saved_drafts` localStorage persistence |
| `src/pages/SettingsPage.tsx` | Doctor add/remove use API; file uploads directly via `File` objects; `useEffect` syncs `formSettings` with context |
| `src/pages/PatientFormPage.tsx` | `handleNextStep` is async, `await saveCurrentDraft()` |
| `src/pages/MedicineEntryPage.tsx` | `handleNextStep` is async, `await saveCurrentDraft()` |
| `src/components/Header.tsx` | `handleSaveDraft`/`handleGenerate` are async |
| `src/pages/DashboardPage.tsx` | Shows "Saved to cloud" stat, added `loadingDrafts` |
| `src/services/pdfHelpers.ts` | Cleaned up formatting |

---

## Production Readiness Checklist

### ✅ Security
- JWT authentication on all API routes (doctors, drafts)  
- Passwords hashed with bcrypt (12 rounds)  
- Env vars validated at startup (fail fast if missing)  
- **Helmet** — security headers (XSS, content-type sniffing, etc.)  
- **CORS** restricted to `CLIENT_ORIGIN` (default `http://localhost:3000`)  
- **Rate limiting** — 200 requests/15min global, 20 requests/15min for auth routes  
- **express-mongo-sanitize** — prevents NoSQL injection  
- **express-validator** — validates all request bodies (email format, password length, MongoDB IDs, required fields)  
- Multer file filter restricts to images only (2MB limit)  
- Request body size limited to 5MB  
- `.env*` in `.gitignore` (secrets not committed)  
- `server/uploads/` in `.gitignore` (user uploads not committed)  

### ✅ Error Handling
- All controllers wrapped in try/catch with JSON error responses  
- Global 404 handler for unknown routes  
- Global error handler catches multer errors (file size, invalid type) and unexpected errors  
- Email sending has try/catch with logging  
- Frontend API layer returns `{ data?, error? }` consistently  

### ✅ Data Persistence
- Drafts stored in MongoDB per user (userId reference)  
- Doctors stored in MongoDB with image URLs  
- Active form state cached in localStorage (survives refresh)  
- Clinic settings in localStorage (no backend yet)  
- LocalStorage drafts kept as offline fallback (no longer primary persistence)  

### ⚠️ Not Yet Production (Known Gaps)

| Issue | Impact | Recommendation |
|-------|--------|---------------|
| **No HTTPS** | Credentials sent in plaintext | Add TLS/SSL termination (nginx/caddy/reverse proxy) |
| **Email via Gmail SMTP** | Gmail may block or require app password | Use a transactional email service (SendGrid, Resend, etc.) |
| **Doctor images not deleted on doctor removal** | Orphaned files on disk | Add file cleanup logic in `deleteDoctor` |
| **No logging framework** | Console only | Add structured logging (winston/pino) |

### ✅ Verified
- Frontend TypeScript — compiles with zero errors  
- Backend TypeScript — compiles with zero errors  
- All code reviewed for unnecessary localStorage (removed draft persistence)  
- All async operations have error handling  

---

## How to Run

```bash
# 1. Start MongoDB
mongod

# 2. Install dependencies
cd server && npm install
cd .. && npm install

# 3. Configure .env (copy from .env.example)
MONGODB_URI=mongodb://localhost:27017/lhccpdf
JWT_SECRET=your-secret-key
PORT=4000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@example.com
VITE_API_URL=http://localhost:4000/api

# 4. Run both frontend + backend
npm run dev:all

# Or separately:
npm run dev          # Frontend (port 3000)
npm run dev:server   # Backend (port 4000)
```

---

## Env Variables Required

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Backend port (default 4000) |
| `EMAIL_USER` | Gmail address for sending OTPs |
| `EMAIL_PASS` | Gmail app password |
| `ADMIN_EMAIL` | Admin email to receive registration OTPs |
| `VITE_API_URL` | Backend URL for frontend (default `http://localhost:4000/api`) |
| `CLIENT_ORIGIN` | Allowed CORS origin (default `http://localhost:3000`) |
