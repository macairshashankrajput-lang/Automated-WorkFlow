# Automated Workflow Studio & Unified Multi-Application Platform

> **Comprehensive Enterprise Operations, PG Property Management, Food Delivery Suite, and Visual Workflow Synthesizer.**

Welcome to the **Automated Workflow Studio** repository. This workspace unites 4 full-scale enterprise production applications and 1 master visual workflow builder platform under a unified hybrid database architecture (Supabase PostgreSQL + Firebase Firestore + Google Drive / Sheets Sync).

---

## 📁 Repository Directory Structure

```text
/
├── Automated-Workflow-Application/       # Master Workflow Studio (Overview, Builder, Copilot AI, Portfolio)
├── Vernika-app-main/                     # Vernika Enterprise Business Suite (16 Active ERP/HR Modules)
├── GoldenPrime-Stay-app-main/            # GoldenPrime PG Operations App (8 Property/Tenant Modules)
├── chaknastore-FoodDeliveryapp-main/     # ChaknaStore Food Delivery App (7 Vendor/Cart Modules)
├── vernika-website-main/                 # Vernika Corporate Portal & Lead Intake (5 Web Modules)
├── src/                                  # Shared Application Runner, Hybrid Database Engine & Components
├── package.json                          # Main Workspace Build & Dependencies Config
└── vite.config.ts                        # Master Vite Bundler & Server Config
```

---

## 🚀 The 5 Integrated Applications

### 1. ⚡ Master Automated Workflow Studio (`/Automated-Workflow-Application`)
* **Purpose**: Visual App & Workflow Composer with real-time schema synthesis and live execution simulation.
* **Key Features**:
  * **Visual Canvas Composer**: Drag & drop or select from 36 active modules across all apps.
  * **Schema Synthesizer**: Generates Supabase PostgreSQL DDL, Firebase Firestore Security Rules, and Google Sheets column matrices.
  * **Vernika Copilot AI**: Interactive AI assistant for cross-app telemetry, financial audits, and database query generation.
  * **Saved Blueprints Manager**: Full CRUD (Create, Preview, Edit, Delete, Toggle Active/Paused/Draft).
  * **Live Execution Console**: Step-by-step terminal execution simulator for testing pipeline triggers.

---

### 2. 🏢 Vernika Enterprise Business Suite (`/Vernika-app-main`)
* **Purpose**: Full-suite enterprise ERP & HR management matrix.
* **16 Active Modules**:
  1. **Vernika Sheets**: Collaborative formula engine (`=SUM`, `=A1+B1`, Excel export).
  2. **HR Employee Roster**: Staff profiles, active status, and module permission grants.
  3. **Attendance Tracker**: Shift clock-in/out, GPS/location logs, and punch correction requests.
  4. **Leave Management**: Casual/sick leave applications and manager approvals.
  5. **CRM Lead Pipeline**: Lead stages (New, Contacted, Proposal, Won) and customer contacts.
  6. **Tax Invoicing**: Invoice generator, tax calculations, and 3-way PO verification.
  7. **Payroll & Disbursements**: Monthly salary calculations, deductions, and direct receipts.
  8. **Expense Claims**: Employee expense submissions and manager reimbursement approvals.
  9. **Financial Rollup & Analytics**: Labor cost rollup and budget variance warnings.
  10. **Kanban Task Board**: Task status updates (To Do, In Progress, Done) and priorities.
  11. **Virtual Video Calls**: Meeting scheduler, participant state tracking, and call logs.
  12. **Team Messenger**: Chat channels, direct messages, and pinned announcements.
  13. **Outlook Mail System**: Inbox, folders (Sent, Drafts, Trash), starring, and rich composer.
  14. **Org Hierarchy Chart**: Department structures and executive reporting trees.
  15. **Vernika Copilot AI**: Cross-app assistant for financial audits and database queries.
  16. **Immutable Audit Log**: Security event records, IP tracking, and system timestamps.

---

