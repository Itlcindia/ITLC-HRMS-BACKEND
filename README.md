# Enterprise Multi-Tenant HRMS & CRM Backend API Server 🚀

A production-grade, enterprise-ready REST API backend built with **Node.js**, **Express.js**, **Sequelize ORM**, and **MySQL**, featuring multi-tenant database isolation, role-based access control (RBAC), biometric/GPS geofenced attendance, automated payroll calculation, payment gateways (Razorpay, Stripe, UPI), automated SMTP notifications, and scheduled background jobs.

---

## 🌟 Key Features

- 🏢 **Multi-Tenant Architecture**: Complete tenant isolation for organizations with individual settings, payroll structures, and data partitioning.
- 🔐 **Role-Based Access Control (RBAC)**:
  - **Super Owner**: Platform master dashboard, subscription management, tenant billing, global system settings.
  - **Company Admin**: Full organization control, departments, designations, branches, payroll rules, employee management.
  - **Manager**: Team oversight, attendance regularization, leave approvals, performance evaluations.
  - **Employee**: Self-service portal, GPS/biometric check-in, leave applications, expense claims, payslip downloads.
- 📍 **GPS & Geofencing Attendance**: Radius-based check-in validation with location verification.
- 💰 **Automated Payroll Engine**: Basic, HRA, PF, ESI, TDS, Professional Tax, Overtime, Gratuity, and Leave Encashment computation with payslip generation.
- 💳 **Integrated Payment Gateways**:
  - **Razorpay**: Order creation, signature verification, and dynamic plan upgrade webhooks.
  - **Stripe**: Checkout session creation and payment intents.
  - **UPI QR**: Instant QR payment verification.
- 📧 **Automated Email Notifications**: SMTP-powered welcome emails with auto-generated credentials, OTP logins, and birthday wishes.
- ⏱️ **Background Schedulers**: Automated daily birthday alerts and subscription expiry checks.
- 🐳 **Docker & Production Ready**: Pre-configured `Dockerfile` and `docker-compose.yml` for zero-downtime deployment.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database & ORM**: MySQL with Sequelize ORM
- **Security & Authentication**: JSON Web Tokens (JWT), Bcrypt.js, CORS
- **Payments**: Razorpay SDK, Stripe SDK
- **Communication**: Nodemailer (SMTP)
- **Containerization**: Docker, Docker Compose

---

## 📁 Repository Structure

```
HRMS-BACKEND/
├── config/
│   └── db.js                 # MySQL Sequelize connection setup
├── middleware/
│   └── auth.js               # JWT & Role authentication middleware
├── models/
│   ├── ActiveSession.js      # User session tracking
│   ├── ActivityLog.js        # Audit trail logs
│   ├── Announcement.js       # Organization announcements
│   ├── ApiToken.js           # API token management
│   ├── Asset.js              # Hardware & inventory assets
│   ├── Attendance.js         # Daily attendance with GPS
│   ├── Branch.js             # Company branches
│   ├── Candidate.js          # Recruitment candidates
│   ├── Company.js            # Tenant company schema
│   ├── CorrectionRequest.js  # Attendance regularization
│   ├── Coupon.js             # Subscription discount coupons
│   ├── Department.js         # Company departments
│   ├── Designation.js        # Employee designations
│   ├── Employee.js           # Employee records & credentials
│   ├── ExpenseClaim.js       # Employee reimbursement claims
│   ├── GlobalSetting.js      # Super owner system settings
│   ├── Holiday.js            # Organization holiday calendar
│   ├── Integration.js        # Third-party integrations
│   ├── Interview.js          # Recruitment interview rounds
│   ├── JobOpening.js         # Job postings & careers
│   ├── LeavePolicy.js        # Company leave quotas
│   ├── LeaveRequest.js       # Employee leave applications
│   ├── Meeting.js            # Scheduled meetings & agendas
│   ├── NotificationHistory.js# Sent communications history
│   ├── Payment.js            # Payment & invoice transactions
│   ├── PayrollRecord.js      # Monthly salary slips & calculations
│   ├── PerformanceReview.js  # Quarterly & annual appraisals
│   ├── SalaryComponent.js    # Custom salary heads
│   ├── SecuritySetting.js    # 2FA & password security rules
│   ├── SubscriptionPlan.js   # SaaS subscription tiers
│   ├── SupportTicket.js      # Internal helpdesk tickets
│   ├── Task.js               # Project & task tracking
│   ├── TrainingProgram.js    # Employee training modules
│   └── Webhook.js            # Webhook triggers
├── routes/
│   ├── admin.js              # Company Admin management endpoints
│   ├── auth.js               # Authentication, Registration & OTP
│   ├── employee.js           # Employee Self-Service endpoints
│   ├── manager.js            # Manager team management endpoints
│   ├── payment.js            # Razorpay, Stripe & UPI billing
│   └── superowner.js         # Super Owner platform administration
├── utils/
│   ├── birthdayScheduler.js  # Automated daily birthday wishes
│   ├── emailService.js       # Nodemailer email dispatch templates
│   └── subscriptionScheduler.js # Subscription expiration cron
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── Dockerfile                # Production Docker container definition
├── docker-compose.yml        # Multi-container orchestration (App + MySQL)
├── package.json              # Project dependencies & scripts
├── README.md                 # Project documentation
└── server.js                 # API Server bootstrap & database sync
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MySQL Database Server** (v8.0 or higher)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/mrity222-ai/HRMS-BACKEND.git
cd HRMS-BACKEND
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=hrms_db

# JWT Secret
JWT_SECRET=your_jwt_secret_key_2026

# Razorpay & Stripe
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=sk_test_xxxxxx
REAL_UPI_ID=your_upi_id@upi

# SMTP Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=your_smtp_password
SMTP_FROM="Enterprise HRMS" <no-reply@yourdomain.com>
```

