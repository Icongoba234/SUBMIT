# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Create .env File

Create a `.env` file in the `backend` directory with the following content:

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

**Important:** Change `JWT_SECRET` to a strong random string in production!

## Step 3: Set Up Database

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Import and execute `sql/setup.sql` OR manually run the SQL commands

## Step 4: Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Step 5: Verify

Open http://localhost:3000/api/health in your browser. You should see:

```json
{
  "status": "OK",
  "message": "CitizenVoice API is running",
  "timestamp": "2024-..."
}
```

## Creating Test Users

### Option 1: Register via API

Use the register endpoint from your frontend or Postman:

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "fullname": "Admin User",
  "email": "admin@citizenvoice.com",
  "password": "admin123",
  "role": "admin"
}
```

### Option 2: Direct SQL (for testing)

You can insert users directly in phpMyAdmin, but remember to hash passwords with bcrypt first.

## Troubleshooting

- **Database connection error**: Check if MySQL is running in XAMPP
- **Port 3000 in use**: Change PORT in .env file
- **CORS errors**: Update CORS_ORIGIN in .env to match your frontend URL