### 3. 🏠 GoldenPrime PG Operations App (`/GoldenPrime-Stay-app-main`)
* **Purpose**: Mobile-first PG property management and tenant billing operations.
* **8 Active Modules**:
  1. **Buildings & Floor Wizard**: Property management, floor counts, and room inventories.
  2. **Room & Bed Billing**: Per-bed billing, fixed pricing, and occupancy status.
  3. **Tenant Directory & KYC**: Tenant profiles, contact details, and Aadhaar ID upload.
  4. **Rent Ledger**: Cash/UPI rent receipt recorder, partial payment tracking, and overdue alerts.
  5. **WhatsApp Reminder Composer**: Pre-filled WhatsApp payment alerts with UPI links.
  6. **Expense Reconciliation**: Electricity, water, internet bills, and net profit tracking.
  7. **Payment QR & Bank Settings**: VPA configuration, payment QR upload, and bank details.
  8. **Ledger Workbook Exporter**: One-click full PG ledger export to Excel (`.xlsx`).

---

### 4. 🍕 ChaknaStore Food Delivery & Tiffin App (`/chaknastore-FoodDeliveryapp-main`)
* **Purpose**: Multi-vendor food directory, daily tiffin subscriptions, and catering delivery.
* **7 Active Modules**:
  1. **Multi-Vendor Food Directory**: Dish catalog, ratings, prices, and food search.
  2. **Shopping Cart**: Interactive cart with quantity adjustments (`+/-`) and checkout.
  3. **Promo Discount Engine**: Coupon evaluation (e.g. `CHAKNA20` for 20% off) and calculations.
  4. **Daily & Weekly Tiffin Subscriptions**: Veg/non-veg tiffin plans and delivery schedules.
  5. **Catering Requests**: Event catering inquiries, guest count estimators, and quotes.
  6. **Vendor Fulfillment Machine**: Order state transitions (`Placed` -> `Preparing` -> `Out for Delivery` -> `Delivered`).
  7. **Live Order Tracker**: Real-time status updates and order history.

---

### 5. 🌐 Vernika Corporate Website & Lead Portal (`/vernika-website-main`)
* **Purpose**: Public-facing corporate landing page, product walkthroughs, and lead intake.
* **5 Active Modules**:
  1. **Brand Hero**: Value propositions, digital transformation teasers, and CTA buttons.
  2. **Product Walkthrough**: Interactive tabbed showcase of all suite applications.
  3. **Case Studies & ROI Estimator**: Client success benchmarks and ROI calculators.
  4. **Consultation Booking Form**: Inquiry intake form with spreadsheet backup.
  5. **Admin Lead Board**: Inbound lead management board with status toggles (`New`, `Booked`, `Closed`).

---

## 🗄️ Hybrid Database Architecture

The entire platform utilizes `hybridDB` (`/src/services/hybridDatabase.ts`), combining 3 storage tiers:
1. **Supabase PostgreSQL**: Relational tables (`hybrid_app_records`) with real-time subscriptions and SQL DDL synthesis.
2. **Firebase Firestore**: Document store (`automated-workflow-shashank`) with real-time state synchronization.
3. **Google Drive & Sheets**: Automated spreadsheet row logging and `.xlsx` workbook generation.

---

## 🛠️ Vercel Standalone Deployment Guide

Each application folder in this repository includes a dedicated `vercel.json` and build scripts, allowing deployment as **independent standalone projects** on Vercel:

| Application Folder | Vercel Root Directory | Build Command | Output Directory |
| :--- | :--- | :--- | :--- |
| **Root (Master Studio)** | `/` | `npm run build` | `dist` |
| **Vernika Suite** | `/Vernika-app-main` | `npm run build` | `dist` |
| **GoldenPrime PG** | `/GoldenPrime-Stay-app-main` | `npm run vercel:build` | `dist/public` |
| **ChaknaStore Food** | `/chaknastore-FoodDeliveryapp-main` | `npx expo export -p web` | `dist` |
| **Vernika Website** | `/vernika-website-main` | `npm run vercel:build` | `dist/public` |

---

## 🔐 Default Access Credentials

- **Admin Login**:
  - **Username**: `rajputsg`
  - **Password**: `143#MaaPaa`
- **Portfolio Guest Visitor**:
  - **Username**: `portfolio`
  - **Password**: `password123`