### 5. Start the Server
- **Development Mode (with auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

The server will automatically synchronize all MySQL tables, alter required columns, seed default subscription tiers, and start background schedulers!

---

## 🐳 Docker Deployment

To launch the full backend along with a MySQL database in isolated containers:

```bash
docker-compose up -d --build
```

- API Server runs at: `http://localhost:5000`
- MySQL Server runs at: `localhost:3306`

To view logs:
```bash
docker-compose logs -f hrms-api
```

To stop containers:
```bash
docker-compose down
```

---

## 📡 API Endpoint Overview

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/check-superowner` | Checks if first Super Owner setup is required |
| `POST` | `/api/auth/register-superowner`| Registers initial platform Super Owner |
| `POST` | `/api/auth/register-company` | Public organization registration |
| `POST` | `/api/auth/login` | Authenticates user & dispatches OTP |
| `POST` | `/api/auth/verify-otp` | Validates 6-digit OTP & issues JWT Token |

### 2. Super Owner (`/api/superowner`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/superowner/companies` | List all tenant organizations |
| `POST` | `/api/superowner/companies/:id/status` | Activate, Suspend, or Expire tenant |
| `GET` | `/api/superowner/plans` | Fetch subscription plans |
| `POST` | `/api/superowner/plans` | Create or update subscription tier |
| `GET` | `/api/superowner/global-settings` | Retrieve payment gateway & system settings |
| `PUT` | `/api/superowner/global-settings` | Update Razorpay, Stripe, and SMTP settings |
| `GET` | `/api/superowner/analytics` | Revenue, tenant growth, and active metrics |

### 3. Company Admin (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/employees` | List organization employees |
| `POST` | `/api/admin/employees` | Onboard new employee with auto-generated ID |
| `PUT` | `/api/admin/employees/:id` | Update employee profile & role |
| `DELETE`| `/api/admin/employees/:id` | Offboard/Delete employee record |
| `GET` | `/api/admin/departments` | Manage departments & hierarchy |
| `GET` | `/api/admin/branches` | Manage office branches & geofencing |
| `GET` | `/api/admin/attendance` | Organization-wide daily attendance logs |
| `POST` | `/api/admin/payroll/calculate` | Generate monthly payroll with deductions & tax |
| `GET` | `/api/admin/leaves` | Review and approve/reject leave requests |
| `GET` | `/api/admin/assets` | Hardware asset assignment & tracking |

### 4. Employee Self-Service (`/api/employee`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employee/profile` | Current employee profile information |
| `POST` | `/api/employee/attendance/punch`| Biometric & GPS check-in / check-out |
| `GET` | `/api/employee/attendance/history`| Attendance history with monthly summary |
| `POST` | `/api/employee/leaves` | Apply for leave |
| `GET` | `/api/employee/payslips` | View and download monthly payslips |
| `POST` | `/api/employee/expenses` | Submit expense reimbursement claim |
| `POST` | `/api/employee/support-tickets` | Submit IT / HR support ticket |

### 5. Payment Gateway (`/api/payment`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payment/razorpay/order` | Create Razorpay order for plan subscription |
| `POST` | `/api/payment/razorpay/verify`| Verify payment signature & upgrade tenant |
| `POST` | `/api/payment/stripe/session` | Create Stripe checkout session |
| `GET` | `/api/payment/invoices` | Retrieve tenant billing history |

---

## 🔒 Security Best Practices

1. Always set a strong, random `JWT_SECRET` in production.
2. Keep MySQL port `3306` protected behind firewall / private VPC network.
3. Configure HTTPS with SSL/TLS reverse proxy (Nginx or Caddy) in production.
4. Keep Razorpay and Stripe webhook secret keys stored safely in `.env`.

---

## 📄 License

This software is licensed under the proprietary enterprise license. Unauthorized copying or redistribution is strictly prohibited.
