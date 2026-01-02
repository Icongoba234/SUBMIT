# Agency User Linking System

## Overview
Agency users are now properly linked to their agency records in the database. This allows agency users to:
- Access their specific agency dashboard
- View only complaints assigned to their agency
- See their agency information throughout the application

## Database Changes

### Migration
The `users` table now includes an `agency_id` column that links agency users to their agency:

```sql
ALTER TABLE users 
ADD COLUMN agency_id INT NULL AFTER role,
ADD FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
```

## Setup Instructions

### 1. Run the Migration
```bash
cd backend
node migrate_add_agency_id.js
```

This will:
- Add the `agency_id` column to the `users` table
- Link existing agency users to agencies (by email match, or first available agency)

### 2. Link Existing Agency Users
If you have agency users that aren't linked:

```bash
node link_agency_user.js
```

This script will:
- Find all agency users without an `agency_id`
- Link them to agencies (by email match, or first available)

### 3. Create New Agency Users
When creating new agency users, use:

```bash
node create_agency_user.js
```

This script now automatically links the new user to the first available agency.

## API Changes

### New Endpoint
- `GET /api/agency/info` - Get agency information for the logged-in agency user

### Updated Endpoints
- `POST /api/auth/login` - Now includes `agency_id` and `agency` object in response for agency users
- `GET /api/agency/complaints` - Uses `agency_id` from user record instead of email matching
- `PATCH /api/agency/status` - Uses `agency_id` from user record

## Frontend Changes

### Agency Dashboard
The agency dashboard now:
- Displays the agency name in the header
- Shows agency information in the user profile section
- Updates the dashboard title to include the agency name
- Loads agency info on page load via `/api/agency/info`

## How It Works

1. **User Registration/Login**: When an agency user logs in, the system includes their `agency_id` and agency details in the response.

2. **Agency Dashboard Access**: The dashboard loads agency information and displays it throughout the interface.

3. **Complaint Filtering**: Agency users can only see complaints assigned to their specific agency (via `assigned_agency_id` matching their `agency_id`).

4. **Status Updates**: Agency users can only update complaints assigned to their agency.

## Troubleshooting

### Agency User Not Linked
If an agency user can't access their dashboard or sees "Agency not linked":

1. Run the linking script:
   ```bash
   node link_agency_user.js
   ```

2. Or manually link in the database:
   ```sql
   UPDATE users 
   SET agency_id = [AGENCY_ID] 
   WHERE id = [USER_ID] AND role = 'agency';
   ```

### No Agencies Available
If you need to create agencies:

1. Use the sample agencies script:
   ```bash
   node insert_sample_agencies.js
   ```

2. Or manually insert in phpMyAdmin:
   ```sql
   INSERT INTO agencies (name, email) 
   VALUES ('Agency Name', 'agency@email.com');
   ```

## Files Modified

- `backend/sql/add_agency_id_to_users.sql` - SQL migration script
- `backend/migrate_add_agency_id.js` - Migration runner
- `backend/link_agency_user.js` - Script to link existing users
- `backend/create_agency_user.js` - Updated to auto-link agencies
- `backend/controllers/agency.controller.js` - Uses `agency_id` relationship
- `backend/controllers/auth.controller.js` - Includes agency info in login
- `backend/routes/agency.routes.js` - Added `/info` endpoint
- `pages/agency_dashboard.html` - Displays agency information

