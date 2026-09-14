-- ======================================================================
-- ITLC HRMS Enterprise Cloud Database Schema & Clean Data Dump
-- Single Company Workspace: itlc
-- Optimized for Hostinger Cloud / Shared MySQL (u997632379_hrms)
-- Generated on: 2026-09-13T22:23:26.112Z
-- NOTE: Import directly into your Hostinger database via phpMyAdmin.
-- ======================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ------------------------------------------------------
-- Table structure for table `companies`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo` varchar(255) DEFAULT '',
  `owner_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` text DEFAULT NULL,
  `gst` varchar(255) DEFAULT '',
  `address` text DEFAULT NULL,
  `country` varchar(255) DEFAULT '',
  `state` varchar(255) DEFAULT '',
  `city` varchar(255) DEFAULT '',
  `timezone` varchar(255) DEFAULT 'UTC',
  `currency` varchar(255) DEFAULT 'USD',
  `subscription_plan_id` varchar(255) DEFAULT 'starter',
  `max_employees` int(11) DEFAULT 100,
  `storage_limit` float DEFAULT 50,
  `storage_used` float DEFAULT 0,
  `status` enum('active','suspended','trial','expired') DEFAULT 'trial',
  `created_date` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `companies` (Only the 1 onboarded company: itlc)
INSERT INTO `companies` (`id`, `name`, `logo`, `owner_name`, `email`, `phone`, `gst`, `address`, `country`, `state`, `city`, `timezone`, `currency`, `subscription_plan_id`, `max_employees`, `storage_limit`, `storage_used`, `status`, `created_date`) VALUES
('comp_1789319012221', 'itlc', '', 'itlc Owner', 'itlc@gmail.com', '1234567890', '', '', 'India', 'Uttar Pradesh', 'Lucknow', 'UTC', 'INR', 'trial', 100, 50, 0, 'trial', '2026-09-13');

-- ------------------------------------------------------
-- Table structure for table `employees`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` varchar(255) NOT NULL,
  `company_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT '$2a$10$U7vO9vM2nF1c7x.iP8W1eu3R6s2P6o.G1eK4b4xY0d1y3g4d5v6a.',
  `role` enum('Super Owner','Company Admin','HR','Manager','Employee') DEFAULT 'Employee',
  `department` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `salary` text DEFAULT NULL,
  `phone` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT '',
  `status` enum('Active','On Leave','Suspended') DEFAULT 'Active',
  `dob` text DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `joining_date` varchar(255) DEFAULT NULL,
  `reporting_manager` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `employees`
-- Super Owners:
-- 1. Priyanshu Pushkar (priyanshupushkar263@gmail.com / Priyanshu8090)
-- 2. Super Owner ITLC (superowner@itlc.com / admin)
-- Company Admin: itlc (itlc@gmail.com / admin123)
-- Manager: manager (manager@gmail.com / admin123)
-- Employee: emp (emp@gmail.com / admin123)
INSERT INTO `employees` (`id`, `company_id`, `name`, `email`, `password_hash`, `role`, `department`, `designation`, `salary`, `phone`, `avatar`, `status`, `dob`, `gender`, `address`, `joining_date`, `reporting_manager`) VALUES
('SUP_PAPZ0YC', NULL, 'Priyanshu Pushkar', 'priyanshupushkar263@gmail.com', '$2a$10$/wO.jMAyZetHQy.OSR7s0.hVrippujSxf6XT7wkPICKt9hPfDdmee', 'Super Owner', 'Executive Leadership', 'Platform Administrator & Master Owner', NULL, '+91 95323 41000', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Active', NULL, 'Male', NULL, '2026-09-01', NULL),
('usr_superowner_master', NULL, 'Super Owner ITLC', 'superowner@itlc.com', '$2a$10$U7vO9vM2nF1c7x.iP8W1eu3R6s2P6o.G1eK4b4xY0d1y3g4d5v6a.', 'Super Owner', 'Executive Leadership', 'Platform Administrator', NULL, '+91 80903 11359', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Active', NULL, 'Male', NULL, '2026-01-01', NULL),
('ADM_ITLC', 'comp_1789319012221', 'itlc', 'itlc@gmail.com', '$2a$10$jX8ciHvWCANbBuAt19e54.mCbDX6aqJQnq/tUtn/8DVZH/QdhYHq6', 'Company Admin', 'Executive & Administration', 'Managing Director', NULL, '1234567890', '', 'Active', NULL, NULL, NULL, '2026-09-13', NULL),
('EMP_MGR_ITLC', 'comp_1789319012221', 'manager', 'manager@gmail.com', '$2a$10$Q/E2v6A6kPZWp5.LZKee6uROd21.xYvCXAiqq8fSkfGywmTKRwOv6', 'Manager', 'Engineering', 'Team Lead Manager', '₹75,000', '+91 98765 01928', 'https://images.unsplash.com/photo-1500000320135?w=150&auto=format&fit=crop&q=80', 'Active', NULL, NULL, NULL, '2026-09-13', 'itlc'),
('EMP_STAFF_ITLC', 'comp_1789319012221', 'emp', 'emp@gmail.com', '$2a$10$EaWkK7sq9ZSaLCKJ15xdZeINSjbzk5DEvxsI9lwfuLGIlmroJTYN6', 'Employee', 'Engineering', 'Staff Associate', '₹50,000', '+91 98765 03482', 'https://images.unsplash.com/photo-1500000464347?w=150&auto=format&fit=crop&q=80', 'Active', NULL, 'Male', NULL, '2026-09-13', 'manager');

-- ------------------------------------------------------
-- Table structure for table `attendances`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `attendances`;
CREATE TABLE `attendances` (
  `id` varchar(255) NOT NULL,
  `company_id` varchar(255) DEFAULT NULL,
  `employee_id` varchar(255) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `date` varchar(255) NOT NULL,
  `check_in` varchar(255) DEFAULT NULL,
  `check_out` varchar(255) DEFAULT NULL,
  `break_duration` varchar(255) DEFAULT '00:00:00',
  `work_hours` varchar(255) DEFAULT '00:00:00',
  `status` varchar(255) DEFAULT 'Present',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `attendances` (`id`, `company_id`, `employee_id`, `employee_name`, `date`, `check_in`, `check_out`, `break_duration`, `work_hours`, `status`) VALUES
('att_1789323115668', 'comp_1789319012221', 'EMP_MGR_ITLC', 'manager', '2026-09-13', '09:00:00', '18:00:00', '01:00:00', '08:00:00', 'Present'),
('att_1789323951698', 'comp_1789319012221', 'EMP_STAFF_ITLC', 'emp', '2026-09-13', '09:15:00', '18:15:00', '00:45:00', '08:15:00', 'Present');

-- ------------------------------------------------------
-- Table structure for table `leave_requests`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` varchar(255) NOT NULL,
  `company_id` varchar(255) DEFAULT '',
  `employee_id` varchar(255) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `from_date` varchar(255) NOT NULL,
  `to_date` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `applied_date` varchar(255) DEFAULT NULL,
  `total_days` int(11) NOT NULL,
  `manager_status` varchar(255) DEFAULT 'Pending',
  `manager_comment` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `leave_requests` (`id`, `company_id`, `employee_id`, `employee_name`, `type`, `from_date`, `to_date`, `reason`, `status`, `applied_date`, `total_days`, `manager_status`, `manager_comment`) VALUES
