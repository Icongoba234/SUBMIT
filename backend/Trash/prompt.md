🔥 MASTER BACKEND SETUP PROMPT (COPY & SEND TO AI)
ROLE

You are a senior backend engineer experienced in building traditional REST APIs using Node.js, Express, and MySQL (XAMPP).
You follow clean architecture, proper security practices, and production-ready structure.

PROJECT CONTEXT

I already have a static frontend built with:

HTML

Tailwind CSS

Vanilla JavaScript (using fetch())

The frontend includes:

Login page

Complaint submission page

Admin dashboard

Agency dashboard

⚠️ The frontend is already done.
Your task is to build ONLY the backend.

STRICT TECHNOLOGY REQUIREMENTS (DO NOT CHANGE)

Backend: Node.js + Express

Database: MySQL (MariaDB via XAMPP)

DB Tool: phpMyAdmin

Auth: JWT

Passwords: bcrypt

DB Driver: mysql2

Environment Variables: dotenv

🚫 DO NOT use:

Firebase

Supabase

MongoDB

PHP

Laravel

ORM (no Prisma, no Sequelize)

This must be a traditional SQL backend.

ARCHITECTURE
Frontend (HTML + JS fetch)
        |
        v
Node.js (Express REST API)
        |
        v
MySQL (XAMPP / phpMyAdmin)

DATABASE SETUP (MySQL)
Database Name
citizenvoice

Tables Required
1️⃣ users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('citizen','admin','agency') DEFAULT 'citizen',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2️⃣ complaints
CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  status ENUM('pending','in_review','resolved') DEFAULT 'pending',
  assigned_agency_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

3️⃣ agencies
CREATE TABLE agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

BACKEND FOLDER STRUCTURE (MUST FOLLOW)
backend/
│
├── server.js
├── db.js
├── .env
│
├── routes/
│   ├── auth.routes.js
│   ├── complaint.routes.js
│   ├── admin.routes.js
│   └── agency.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── complaint.controller.js
│   ├── admin.controller.js
│   └── agency.controller.js
│
├── middleware/
│   └── auth.middleware.js

DATABASE CONNECTION

Use MySQL from XAMPP.

const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'citizenvoice',
  port: 3306
});

module.exports = db;

FEATURES TO IMPLEMENT (MANDATORY)
🔐 1️⃣ AUTHENTICATION (JWT)

Register user

Login user

Hash passwords with bcrypt

Generate JWT on login

Protect routes using middleware

Roles: citizen, admin, agency

Endpoints:

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile

📝 2️⃣ SUBMIT COMPLAINT API

Logged-in users can submit complaints

Complaints stored in MySQL

Default status = pending

Endpoints:

POST /api/complaints
GET  /api/complaints/my

🛂 3️⃣ ADMIN DASHBOARD BACKEND

Admin can:

View all complaints

Assign complaints to agencies

Update complaint status

Endpoints:

GET  /api/admin/complaints
POST /api/admin/assign
PATCH /api/admin/status


(Admin-only access using role middleware)

🏢 4️⃣ AGENCY WORKFLOW

Agency users can:

View complaints assigned to them

Update status (in_review → resolved)

Endpoints:

GET   /api/agency/complaints
PATCH /api/agency/status

SECURITY REQUIREMENTS

JWT must be verified on protected routes

Passwords must NEVER be stored in plain text

Use role-based access control

Enable CORS

OUTPUT REQUIREMENTS

You must output:

All backend files (complete code)

SQL scripts

Example fetch() calls from frontend

Clear instructions to run backend

No frontend code rewrite

FINAL RULE

This is a traditional backend.
Do not suggest cloud services or alternatives.

✅ END OF PROMPT