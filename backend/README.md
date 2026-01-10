# Kashout Backend API

Backend API for Kashout Shipment Management System built with Node.js, Express, and MongoDB.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management
- 📦 Shipment Management
- 💰 Wallet & Transactions
- 📊 Admin Dashboard
- 📝 Activity Logging
- 🔄 Real-time Updates (Socket.io)
- 📤 Data Export (Excel/PDF)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

- MongoDB connection string
- JWT secrets
- Admin credentials
- Other settings

4. Start MongoDB (if running locally):

```bash
mongod
```

5. Run the server:

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Shipments

- `POST /api/shipments` - Create shipment
- `GET /api/shipments` - Get user shipments
- `GET /api/shipments/:id` - Get shipment by ID
- `GET /api/shipments/track/:trackingNumber` - Track shipment
- `PUT /api/shipments/:id/cancel` - Cancel shipment

### Wallet

- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/deposit` - Deposit to wallet
- `GET /api/wallet/transactions` - Get transactions
- `GET /api/wallet/transactions/:id` - Get transaction by ID

### Admin

- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/shipments` - Get all shipments
- `PUT /api/admin/shipments/:id/status` - Update shipment status
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/activity-logs` - Get activity logs
- `GET /api/admin/export/excel?type=users|shipments` - Export data to Excel

## Default Admin Credentials

Email: admin@kashout.com
Password: Admin@123456

**⚠️ Change these credentials in production!**

## Database Models

### User

- name, email, phone, password
- address, businessType, companyName
- balance (USD, SYP)
- role (user, admin, super-admin)
- isActive, isVerified

### Shipment

- trackingNumber, userId
- sender, receiver
- package details
- service type
- cost, status
- statusHistory

### Transaction

- userId, type, amount, currency
- status, method
- reference, relatedShipment
- balanceBefore, balanceAfter

### ActivityLog

- userId, action, category
- description, metadata
- ipAddress, userAgent

## Socket.io Events

### Server to Client

- `new-shipment` - New shipment created
- `shipment-update-{userId}` - Shipment status updated
- `new-transaction` - New transaction

### Client to Server

- `join-admin` - Join admin room for notifications

## Environment Variables

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kashout
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
ADMIN_EMAIL=admin@kashout.com
ADMIN_PASSWORD=Admin@123456
CORS_ORIGIN=http://localhost:5173
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Request validation
- CORS protection
- Activity logging

## License

ISC