('leave_1789324767808', 'comp_1789319012221', 'EMP_STAFF_ITLC', 'emp', 'Sick Leave', '2026-09-15', '2026-09-16', 'Fever and doctor recommended rest', 'Approved', '2026-09-13', 2, 'Approved', 'Get well soon!'),
('leave_1789324767859', 'comp_1789319012221', 'EMP_MGR_ITLC', 'manager', 'Casual Leave', '2026-09-20', '2026-09-21', 'Personal family event', 'Approved', '2026-09-13', 2, 'Approved', 'Approved');

-- ------------------------------------------------------
-- Table structure for table `tasks`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` varchar(255) NOT NULL,
  `company_id` varchar(255) NOT NULL,
  `assigned_to` varchar(255) NOT NULL,
  `assigned_to_name` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_by_name` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Todo','In Progress','Completed','Blocked','Cancelled') DEFAULT 'Todo',
  `priority` enum('Low','Medium','High') DEFAULT 'Medium',
  `deadline` varchar(255) NOT NULL,
  `attachments` text DEFAULT NULL,
  `comments` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tasks` (`id`, `company_id`, `assigned_to`, `assigned_to_name`, `created_by`, `created_by_name`, `title`, `description`, `status`, `priority`, `deadline`, `attachments`, `comments`) VALUES
('TSK_1789325722627', 'comp_1789319012221', 'EMP_STAFF_ITLC', 'emp', 'EMP_MGR_ITLC', 'manager', 'Complete HRMS Module Verification', 'Verify and test attendance, leave, and dashboard flow', 'Completed', 'High', '2026-09-15', '', '[]');

-- ------------------------------------------------------
-- Table structure for table `announcements`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` varchar(255) NOT NULL,
  `company_id` varchar(255) NOT NULL,
  `author_id` varchar(255) NOT NULL,
  `author_name` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `date` varchar(255) NOT NULL,
  `send_email` tinyint(1) DEFAULT 0,
  `send_push` tinyint(1) DEFAULT 0,
  `type` enum('Announcement','Birthday','Anniversary','Reminder') DEFAULT 'Announcement',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `announcements` (`id`, `company_id`, `author_id`, `author_name`, `title`, `content`, `date`, `send_email`, `send_push`, `type`) VALUES
