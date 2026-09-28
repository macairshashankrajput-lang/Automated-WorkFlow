# Vernika 2.0 Multi-User Enterprise Suite

## Overview
Vernika 2.0 is an enterprise workplace management platform built with React, TypeScript, Tailwind CSS, and Google Firebase Firestore. It provides role-dedicated, isolated environments for Administrators, Employees, and External Clients with live AUX telemetry, project tracking, real-time messaging, and financial management.

---

## 🚀 How to Run the Application

### 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: `npm` (v9+) or `bun` / `pnpm`

### 2. Installation
Install project dependencies:
```bash
npm install
```

### 3. Running in Development Mode
Start the local development server:
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 4. Building for Production
To generate an optimized production build:
```bash
npm run build
```
This outputs production assets to the `dist/` folder.

### 5. Running Production Preview
To preview the production build locally:
```bash
npm run preview
```

---

## 🔐 Multi-User Authentication & Roles

Vernika implements Role-Based Access Control (RBAC) with complete workspace isolation:

| Role | Username | Default Password | Dedicated Portal & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `shashank` | `password123` | System control, user permission CRUD, live multi-user AUX telemetry & adherence oversight, organization configuration, full financial suites. |
| **Employee** | `priya` / `liam` | `password123` | Personal Employee Window, individual AUX state bar, punch clock, assigned task Kanban, personal payslips, leave requests, and team messenger. |
| **Client** | `client_apex` | `password123` | Dedicated Client Portal, project milestones, deliverables approvals, billing invoices, and support channels. |

*Google Authentication is also supported via Firebase Auth.*

---

## 🗄️ Database & Cloud Persistence
- **Database Engine**: Google Cloud Firestore
- **Security Rules**: Deployed in `firestore.rules` enforcing role boundaries, data validation, and preventing unauthorized cross-user data leakage.
- **Local Fallback**: Instant offline/cache synchronization with `localStorage` guarantees uninterrupted workflows.
