/**
 * ITLC HRMS & CRM ENTERPRISE - COMPLETE SWAGGER API SPECIFICATION & DASHBOARD
 * Covers 100% of all features: Payroll, Attendance, Leaves, Tasks, Performance,
 * Assets, Meetings, Announcements, Expenses, Tickets, CRM, Payments & Super Owner.
 */

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "ITLC Enterprise HRMS & CRM Platform API",
    version: "4.0.0-ENTERPRISE-PRO",
    description: "Complete REST API Reference for ITLC HRMS & CRM. Every single feature (Payroll, Geofenced Attendance, Leaves, Appraisals, Asset Tracking, Meetings, Announcements, Expense Claims, Tickets, CRM Pipeline, and Razorpay Payments) is interactive and testable.",
    contact: {
      name: "ITLC Enterprise Support",
      email: "support@itlc.com"
    }
  },
  servers: [
    { url: "/api", description: "Current Host API Base" },
    { url: "http://localhost:5000/api", description: "Local Development Server" }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer JWT Token generated from `/api/auth/login`"
      }
    }
  },
  tags: [
    { name: "1. System & Health", description: "Server status, diagnostics and audit logs" },
    { name: "2. Authentication", description: "User login, tenant registration, password reset and profile management" },
    { name: "3. Payroll & Payslips", description: "Salary generation, payslips, disbursement batches and employee compensation" },
    { name: "4. Attendance & Timesheets", description: "Geo-verified punch in/out, shift tracking, logs and punch correction requests" },
    { name: "5. Leaves & Holidays", description: "Leave applications, manager approval workflow, quotas and company holiday calendars" },
    { name: "6. Task Management", description: "Task delegation, progress status, deadlines and team task boards" },
    { name: "7. Performance & Appraisals", description: "KPI metrics, quarterly appraisal reviews, ratings and feedback" },
    { name: "8. Asset Management", description: "Company hardware inventory, asset allocation, decommissioning and employee requests" },
    { name: "9. Meetings & Announcements", description: "Team video schedules, meeting agendas, company news and broadcasts" },
    { name: "10. Expenses & Reimbursement", description: "Receipt uploads, travel claims, manager approval and payouts" },
    { name: "11. Support Helpdesk", description: "Internal employee tickets, platform escalation and status resolution" },
    { name: "12. CRM & Sales Pipeline", description: "Leads tracking, customer deals, quotes and commercial invoices" },
    { name: "13. Payments & Subscriptions", description: "Razorpay orders, payment signatures, SaaS upgrades and billing" },
    { name: "14. Platform Super Owner", description: "Global multi-tenant administration, plans, discount coupons and system logs" }
  ],
  paths: {
    /* ========================================================
       1. SYSTEM & HEALTH
       ======================================================== */
    "/health": {
      get: {
        tags: ["1. System & Health"],
        summary: "Check Server Status & Health",
        responses: { "200": { description: "Server is healthy and operational" } }
      }
    },
    "/swagger.json": {
      get: {
        tags: ["1. System & Health"],
        summary: "Get OpenAPI 3.0 Specification JSON",
        responses: { "200": { description: "OpenAPI 3.0 JSON specification document" } }
      }
    },
    "/audit-logs": {
      get: {
        tags: ["1. System & Health"],
        summary: "Get Platform Audit Logs",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of system security and audit events" } }
      }
    },
    "/data": {
      get: {
        tags: ["1. System & Health"],
        summary: "Get Full Multi-Tenant Database Dump",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Sanitized JSON state snapshot" } }
      }
    },
    "/upload": {
      post: {
        tags: ["1. System & Health"],
        summary: "Upload File / Document / Receipt",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", description: "Base64 data URI" },
                  fileName: { type: "string", example: "receipt.pdf" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "File uploaded successfully" } }
      }
    },

    /* ========================================================
       2. AUTHENTICATION
       ======================================================== */
    "/auth/login": {
      post: {
        tags: ["2. Authentication"],
        summary: "User Login / Token Issuance",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "itlc@gmail.com" },
                  password: { type: "string", example: "admin123" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Authentication successful with JWT token" } }
      }
    },
    "/auth/profile": {
      get: {
        tags: ["2. Authentication"],
        summary: "Get Current Logged-in Profile",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Profile returned" } }
      },
      put: {
        tags: ["2. Authentication"],
        summary: "Update Current User Profile",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Profile updated" } }
      }
    },
    "/auth/check-superowner": {
      get: {
        tags: ["2. Authentication"],
        summary: "Check Super Owner Exists",
        responses: { "200": { description: "Returns exists boolean" } }
      }
    },
    "/auth/register-company": {
      post: {
        tags: ["2. Authentication"],
        summary: "Register New Company Tenant",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  companyName: { type: "string", example: "ITLC Solutions" },
                  adminName: { type: "string", example: "Admin User" },
                  adminEmail: { type: "string", example: "itlc@gmail.com" },
                  adminPassword: { type: "string", example: "admin123" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Company created successfully" } }
      }
    },
    "/employee/change-password": {
      post: {
        tags: ["2. Authentication"],
        summary: "Change Personal Password",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  currentPassword: { type: "string", example: "emp123" },
                  newPassword: { type: "string", example: "NewEmpPass2026!" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Password updated successfully" } }
      }
    },
    "/admin/employees": {
      get: {
        tags: ["2. Authentication"],
        summary: "List All Company Staff & Employees",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of company employees" } }
      },
      post: {
        tags: ["2. Authentication"],
        summary: "Register / Onboard New Employee",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Jane Smith" },
                  email: { type: "string", example: "jane@company.com" },
                  role: { type: "string", example: "Senior Developer" },
                  department: { type: "string", example: "Engineering" },
                  salary: { type: "number", example: 75000 }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Employee added successfully" } }
      }
    },
    "/admin/employees/{id}": {
      put: {
        tags: ["2. Authentication"],
        summary: "Update Employee Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Employee updated" } }
      },
      delete: {
        tags: ["2. Authentication"],
        summary: "Deactivate Employee Record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Employee removed" } }
      }
    },
    "/manager/team": {
      get: {
        tags: ["2. Authentication"],
        summary: "List Reporting Team Members",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of reporting team members" } }
      }
    },

    /* ========================================================
       3. PAYROLL & PAYSLIPS
       ======================================================== */
    "/admin/payroll": {
      get: {
        tags: ["3. Payroll & Payslips"],
        summary: "List All Company Payroll Runs",
        description: "Returns all past and current payroll disbursement batches for the company.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "companyId", in: "query", schema: { type: "string" }, description: "Optional tenant ID" },
          { name: "employeeId", in: "query", schema: { type: "string" }, description: "Filter by employee ID" }
        ],
        responses: { "200": { description: "Array of payroll batches" } }
      },
      post: {
        tags: ["3. Payroll & Payslips"],
        summary: "Generate & Process New Payroll Batch",
        description: "Creates a new monthly or bi-weekly payroll run with employee salary breakdown.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  month: { type: "string", example: "September" },
                  year: { type: "number", example: 2026 },
                  totalDisbursed: { type: "number", example: 145000 },
                  status: { type: "string", enum: ["Paid", "Pending", "Processing"], example: "Paid" },
                  records: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        employeeId: { type: "string", example: "emp_1" },
                        employeeName: { type: "string", example: "Priyanshu Pushkar" },
                        basicSalary: { type: "number", example: 60000 },
                        allowances: { type: "number", example: 15000 },
                        deductions: { type: "number", example: 5000 },
                        netPay: { type: "number", example: 70000 },
                        paymentMethod: { type: "string", example: "Bank Transfer" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Payroll batch processed" } }
      }
    },
    "/admin/payroll/{id}": {
      put: {
        tags: ["3. Payroll & Payslips"],
        summary: "Update Payroll Batch / Payment Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "Paid" },
                  notes: { type: "string", example: "Disbursement completed" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Payroll batch updated" } }
      },
      delete: {
        tags: ["3. Payroll & Payslips"],
        summary: "Delete Payroll Record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Payroll record deleted" } }
      }
    },
    "/employee/payroll": {
      get: {
        tags: ["3. Payroll & Payslips"],
        summary: "Get Personal Employee Payslips",
        description: "Returns the authenticated employee's personal salary slips and earnings statements.",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of employee payslips" } }
      }
    },

    /* ========================================================
       4. ATTENDANCE & TIMESHEETS
       ======================================================== */
    "/admin/attendance": {
      get: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Company Staff Attendance History",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "date", in: "query", schema: { type: "string" }, description: "Date (YYYY-MM-DD)" },
          { name: "employeeId", in: "query", schema: { type: "string" } }
        ],
        responses: { "200": { description: "Attendance records returned" } }
      }
    },
    "/employee/attendance": {
      get: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Personal Attendance Log",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Personal attendance entries" } }
      }
    },
    "/employee/attendance/punch-in": {
      post: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Record Attendance Punch In",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  latitude: { type: "number", example: 28.6139 },
                  longitude: { type: "number", example: 77.2090 },
                  location: { type: "string", example: "ITLC Tech Park" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Punched in successfully" } }
      }
    },
    "/employee/attendance/punch-out": {
      post: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Record Attendance Punch Out",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Punched out successfully" } }
      }
    },
    "/manager/corrections": {
      get: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Get Attendance Correction Requests",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of correction requests" } }
      }
    },
    "/employee/corrections": {
      post: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Submit Attendance Correction Request",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  date: { type: "string", example: "2026-09-13" },
                  requestedIn: { type: "string", example: "09:00 AM" },
                  requestedOut: { type: "string", example: "06:00 PM" },
                  reason: { type: "string", example: "Biometric sensor timeout" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Correction submitted" } }
      }
    },
    "/manager/corrections/{id}": {
      put: {
        tags: ["4. Attendance & Timesheets"],
        summary: "Approve or Reject Correction Request",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["Approved", "Rejected"], example: "Approved" },
                  comment: { type: "string", example: "Verified with CCTV log" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Correction updated" } }
      }
    },

    /* ========================================================
       5. LEAVES & HOLIDAYS
       ======================================================== */
    "/admin/leaves": {
      get: {
        tags: ["5. Leaves & Holidays"],
        summary: "List All Staff Leave Applications",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "All leave applications" } }
      }
    },
    "/manager/leaves": {
      get: {
        tags: ["5. Leaves & Holidays"],
        summary: "Get Team Leave Applications for Approval",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Team leave applications" } }
      }
    },
    "/employee/leaves": {
      get: {
        tags: ["5. Leaves & Holidays"],
        summary: "Get Personal Leave Applications",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Personal leaves" } }
      },
      post: {
        tags: ["5. Leaves & Holidays"],
        summary: "Apply for Leave",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  leaveType: { type: "string", example: "Paid Leave" },
                  startDate: { type: "string", example: "2026-09-20" },
                  endDate: { type: "string", example: "2026-09-22" },
                  reason: { type: "string", example: "Annual family leave" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Leave applied successfully" } }
      }
    },
    "/admin/leaves/{id}": {
      put: {
        tags: ["5. Leaves & Holidays"],
        summary: "Approve or Reject Leave Application",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["Approved", "Rejected"], example: "Approved" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Leave status updated" } }
      },
      delete: {
        tags: ["5. Leaves & Holidays"],
        summary: "Cancel Leave Request",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Leave removed" } }
      }
    },
    "/admin/holidays": {
      get: {
        tags: ["5. Leaves & Holidays"],
        summary: "List Company Holidays Calendar",
        responses: { "200": { description: "List of public and corporate holidays" } }
      },
      post: {
        tags: ["5. Leaves & Holidays"],
        summary: "Add Company Holiday",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Diwali" },
                  date: { type: "string", example: "2026-11-08" },
                  type: { type: "string", example: "National Holiday" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Holiday added" } }
      }
    },
    "/admin/leave-policies": {
      get: {
        tags: ["5. Leaves & Holidays"],
        summary: "Get Company Leave Policy Quotas",
        responses: { "200": { description: "Leave entitlement policies" } }
      }
    },

    /* ========================================================
       6. TASK MANAGEMENT
       ======================================================== */
    "/tasks": {
      get: {
        tags: ["6. Task Management"],
        summary: "List All Tasks",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of tasks" } }
      },
      post: {
        tags: ["6. Task Management"],
        summary: "Create & Assign Task",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Deploy Client Portal" },
                  description: { type: "string", example: "Configure SSL and automated CI/CD" },
                  assignedTo: { type: "string", example: "emp@gmail.com" },
                  priority: { type: "string", enum: ["Low", "Medium", "High"], example: "High" },
                  dueDate: { type: "string", example: "2026-09-30" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Task created" } }
      }
    },
    "/manager/tasks": {
      get: {
        tags: ["6. Task Management"],
        summary: "List Team Tasks (Manager View)",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of team tasks" } }
      },
      post: {
        tags: ["6. Task Management"],
        summary: "Assign Task to Team Member",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Implement Unit Tests" },
                  assignedTo: { type: "string", example: "emp@gmail.com" },
                  priority: { type: "string", example: "High" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Task assigned" } }
      }
    },
    "/tasks/{id}": {
      put: {
        tags: ["6. Task Management"],
        summary: "Update Task Details or Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["Pending", "In Progress", "Completed"], example: "Completed" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Task updated" } }
      },
      delete: {
        tags: ["6. Task Management"],
        summary: "Delete Task",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Task deleted" } }
      }
    },

    /* ========================================================
       7. PERFORMANCE & APPRAISALS
       ======================================================== */
    "/admin/performance": {
      get: {
        tags: ["7. Performance & Appraisals"],
        summary: "List Performance Reviews & KPI Appraisals",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Appraisal records" } }
      },
      post: {
        tags: ["7. Performance & Appraisals"],
        summary: "Submit Performance Evaluation",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  employeeId: { type: "string", example: "emp_1" },
                  reviewPeriod: { type: "string", example: "Q3-2026" },
                  score: { type: "number", example: 4.8 },
                  feedback: { type: "string", example: "Exceptional architecture delivery." }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Review submitted" } }
      }
    },
    "/admin/performance/{id}": {
      put: {
        tags: ["7. Performance & Appraisals"],
        summary: "Update Performance Review",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Review updated" } }
      },
      delete: {
        tags: ["7. Performance & Appraisals"],
        summary: "Delete Appraisal Record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Review deleted" } }
      }
    },

    /* ========================================================
       8. ASSET MANAGEMENT
       ======================================================== */
    "/admin/assets": {
      get: {
        tags: ["8. Asset Management"],
        summary: "List Company Assets & Hardware",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Assets list" } }
      },
      post: {
        tags: ["8. Asset Management"],
        summary: "Register / Allocate New Asset",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  assetName: { type: "string", example: "MacBook Pro M3 Max" },
                  serialNumber: { type: "string", example: "APL-M3-98213" },
                  assignedTo: { type: "string", example: "Priyanshu Pushkar" },
                  status: { type: "string", example: "Assigned" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Asset registered" } }
      }
    },
    "/admin/assets/{id}": {
      put: {
        tags: ["8. Asset Management"],
        summary: "Update Asset Info / Status",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Asset updated" } }
      },
      delete: {
        tags: ["8. Asset Management"],
        summary: "Decommission / Remove Asset",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Asset deleted" } }
      }
    },
    "/employee/assets/request": {
      post: {
        tags: ["8. Asset Management"],
        summary: "Submit Hardware / Asset Request",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  assetType: { type: "string", example: "Secondary 4K Monitor" },
                  reason: { type: "string", example: "Multi-window coding setup" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Request submitted" } }
      }
    },
    "/admin/asset-requests": {
      get: {
        tags: ["8. Asset Management"],
        summary: "List Pending Asset Requests",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of asset requests" } }
      }
    },

    /* ========================================================
       9. MEETINGS & ANNOUNCEMENTS
       ======================================================== */
    "/meetings": {
      get: {
        tags: ["9. Meetings & Announcements"],
        summary: "List Team Meetings",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of meetings" } }
      },
      post: {
        tags: ["9. Meetings & Announcements"],
        summary: "Schedule New Meeting",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Sprint Architecture Sync" },
                  date: { type: "string", example: "2026-09-18" },
                  time: { type: "string", example: "11:00 AM" },
                  link: { type: "string", example: "https://meet.google.com/abc-defg-hij" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Meeting scheduled" } }
      }
    },
    "/meetings/{id}": {
      delete: {
        tags: ["9. Meetings & Announcements"],
        summary: "Cancel Meeting",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Meeting cancelled" } }
      }
    },
    "/announcements": {
      get: {
        tags: ["9. Meetings & Announcements"],
        summary: "List Announcements & Broadcasts",
        responses: { "200": { description: "Announcements list" } }
      },
      post: {
        tags: ["9. Meetings & Announcements"],
        summary: "Publish Announcement",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Q3 All Hands Meeting" },
                  content: { type: "string", example: "Celebration of new platform launch" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Announcement posted" } }
      }
    },
    "/announcements/{id}": {
      delete: {
        tags: ["9. Meetings & Announcements"],
        summary: "Delete Announcement",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Announcement deleted" } }
      }
    },

    /* ========================================================
       10. EXPENSES & REIMBURSEMENT
       ======================================================== */
    "/admin/expenses": {
      get: {
        tags: ["10. Expenses & Reimbursement"],
        summary: "List All Expense Claims",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of claims" } }
      }
    },
    "/employee/expenses": {
      get: {
        tags: ["10. Expenses & Reimbursement"],
        summary: "Get Personal Expense Claims",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Personal claims" } }
      },
      post: {
        tags: ["10. Expenses & Reimbursement"],
        summary: "Submit New Expense Claim",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  category: { type: "string", example: "Client Travel" },
                  amount: { type: "number", example: 3400 },
                  description: { type: "string", example: "Flight ticket to client site" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Expense claim submitted" } }
      }
    },
    "/admin/expenses/{id}": {
      put: {
        tags: ["10. Expenses & Reimbursement"],
        summary: "Approve or Reject Expense Claim",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["Approved", "Rejected"], example: "Approved" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Expense updated" } }
      }
    },

    /* ========================================================
       11. SUPPORT HELPDESK & TICKETS
       ======================================================== */
    "/admin/tickets": {
      get: {
        tags: ["11. Support Helpdesk"],
        summary: "List All Support Helpdesk Tickets",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of tickets" } }
      }
    },
    "/employee/tickets": {
      get: {
        tags: ["11. Support Helpdesk"],
        summary: "Get Personal Support Tickets",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Personal tickets" } }
      },
      post: {
        tags: ["11. Support Helpdesk"],
        summary: "Raise Support Ticket",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string", example: "VPN Connectivity Issue" },
                  priority: { type: "string", enum: ["Low", "Medium", "High"], example: "High" },
                  description: { type: "string", example: "Unable to connect to internal staging cluster" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Ticket created" } }
      }
    },
    "/admin/tickets/{id}": {
      put: {
        tags: ["11. Support Helpdesk"],
        summary: "Update Ticket Status / Add Admin Reply",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ticket updated" } }
      }
    },

    /* ========================================================
       12. CRM & SALES PIPELINE
       ======================================================== */
    "/crm/leads": {
      get: {
        tags: ["12. CRM & Sales Pipeline"],
        summary: "List Sales Leads",
        responses: { "200": { description: "List of leads" } }
      },
      post: {
        tags: ["12. CRM & Sales Pipeline"],
        summary: "Create CRM Sales Lead",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Global Tech Corp" },
                  email: { type: "string", example: "contact@globaltech.com" },
                  phone: { type: "string", example: "+91 9988776655" },
                  value: { type: "number", example: 120000 },
                  status: { type: "string", example: "NEW" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Lead created" } }
      }
    },
    "/crm/invoices": {
      get: {
        tags: ["12. CRM & Sales Pipeline"],
        summary: "List Invoices",
        responses: { "200": { description: "List of customer invoices" } }
      },
      post: {
        tags: ["12. CRM & Sales Pipeline"],
        summary: "Generate Invoice",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  customerName: { type: "string", example: "Global Tech Corp" },
                  amount: { type: "number", example: 120000 },
                  dueDate: { type: "string", example: "2026-10-15" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Invoice created" } }
      }
    },

    /* ========================================================
       13. PAYMENTS & SUBSCRIPTIONS
       ======================================================== */
    "/payments/create-order": {
      post: {
        tags: ["13. Payments & Subscriptions"],
        summary: "Create Razorpay Order",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  planId: { type: "string", example: "growth" },
                  amount: { type: "number", example: 4999 },
                  currency: { type: "string", example: "INR" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Order created" } }
      }
    },
    "/payments/verify": {
      post: {
        tags: ["13. Payments & Subscriptions"],
        summary: "Verify Razorpay Signature & Activate Plan",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Plan activated" } }
      }
    },
    "/tenants/{id}/renew": {
      post: {
        tags: ["13. Payments & Subscriptions"],
        summary: "Renew Tenant Subscription",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Subscription renewed" } }
      }
    },

    /* ========================================================
       14. PLATFORM SUPER OWNER
       ======================================================== */
    "/superowner/companies": {
      get: {
        tags: ["14. Platform Super Owner"],
        summary: "List All Tenant Companies",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of companies" } }
      },
      post: {
        tags: ["14. Platform Super Owner"],
        summary: "Provision New Tenant Company",
        security: [{ BearerAuth: [] }],
        responses: { "201": { description: "Company provisioned" } }
      }
    },
    "/superowner/plans": {
      get: {
        tags: ["14. Platform Super Owner"],
        summary: "List SaaS Subscription Plans",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of SaaS platform plans" } }
      },
      post: {
        tags: ["14. Platform Super Owner"],
        summary: "Create New SaaS Subscription Plan",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Enterprise Plus" },
                  price: { type: "number", example: 9999 },
                  currency: { type: "string", example: "INR" },
                  maxEmployees: { type: "number", example: 500 }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Plan created" } }
      }
    },
    "/superowner/users": {
      get: {
        tags: ["14. Platform Super Owner"],
        summary: "List All Platform Users",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Users list" } }
      },
      post: {
        tags: ["14. Platform Super Owner"],
        summary: "Create System Admin / Super Owner",
        security: [{ BearerAuth: [] }],
        responses: { "201": { description: "User created" } }
      }
    },
    "/superowner/coupons": {
      get: {
        tags: ["14. Platform Super Owner"],
        summary: "List Discount Coupons",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Coupons list" } }
      },
      post: {
        tags: ["14. Platform Super Owner"],
        summary: "Create Discount Coupon",
        security: [{ BearerAuth: [] }],
        responses: { "201": { description: "Coupon created" } }
      }
    },
    "/superowner/coupons/{id}": {
      delete: {
        tags: ["14. Platform Super Owner"],
        summary: "Delete Discount Coupon",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Coupon deleted" } }
      }
    },
    "/superowner/settings": {
      get: {
        tags: ["14. Platform Super Owner"],
        summary: "Get Global Platform Settings",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Platform settings" } }
      },
      put: {
        tags: ["14. Platform Super Owner"],
        summary: "Update Global Settings",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Settings saved" } }
      }
    }
  }
};

/**
 * Generates Swagger UI HTML using official CDN assets
 */
function getSwaggerHtml(specUrl = '/api/swagger.json') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ITLC HRMS & CRM - Complete Swagger API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://img.icons8.com/color/48/api-settings.png" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0b1120;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .topbar-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid #334155;
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .topbar-brand img {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #3b82f6;
      padding: 4px;
    }
    .topbar-brand h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
    }
    .topbar-brand span {
      background: #3b82f6;
      color: #fff;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
      margin-left: 8px;
    }
    .topbar-links {
      display: flex;
      gap: 10px;
    }
    .nav-btn {
      background: #1e293b;
      border: 1px solid #475569;
      color: #f8fafc;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .nav-btn:hover, .nav-btn.active {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
    }
    .auth-banner {
      background: #1e293b;
      max-width: 1400px;
      margin: 16px auto 0 auto;
      padding: 14px 24px;
      border-radius: 10px;
      border: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }
    .auth-badge {
      display: inline-block;
      padding: 3px 8px;
      background: #059669;
      color: white;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.72rem;
      margin-right: 8px;
    }
    #swagger-ui {
      background: #ffffff;
      margin: 20px auto 40px auto;
      max-width: 1400px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      padding: 24px;
    }
    .swagger-ui .topbar { display: none !important; }
  </style>
</head>
<body>
  <div class="topbar-header">
    <div class="topbar-brand">
      <img src="https://img.icons8.com/color/48/api-settings.png" alt="API" />
      <div>
        <h1>ITLC Enterprise HRMS & CRM <span>SWAGGER 3.0</span></h1>
      </div>
    </div>
    <div class="topbar-links">
      <a href="/" class="nav-btn">ðŸ“Š Dashboard</a>
      <a href="/api-docs" class="nav-btn active">ðŸ“– API Documentation</a>
      <a href="/api/swagger.json" target="_blank" class="nav-btn">ðŸ“„ OpenAPI Spec</a>
      <a href="/api/health" target="_blank" class="nav-btn">ðŸ©º Health Status</a>
    </div>
  </div>

  <div class="auth-banner">
    <div>
      <span class="auth-badge">AUTHENTICATION TIP</span>
      To test protected endpoints, login via <code>/api/auth/login</code>, copy the <code>token</code>, and click the green <strong>"Authorize"</strong> button below.
    </div>
    <div>
      <strong>Default Admin:</strong> <code>itlc@gmail.com</code> | <code>admin123</code>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        displayRequestDuration: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Generates Enterprise API Dashboard HTML
 */
function getDashboardHtml(serverInfo = {}) {
  const port = serverInfo.port || 5000;
  const uptimeMinutes = ((process.uptime() || 0) / 60).toFixed(1);
  const nodeVersion = process.version;
  const platform = process.platform;
  const memoryMb = (process.memoryUsage().rss / (1024 * 1024)).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ITLC HRMS - Enterprise Backend API Dashboard</title>
  <link rel="icon" type="image/png" href="https://img.icons8.com/color/48/server.png" />
  <style>
    :root {
      --bg-base: #090d16;
      --bg-card: #111827;
      --bg-card-hover: #1f2937;
      --border-color: #1e293b;
      --primary: #3b82f6;
      --accent: #10b981;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding-bottom: 60px;
    }
    .header {
      background: #111827;
      border-bottom: 1px solid var(--border-color);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .title-group h1 { font-size: 1.25rem; font-weight: 700; }
    .title-group p { font-size: 0.78rem; color: var(--text-muted); }
    .header-links { display: flex; gap: 10px; }
    .btn {
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 7px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
      border: 1px solid #3b82f6;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-outline {
      background: #1e293b;
      color: var(--text-main);
      border: 1px solid #334155;
    }
    .btn-outline:hover { background: #334155; }
    .container {
      max-width: 1360px;
      margin: 28px auto;
      padding: 0 24px;
    }
    .hero {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .pulse-dot {
      width: 9px;
      height: 9px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .hero-title { font-size: 1.7rem; font-weight: 800; margin-bottom: 6px; }
    .hero-desc { color: var(--text-muted); font-size: 0.92rem; max-width: 650px; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
    }
    .metric-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .metric-value { font-size: 1.5rem; font-weight: 700; color: #ffffff; }
    .metric-sub { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
    .creds-section, .endpoints-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .creds-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 14px; }
    .creds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }
    .cred-item {
      background: #0b1120;
      border: 1px solid #1e293b;
      padding: 14px;
      border-radius: 8px;
    }
    .cred-role {
      font-size: 0.75rem;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .cred-row {
      font-size: 0.82rem;
      color: #cbd5e1;
      margin-bottom: 3px;
    }
    .cred-row code {
      background: #1e293b;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: monospace;
      color: #f1f5f9;
    }
    .category-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #93c5fd;
      margin: 22px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .endpoint-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0b1120;
      border: 1px solid #1e293b;
      padding: 11px 16px;
      border-radius: 8px;
      margin-bottom: 7px;
    }
    .endpoint-left { display: flex; align-items: center; gap: 12px; }
    .method-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      min-width: 50px;
      text-align: center;
    }
    .method-get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .method-post { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .method-put { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .method-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .endpoint-path { font-family: monospace; font-size: 0.88rem; font-weight: 600; color: #f1f5f9; }
    .endpoint-desc { font-size: 0.8rem; color: var(--text-muted); }
    .test-link {
      font-size: 0.75rem;
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 4px 9px;
      border-radius: 4px;
      text-decoration: none;
    }
    .test-link:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
  </style>
</head>
<body>
  <nav class="header">
    <div class="logo-container">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m-4-4 4 4 4-4"/></svg>
      </div>
      <div class="title-group">
        <h1>ITLC HRMS & CRM Enterprise Server</h1>
        <p>100% Complete Feature API Gateway & Endpoints Hub</p>
      </div>
    </div>
    <div class="header-links">
      <a href="/api-docs" class="btn btn-primary">ðŸ“– Interactive Swagger UI</a>
      <a href="/api/swagger.json" target="_blank" class="btn btn-outline">ðŸ“„ OpenAPI JSON</a>
      <a href="/api/health" target="_blank" class="btn btn-outline">ðŸ©º Health JSON</a>
    </div>
  </nav>

  <main class="container">
    <section class="hero">
      <div>
        <div class="status-badge">
          <div class="pulse-dot"></div>
          SERVER RUNNING (PORT ${port})
        </div>
        <h2 class="hero-title">Enterprise API Hub Active</h2>
        <p class="hero-desc">
          Sabhi system features (Payroll, Attendance, Leaves, Appraisals, Assets, Meetings, Announcements, Expenses, Support Tickets, CRM Deals, and Payments) ke complete endpoints active hain.
        </p>
      </div>
      <div>
        <a href="/api-docs" class="btn btn-primary" style="padding: 12px 24px; font-size: 1rem;">
          ðŸš€ Open Full Swagger Docs
        </a>
      </div>
    </section>

    <section class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Status</div>
        <div class="metric-value" style="color: #34d399;">RUNNING</div>
        <div class="metric-sub">Port ${port} Active</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Uptime</div>
        <div class="metric-value">${uptimeMinutes}m</div>
        <div class="metric-sub">Session active</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Node Runtime</div>
        <div class="metric-value">${nodeVersion}</div>
        <div class="metric-sub">Platform: ${platform}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Memory Heap</div>
        <div class="metric-value">${memoryMb} MB</div>
        <div class="metric-sub">Resident memory</div>
      </div>
    </section>

    <!-- Pre-Configured Test Credentials -->
    <section class="creds-section">
      <div class="creds-title">ðŸ” Role Credentials for Testing</div>
      <div class="creds-grid">
        <div class="cred-item">
          <div class="cred-role">Platform Super Owner</div>
          <div class="cred-row">Email: <code>priyanshupushkar263@gmail.com</code></div>
          <div class="cred-row">Pass: <code>Priyanshu8090</code></div>
        </div>
        <div class="cred-item">
          <div class="cred-role">System Admin</div>
          <div class="cred-row">Email: <code>superowner@itlc.com</code></div>
          <div class="cred-row">Pass: <code>admin</code></div>
        </div>
        <div class="cred-item">
          <div class="cred-role">Company Admin</div>
          <div class="cred-row">Email: <code>itlc@gmail.com</code></div>
          <div class="cred-row">Pass: <code>admin123</code></div>
        </div>
        <div class="cred-item">
          <div class="cred-role">Reporting Manager</div>
          <div class="cred-row">Email: <code>manager@gmail.com</code></div>
          <div class="cred-row">Pass: <code>man123</code></div>
        </div>
        <div class="cred-item">
          <div class="cred-role">Standard Employee</div>
          <div class="cred-row">Email: <code>emp@gmail.com</code></div>
          <div class="cred-row">Pass: <code>emp123</code></div>
        </div>
      </div>
    </section>

    <!-- Complete Feature-wise API Directory -->
    <section class="endpoints-section">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size: 1.2rem;">ðŸ“¡ Complete Feature-Wise API Endpoints</h2>
        <a href="/api-docs" class="btn btn-outline" style="font-size: 0.8rem;">Open in Swagger &rarr;</a>
      </div>

      <!-- 1. PAYROLL APIS -->
      <div class="category-title">ðŸ’° 1. Payroll & Payslips APIs</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/payroll</div>
            <div class="endpoint-desc">Company ke sabhi payroll batches aur disbursement records list kare</div>
          </div>
        </div>
        <a href="/api-docs#/3.%20Payroll%20%26%20Payslips/get_admin_payroll" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/admin/payroll</div>
            <div class="endpoint-desc">Naya payroll batch generate aur process kare (salaries, allowances, deductions)</div>
          </div>
        </div>
        <a href="/api-docs#/3.%20Payroll%20%26%20Payslips/post_admin_payroll" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-put">PUT</span>
          <div>
            <div class="endpoint-path">/api/admin/payroll/{id}</div>
            <div class="endpoint-desc">Payroll batch status ya notes update kare (Paid/Pending)</div>
          </div>
        </div>
        <a href="/api-docs#/3.%20Payroll%20%26%20Payslips/put_admin_payroll__id_" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-delete">DELETE</span>
          <div>
            <div class="endpoint-path">/api/admin/payroll/{id}</div>
            <div class="endpoint-desc">Payroll run record delete kare</div>
          </div>
        </div>
        <a href="/api-docs#/3.%20Payroll%20%26%20Payslips/delete_admin_payroll__id_" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/employee/payroll</div>
            <div class="endpoint-desc">Employee ki personal payslips aur earnings statement dekhe</div>
          </div>
        </div>
        <a href="/api-docs#/3.%20Payroll%20%26%20Payslips/get_employee_payroll" class="test-link">Test &rarr;</a>
      </div>

      <!-- 2. ATTENDANCE & TIMESHEETS -->
      <div class="category-title">â±ï¸ 2. Attendance, Geofencing & Timesheets</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/attendance</div>
            <div class="endpoint-desc">Company-wide sabhi staff ka real-time attendance log</div>
          </div>
        </div>
        <a href="/api-docs#/4.%20Attendance%20%26%20Timesheets/get_admin_attendance" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/employee/attendance/punch-in</div>
            <div class="endpoint-desc">Geo-tagged coordinates (latitude, longitude) ke sath Punch In</div>
          </div>
        </div>
        <a href="/api-docs#/4.%20Attendance%20%26%20Timesheets/post_employee_attendance_punch_in" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/employee/attendance/punch-out</div>
            <div class="endpoint-desc">Attendance Punch Out aur total shift duration calculate karna</div>
          </div>
        </div>
        <a href="/api-docs#/4.%20Attendance%20%26%20Timesheets/post_employee_attendance_punch_out" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/manager/corrections</div>
            <div class="endpoint-desc">Attendance punch correction applications review kare</div>
          </div>
        </div>
        <a href="/api-docs#/4.%20Attendance%20%26%20Timesheets/get_manager_corrections" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-put">PUT</span>
          <div>
            <div class="endpoint-path">/api/manager/corrections/{id}</div>
            <div class="endpoint-desc">Correction request approve ya reject kare</div>
          </div>
        </div>
        <a href="/api-docs#/4.%20Attendance%20%26%20Timesheets/put_manager_corrections__id_" class="test-link">Test &rarr;</a>
      </div>

      <!-- 3. LEAVES & HOLIDAYS -->
      <div class="category-title">ðŸ–ï¸ 3. Leaves & Holidays Management</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/leaves</div>
            <div class="endpoint-desc">Sabhi staff ki leave applications aur balance</div>
          </div>
        </div>
        <a href="/api-docs#/5.%20Leaves%20%26%20Holidays/get_admin_leaves" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/employee/leaves</div>
            <div class="endpoint-desc">Nayi leave request submit karna (Paid, Sick, Casual)</div>
          </div>
        </div>
        <a href="/api-docs#/5.%20Leaves%20%26%20Holidays/post_employee_leaves" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-put">PUT</span>
          <div>
            <div class="endpoint-path">/api/admin/leaves/{id}</div>
            <div class="endpoint-desc">Leave approve ya reject kare</div>
          </div>
        </div>
        <a href="/api-docs#/5.%20Leaves%20%26%20Holidays/put_admin_leaves__id_" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/holidays</div>
            <div class="endpoint-desc">Company public aur optional holiday calendar</div>
          </div>
        </div>
        <a href="/api-docs#/5.%20Leaves%20%26%20Holidays/get_admin_holidays" class="test-link">Test &rarr;</a>
      </div>

      <!-- 4. TASKS & PROJECTS -->
      <div class="category-title">ðŸ“‹ 4. Task Management & Work Delegation</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/tasks</div>
            <div class="endpoint-desc">Assigned tasks aur status list (Pending, In Progress, Completed)</div>
          </div>
        </div>
        <a href="/api-docs#/6.%20Task%20Management/get_tasks" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/tasks</div>
            <div class="endpoint-desc">Employee ko naya task assign karna with priority aur due date</div>
          </div>
        </div>
        <a href="/api-docs#/6.%20Task%20Management/post_tasks" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-put">PUT</span>
          <div>
            <div class="endpoint-path">/api/tasks/{id}</div>
            <div class="endpoint-desc">Task progress update ya complete mark kare</div>
          </div>
        </div>
        <a href="/api-docs#/6.%20Task%20Management/put_tasks__id_" class="test-link">Test &rarr;</a>
      </div>

      <!-- 5. PERFORMANCE & APPRAISALS -->
      <div class="category-title">ðŸŽ¯ 5. Performance Appraisals & Reviews</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/performance</div>
            <div class="endpoint-desc">Quarterly performance appraisals, KPI ratings aur reviews</div>
          </div>
        </div>
        <a href="/api-docs#/7.%20Performance%20%26%20Appraisals/get_admin_performance" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/admin/performance</div>
            <div class="endpoint-desc">Employee performance review submit karna</div>
          </div>
        </div>
        <a href="/api-docs#/7.%20Performance%20%26%20Appraisals/post_admin_performance" class="test-link">Test &rarr;</a>
      </div>

      <!-- 6. ASSET MANAGEMENT -->
      <div class="category-title">ðŸ’» 6. Company Asset Management</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/assets</div>
            <div class="endpoint-desc">Laptops, monitors, hardware inventory and allocation list</div>
          </div>
        </div>
        <a href="/api-docs#/8.%20Asset%20Management/get_admin_assets" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/admin/assets</div>
            <div class="endpoint-desc">Naya hardware asset register aur assign kare</div>
          </div>
        </div>
        <a href="/api-docs#/8.%20Asset%20Management/post_admin_assets" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/employee/assets/request</div>
            <div class="endpoint-desc">Employee ke dwara hardware requirement request submit karna</div>
          </div>
        </div>
        <a href="/api-docs#/8.%20Asset%20Management/post_employee_assets_request" class="test-link">Test &rarr;</a>
      </div>

      <!-- 7. MEETINGS & BROADCASTS -->
      <div class="category-title">ðŸ“¢ 7. Meetings & Company Announcements</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/meetings</div>
            <div class="endpoint-desc">Scheduled video meetings, time aur meeting links</div>
          </div>
        </div>
        <a href="/api-docs#/9.%20Meetings%20%26%20Announcements/get_meetings" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/announcements</div>
            <div class="endpoint-desc">Company all-hands news aur department broadcasts</div>
          </div>
        </div>
        <a href="/api-docs#/9.%20Meetings%20%26%20Announcements/get_announcements" class="test-link">Test &rarr;</a>
      </div>

      <!-- 8. EXPENSES & TICKETS -->
      <div class="category-title">ðŸ§¾ 8. Expenses & Support Helpdesk</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/expenses</div>
            <div class="endpoint-desc">Reimbursement expense claims list</div>
          </div>
        </div>
        <a href="/api-docs#/10.%20Expenses%20%26%20Reimbursement/get_admin_expenses" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/admin/tickets</div>
            <div class="endpoint-desc">Employee internal support helpdesk tickets</div>
          </div>
        </div>
        <a href="/api-docs#/11.%20Support%20Helpdesk/get_admin_tickets" class="test-link">Test &rarr;</a>
      </div>

      <!-- 9. CRM, PAYMENTS & PLATFORM -->
      <div class="category-title">ðŸ’³ 9. CRM, Payments & Platform Super Owner</div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/crm/leads</div>
            <div class="endpoint-desc">CRM sales leads aur deals pipeline tracking</div>
          </div>
        </div>
        <a href="/api-docs#/12.%20CRM%20%26%20Sales%20Pipeline/get_crm_leads" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-post">POST</span>
          <div>
            <div class="endpoint-path">/api/payments/create-order</div>
            <div class="endpoint-desc">Razorpay SaaS subscription order create kare</div>
          </div>
        </div>
        <a href="/api-docs#/13.%20Payments%20%26%20Subscriptions/post_payments_create_order" class="test-link">Test &rarr;</a>
      </div>
      <div class="endpoint-row">
        <div class="endpoint-left">
          <span class="method-badge method-get">GET</span>
          <div>
            <div class="endpoint-path">/api/superowner/companies</div>
            <div class="endpoint-desc">Super Owner: Sabhi multi-tenant companies manage kare</div>
          </div>
        </div>
        <a href="/api-docs#/14.%20Platform%20Super%20Owner/get_superowner_companies" class="test-link">Test &rarr;</a>
      </div>

    </section>
  </main>
</body>
</html>`;
}

/**
 * Prints the official server banner to console upon server startup
 */
function printServerBanner(port = 5000) {
  const line = "=".repeat(78);
  console.log("");
  console.log(line);
  console.log(" ðŸš€ ITLC HRMS & CRM ENTERPRISE SERVER IS RUNNING");
  console.log(line);
  console.log(` ðŸ“¡ Server Status   : RUNNING (Port: ${port})`);
  console.log(` ðŸŒ Local API Base  : http://localhost:${port}/api`);
  console.log(` ðŸ“– Swagger API Docs: http://localhost:${port}/api-docs`);
  console.log(` ðŸ“Š API Dashboard   : http://localhost:${port}/`);
  console.log(` ðŸ©º Health Check    : http://localhost:${port}/api/health`);
  console.log(` ðŸ“„ OpenAPI JSON    : http://localhost:${port}/api/swagger.json`);
  console.log(line);
  console.log("");
}

export { swaggerSpec, getSwaggerHtml, getDashboardHtml, printServerBanner };
export default { swaggerSpec, getSwaggerHtml, getDashboardHtml, printServerBanner };