('ann_1789327408421', 'comp_1789319012221', 'ADM_ITLC', 'itlc', 'Enterprise HRMS Platform Live', 'Welcome to ITLC Cloud HRMS & Unified Enterprise Workspace.', '2026-09-13', 1, 1, 'Announcement');

-- ------------------------------------------------------
-- Table structure for table `holidays`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` varchar(255) DEFAULT '',
  `name` varchar(255) NOT NULL,
  `date` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT 'Public Holiday',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `holidays` (`id`, `company_id`, `name`, `date`, `type`) VALUES
(1, 'comp_1789319012221', 'Republic Day', '2026-01-26', 'National Holiday'),
(2, 'comp_1789319012221', 'Holi Festival', '2026-03-04', 'Public Holiday'),
(3, 'comp_1789319012221', 'Independence Day', '2026-08-15', 'National Holiday'),
(4, 'comp_1789319012221', 'Gandhi Jayanti', '2026-10-02', 'National Holiday'),
(5, 'comp_1789319012221', 'Diwali Festival', '2026-11-08', 'Public Holiday'),
(6, 'comp_1789319012221', 'Christmas Day', '2026-12-25', 'Public Holiday');

-- ------------------------------------------------------
-- Table structure for table `leave_policies`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `leave_policies`;
CREATE TABLE `leave_policies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` varchar(255) DEFAULT '',
  `leave_class` varchar(255) NOT NULL,
  `annual_allocation` int(11) NOT NULL,
  `carry_forward_limit` int(11) DEFAULT 0,
  `payout_mode` varchar(255) DEFAULT 'None',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `leave_policies` (`id`, `company_id`, `leave_class`, `annual_allocation`, `carry_forward_limit`, `payout_mode`) VALUES
(1, 'comp_1789319012221', 'Casual Leave (CL)', 12, 0, 'None'),
(2, 'comp_1789319012221', 'Sick / Medical Leave (SL)', 10, 5, 'None'),
(3, 'comp_1789319012221', 'Earned / Privilege Leave (PL)', 18, 10, 'Encashable'),
(4, 'comp_1789319012221', 'Maternity / Paternity Leave', 90, 0, 'None');

-- ------------------------------------------------------
-- Table structure for table `payroll_records`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `payroll_records`;
CREATE TABLE `payroll_records` (
  `id` varchar(255) NOT NULL,
  `company_id` varchar(255) NOT NULL,
  `employee_id` varchar(255) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `month` varchar(255) NOT NULL,
  `year` int(11) NOT NULL,
  `basic` float DEFAULT 0,
  `hra` float DEFAULT 0,
  `allowances` float DEFAULT 0,
  `deductions` float DEFAULT 0,
  `net_salary` float DEFAULT 0,
  `overtime` float DEFAULT 0,
  `reimbursements` float DEFAULT 0,
  `prof_tax` float DEFAULT 0,
  `type` varchar(255) DEFAULT 'Regular',
  `gratuity` float DEFAULT 0,
  `leave_encashment` float DEFAULT 0,
  `status` varchar(255) DEFAULT 'Paid',
  `payment_date` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `payroll_records` (`id`, `company_id`, `employee_id`, `employee_name`, `month`, `year`, `basic`, `hra`, `allowances`, `deductions`, `net_salary`, `status`, `payment_date`) VALUES
('pay_1789327408391', 'comp_1789319012221', 'EMP_MGR_ITLC', 'manager', 'September', 2026, 45000, 18000, 12000, 5000, 70000, 'Paid', '2026-09-13'),
('pay_1789327408392', 'comp_1789319012221', 'EMP_STAFF_ITLC', 'emp', 'September', 2026, 30000, 12000, 8000, 3000, 47000, 'Paid', '2026-09-13');

-- ------------------------------------------------------
-- Table structure for table `coupons`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `discount_type` enum('percentage','fixed') DEFAULT 'percentage',
  `discount_value` float NOT NULL,
  `valid_until` varchar(255) NOT NULL,
  `usage_limit` int(11) DEFAULT 100,
  `used_count` int(11) DEFAULT 0,
  `status` enum('active','expired') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `valid_until`, `usage_limit`, `used_count`, `status`) VALUES
('cpn_welcome50', 'WELCOME50', 'percentage', 50, '2026-12-31', 500, 12, 'active'),
('cpn_launch2026', 'LAUNCH2026', 'fixed', 500, '2026-12-31', 1000, 28, 'active');

SET FOREIGN_KEY_CHECKS = 1;

-- ======================================================================
-- Clean Dump Completed Successfully: 1 Company (itlc) + Super Owners.
-- ======================================================================
