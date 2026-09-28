# Vernika - Multi-User Business Management System

A professional multi-user desktop application built with **Python** and **Flet**, featuring Admin and Employee roles with secure authentication and database management.

## 🏗️ Architecture

```
Vernika/
├── database/              # Database layer
│   ├── connection.py       # Database connection management
│   ├── models.py           # SQLAlchemy models
│   ├── operations.py       # CRUD operations
│   ├── repositories.py     # Data repositories
│   └── session_manager.py  # Session management
├── auth/                  # Authentication
│   ├── login.py           # Login logic
│   ├── session.py         # Session management
│   ├── role_check.py      # Role-based access control
│   └── models.py          # Auth models
├── screens/               # Application screens
│   ├── login_screen.py    # Login window
│   ├── admin_screen.py    # Admin dashboard
│   ├── employee_screen.py # Employee dashboard
│   ├── employees_screen.py
│   ├── departments_screen.py
│   ├── positions_screen.py
│   ├── chat_screen.py     # Chat functionality
│   ├── leaves_screen.py   # Leave management
│   ├── attendance_screen.py
│   ├── projects_screen.py
│   ├── tasks_screen.py
│   ├── teams_screen.py
│   ├── inventory_screen.py
│   ├── transactions_screen.py
│   ├── crm_screen.py       # CRM Dashboard
│   ├── mail_screen.py
│   └── ...                # Many more screens
├── utils/                 # Utility functions
│   ├── notification_manager.py
│   ├── helpers.py
│   └── ...
├── core/                  # Core functionality
│   ├── navigation.py
│   ├── theme.py
│   └── ...
├── components/            # Reusable UI components
├── scripts/               # Database/utility scripts
├── assets/                # Static assets
├── config.py              # Configuration
├── main.py                # Entry point
└── requirements.txt       # Dependencies
```

## ✨ Features

### Authentication
- 🔐 Secure multi-user login
- 🔑 Password hashing with bcrypt
- 📝 Session management
- 📊 Audit logging

### User Roles
- **Admin**: Full access to users, employees, settings, and audit logs
- **Employee**: Limited access to personal profile and tasks

### Core Modules
- 👥 Employee Management
- 📅 Attendance Tracking
- 📝 Leave Management
- 💬 Real-time Chat
- 📊 Project Management
- 📦 Inventory Management
- 📧 Email Integration
- 📈 Reports & Analytics
- 🤝 CRM (Leads, Contacts, Calendar, Vendors, Warehouses, Assets, Contracts, Invoices)

### Database
- 🗄️ Supabase (PostgreSQL) with RLS
- 📋 User management
- 👥 Employee profiles
- 📜 Audit trail

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd Vernika
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   - Copy `env_template_complete.txt` to `.env`
   - Fill in your Supabase credentials

4. **Run the application**
   ```bash
   python main.py
   ```

## 📦 Dependencies

- **flet**: Desktop UI framework
- **sqlalchemy**: ORM for database
- **bcrypt**: Password hashing
- **python-jose**: JWT token handling
- **python-dotenv**: Environment variables
- **supabase**: Database client
- **pandas**: Data processing
- **openpyxl**: Excel export

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control (RBAC)
- Row Level Security (RLS) in Supabase
- Audit logging for all actions
- SQL injection prevention via SQLAlchemy

## 📝 Project Structure

- `auth/` - Authentication and authorization
- `database/` - Database models and operations
- `screens/` - All application screens (30+ screens)
- `components/` - Reusable UI components
- `core/` - Core application logic
- `utils/` - Utility functions
- `scripts/` - Database setup and maintenance scripts
- `assets/` - Static assets (logos, images)
- `supabase/` - Database migrations

## 🐛 Troubleshooting

### Database Errors
Check your Supabase credentials in `.env`

### Import Errors
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Port Already in Use
Flet uses port 8000 by default. No configuration needed as it auto-assigns.

## 🔄 Real-Time Sync and Production Security

The React/Vite client now uses Firestore `onSnapshot` listeners as the primary transport for employees, AUX activity, attendance, punch requests, claims, chat, mail, notifications, meetings, documents, shared files, and other workspace collections. Firestore persistence is enabled when the browser supports durable multi-tab caching, with a safe memory-cache fallback and a low-frequency recovery poll for temporarily interrupted listeners.

Production access must use Firebase Authentication. The included Firestore rules no longer allow anonymous public reads or writes. Provision each administrator in `admins/{firebaseAuthUid}` or assign the Firebase Auth custom claim `{admin: true}` before deploying the rules. Employee self-service writes are limited to records owned by the authenticated Firebase UID, while administrative collections require administrator authorization. Client-side role values are not trusted by the rules.

The legacy demo login remains suitable for local UI demonstrations, but it is not a production identity provider and cannot provide secure cross-device authorization by itself. For multi-user deployment, use the Google sign-in flow or connect the login screen to provisioned Firebase Auth email/password accounts.

## 📄 License

This project is open source and available for personal and commercial use.

---

Built with ❤️ using Python and Flet



## Production authentication and real-time synchronization

The application now treats Firebase Authentication as the source of identity. The login role selector is only a requested portal; it is not an authority. A login succeeds only when Firebase Authentication accepts the credentials and the server-backed profile or Firebase custom claim authorizes the requested role.

Provision each employee as a Firebase Authentication email/password user. The email can be the employee's real email or the legacy username mapped to `@vernika.io` by the login form. Provision administrators with either the Firebase Auth custom claim `{ "admin": true }` or an `admins/{firebaseAuthUid}` Firestore document. Do not rely on `localStorage`, URL parameters, client-side role flags, or the legacy demo credential table for production authorization.

Every authenticated session attaches Firestore listeners after Firebase Auth is ready. The listeners cover employee profiles, departments, positions, attendance, leaves, AUX logs, projects, tasks, CRM, invoices, chat, mail, meetings, calendar events, payroll, expenses, announcements, notifications, employee documents, files, inventory, OKRs, activity logs, and audit logs. Firestore is the cross-device source of truth; BroadcastChannel is only an immediate same-browser optimization.

Deploy `firestore.rules` together with the client. If the rules are not deployed, writes may appear optimistically in one browser but will not be authorized consistently across devices. Verify two separate Firebase Auth accounts in two browser profiles before production release: create a chat message, send mail, change AUX, submit and approve leave, update a claim, assign a task, and modify an employee permission. The second account should receive the corresponding Firestore snapshot and notification popup without a page refresh.

The client intentionally skips Firestore writes when there is no authenticated Firebase user. This prevents stale legacy browser sessions from masquerading as real synchronized users.
