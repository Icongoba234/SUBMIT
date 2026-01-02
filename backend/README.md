# CitizenVoice Backend API

A RESTful API backend for the CitizenVoice complaint management system built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- XAMPP (with MySQL/MariaDB running)
- npm or yarn

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Import and run `sql/setup.sql` OR manually create the database and tables
   - Make sure MySQL is running on port 3306

4. **Configure environment variables:**
   - The `.env` file is already created with default values
   - For production, change `JWT_SECRET` to a strong random string
   - Update database credentials if different from defaults

5. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Verify the server is running:**
   - Open http://localhost:3000/api/health
   - You should see: `{"status":"OK","message":"CitizenVoice API is running"}`

## 📁 Project Structure

```
backend/
├── server.js                 # Main server file
├── db.js                     # Database connection
├── .env                      # Environment variables
├── package.json              # Dependencies
├── routes/                   # API routes
│   ├── auth.routes.js
│   ├── complaint.routes.js
│   ├── admin.routes.js
│   └── agency.routes.js
├── controllers/              # Business logic
│   ├── auth.controller.js
│   ├── complaint.controller.js
│   ├── admin.controller.js
│   └── agency.controller.js
├── middleware/               # Custom middleware
│   └── auth.middleware.js
└── sql/
    └── setup.sql            # Database setup script
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Complaints

- `POST /api/complaints` - Submit complaint (protected)
- `GET /api/complaints/my` - Get user's complaints (protected)

### Admin

- `GET /api/admin/complaints` - Get all complaints (admin only)
- `POST /api/admin/assign` - Assign complaint to agency (admin only)
- `PATCH /api/admin/status` - Update complaint status (admin only)
- `GET /api/admin/agencies` - Get all agencies (admin only)

### Agency

- `GET /api/agency/complaints` - Get assigned complaints (agency only)
- `PATCH /api/agency/status` - Update complaint status (agency only)

## 📝 Example Frontend Fetch Calls

### Register User

```javascript
fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fullname: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'citizen' // optional, defaults to 'citizen'
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    // Store token in localStorage
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    console.log('Registration successful:', data);
  } else {
    console.error('Registration failed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Login User

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    // Store token in localStorage
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    console.log('Login successful:', data);
    // Redirect to dashboard
    window.location.href = '/pages/homepage.html';
  } else {
    console.error('Login failed:', data.message);
    alert(data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Submit Complaint

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/complaints', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Pothole on Main Street',
    description: 'There is a large pothole on Main Street near the intersection with Oak Avenue.'
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('Complaint submitted:', data.data.complaint);
    alert('Complaint submitted successfully!');
  } else {
    console.error('Submission failed:', data.message);
    alert(data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Get My Complaints

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/complaints/my', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('My complaints:', data.data.complaints);
    // Display complaints in UI
    displayComplaints(data.data.complaints);
  } else {
    console.error('Failed to fetch:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Admin: Get All Complaints

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/admin/complaints', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('All complaints:', data.data.complaints);
    // Display in admin dashboard
  } else {
    console.error('Failed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Admin: Assign Complaint to Agency

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/admin/assign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    complaintId: 1,
    agencyId: 2
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('Complaint assigned:', data.data.complaint);
    alert('Complaint assigned successfully!');
  } else {
    console.error('Assignment failed:', data.message);
    alert(data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Admin: Update Complaint Status

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/admin/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    complaintId: 1,
    status: 'resolved' // 'pending', 'in_review', or 'resolved'
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('Status updated:', data.data.complaint);
  } else {
    console.error('Update failed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Agency: Get Assigned Complaints

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/agency/complaints', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('Assigned complaints:', data.data.complaints);
    // Display in agency dashboard
  } else {
    console.error('Failed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

### Agency: Update Complaint Status

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3000/api/agency/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    complaintId: 1,
    status: 'resolved' // 'in_review' or 'resolved'
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('Status updated:', data.data.complaint);
  } else {
    console.error('Update failed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The token is obtained from the login or register endpoints and should be stored in localStorage or sessionStorage.

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ Role-based access control (citizen, admin, agency)
- ✅ CORS enabled for frontend communication
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (using parameterized queries)

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `fullname` - User's full name
- `email` - Unique email address
- `password` - Hashed password (bcrypt)
- `role` - Enum: 'citizen', 'admin', 'agency'
- `created_at` - Timestamp

### Complaints Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Complaint title
- `description` - Complaint description
- `status` - Enum: 'pending', 'in_review', 'resolved'
- `assigned_agency_id` - Foreign key to agencies (nullable)
- `created_at` - Timestamp

### Agencies Table
- `id` - Primary key
- `name` - Agency name
- `email` - Agency email (used to link with users)
- `created_at` - Timestamp

## 🔧 Environment Variables

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=citizenvoice
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5500
```

## 🐛 Troubleshooting

### Database Connection Error
- Ensure XAMPP MySQL is running
- Check database credentials in `.env`
- Verify database `citizenvoice` exists

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using port 3000

### CORS Errors
- Update `CORS_ORIGIN` in `.env` to match your frontend URL
- Default is `http://localhost:5500` (VS Code Live Server)

### JWT Token Errors
- Ensure token is sent in Authorization header with "Bearer " prefix
- Check if token has expired (default: 7 days)
- Verify JWT_SECRET matches

## 📝 Notes

- Agency users must have an email that matches an agency email in the `agencies` table
- When creating an agency user, first create the agency, then register a user with that email and role 'agency'
- Admin users can be created by registering with role 'admin' (or update existing user in database)

## 🚀 Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong random string
2. Set `NODE_ENV=production`
3. Use strong database passwords
4. Enable HTTPS
5. Set up proper CORS origins
6. Use environment variables for all sensitive data
7. Consider rate limiting
8. Set up proper logging
9. Use a process manager like PM2

---

**Built with ❤️ for CitizenVoice**

