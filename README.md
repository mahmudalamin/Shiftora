# Rota - Staff Scheduling Mobile App

A React Native mobile application for managing work rotas/schedules with role-based access for Admins and Staff.

## Tech Stack

- **Frontend:** React Native (bare/CLI)
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL (local)
- **Auth:** JWT tokens
- **State Management:** Redux Toolkit

## Features

### Admin (Manager)
- Create/update/delete rota schedules
- Assign shifts to staff
- Approve or reject swap requests
- View full rota calendar
- Manage staff accounts

### Staff
- View own rota
- View team rota (read-only)
- Request shift swap with another staff member
- Accept or decline swap requests
- Get notifications for changes

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running
- Android Studio (for Android) or Xcode (for iOS)
- React Native CLI environment setup

### 1. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE rota_db;
```

### 2. Backend Setup

```bash
cd D:\rota\backend

# Install dependencies
npm install

# Configure environment
# Edit .env file with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=rota_db
# DB_USER=postgres
# DB_PASSWORD=your_password

# Seed the database with sample data
npm run db:seed

# Start the server
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Mobile App Setup

```bash
cd D:\rota\mobile

# Install dependencies
npm install

# Update API URL (if needed)
# Edit src/utils/constants.ts and update API_BASE_URL:
# - Android emulator: http://10.0.2.2:3000/api
# - iOS simulator: http://localhost:3000/api
# - Physical device: http://YOUR_COMPUTER_IP:3000/api

# Start Metro bundler
npm start

# Run on Android (in another terminal)
npm run android

# Run on iOS (Mac only)
npm run ios
```

## Test Credentials

After running the seed script:

| Role  | Email           | Password  |
|-------|-----------------|-----------|
| Admin | admin@rota.com  | admin123  |
| Staff | john@rota.com   | staff123  |
| Staff | jane@rota.com   | staff123  |
| Staff | bob@rota.com    | staff123  |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all staff
- `POST /api/users` - Create staff account
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Shifts
- `GET /api/shifts` - List shift types
- `POST /api/shifts` - Create shift type (admin)
- `PUT /api/shifts/:id` - Update shift (admin)
- `DELETE /api/shifts/:id` - Delete shift (admin)

### Rotas
- `GET /api/rotas` - Get all rotas (admin)
- `GET /api/rotas/my` - Get own rota (staff)
- `GET /api/rotas/team` - Get team rota (staff)
- `POST /api/rotas` - Create rota entry (admin)
- `PUT /api/rotas/:id` - Update rota (admin)
- `DELETE /api/rotas/:id` - Delete rota (admin)

### Swap Requests
- `GET /api/swaps` - List swap requests
- `POST /api/swaps` - Create swap request (staff)
- `PUT /api/swaps/:id/respond` - Accept/decline (target staff)
- `PUT /api/swaps/:id/approve` - Approve/reject (admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Project Structure

```
D:\rota\
├── backend/
│   ├── src/
│   │   ├── config/         # Database & JWT config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # DB seed scripts
│   │   └── index.js        # Entry point
│   ├── .env
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── api/            # API service layer
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── navigation/     # React Navigation
│   │   ├── screens/        # Screen components
│   │   ├── store/          # Redux store & slices
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Constants & helpers
│   ├── App.tsx
│   ├── index.js            # Entry point
│   └── package.json
│
└── README.md
```

## Swap Request Workflow

1. **Staff A** requests to swap their shift with **Staff B**
2. **Staff B** receives notification and can accept/decline
3. If accepted, **Admin** receives notification for final approval
4. **Admin** can approve/reject the swap
5. If approved, shifts are automatically swapped
6. Both staff members receive notification of the final decision
"# Shiftora" 
