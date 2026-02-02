# Smart Food Pre-Order System - Backend

A scalable Node.js + Express.js backend system for a multi-vendor food pre-ordering platform with real-time order tracking, AI-driven recommendations, and admin-controlled workflows.

## 🚀 Features

### Core Features
- ✅ **Multi-vendor Architecture** - Support multiple food vendors
- ✅ **Token-based Pre-ordering** - Numeric token system with queue management
- ✅ **Real-time Updates** - Supabase Realtime for order and token status
- ✅ **Smart Recommendations** - AI-driven food suggestions based on user history
- ✅ **Payment Integration** - Razorpay test mode integration
- ✅ **Group Orders** - Share orders with friends and colleagues
- ✅ **Surplus Food Management** - Dynamic discounts on surplus inventory
- ✅ **Reviews & Ratings** - Anonymous and verified purchase reviews

### Technical Features
- 🔐 **Supabase Auth** - Mobile OTP authentication
- 🔒 **Role-based Access Control** - USER and ADMIN roles
- 📊 **Analytics Dashboard** - Sales, best sellers, peak hours analysis
- 🔍 **Smart Search** - Autocomplete with fuzzy matching
- ⏱️ **Dynamic ETA Calculation** - Queue-based preparation time estimation
- 📱 **Mobile-ready API** - RESTful design for mobile apps
- 🚦 **Rate Limiting** - DDoS protection
- 📝 **Comprehensive Logging** - Winston logger with file rotation

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn
- Supabase account
- Razorpay account (test mode)

## 🛠️ Installation

### 1. Clone the repository

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret

CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=debug
REALTIME_ENABLED=true
NOTIFICATION_THRESHOLD_MINUTES=5
```

### 4. Set up Supabase Database

1. Create a new Supabase project
2. Navigate to SQL Editor
3. Copy and execute the contents of `supabase_schema.sql`

This will create:
- All required tables with proper relationships
- Indexes for optimized queries
- Database functions and triggers
- Row Level Security (RLS) policies
- Views for common queries

### 5. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Phone** authentication
3. Configure SMS provider (Twilio/MessageBird)
4. Update redirect URLs if needed

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Server will start at `http://localhost:5000`

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Health Check

```bash
curl http://localhost:5000/api/v1/health
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Environment config
│   │   └── supabase.ts   # Supabase client setup
│   │
│   ├── controllers/      # Route controllers
│   │   ├── authController.ts
│   │   ├── orderController.ts
│   │   ├── menuController.ts
│   │   ├── paymentController.ts
│   │   ├── adminController.ts
│   │   ├── reviewController.ts
│   │   ├── groupOrderController.ts
│   │   └── vendorController.ts
│   │
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication & authorization
│   │   ├── validation.ts # Request validation
│   │   └── errorHandler.ts
│   │
│   ├── routes/          # API routes
│   │   ├── index.ts     # Main router
│   │   ├── authRoutes.ts
│   │   ├── orderRoutes.ts
│   │   ├── menuRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── reviewRoutes.ts
│   │   ├── groupOrderRoutes.ts
│   │   └── vendorRoutes.ts
│   │
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/           # Utility functions
│   │   ├── helpers.ts   # Helper functions
│   │   └── logger.ts    # Winston logger
│   │
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
│
├── logs/                # Log files (auto-generated)
├── supabase_schema.sql  # Database schema
├── API_DOCUMENTATION.md # Complete API docs
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 API Endpoints

### Base URL: `/api/v1`

### Authentication
- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `POST /auth/logout` - Logout

### Vendors
- `GET /vendors` - List vendors
- `GET /vendors/:id` - Get vendor details
- `POST /vendors` - Create vendor (Admin)
- `PUT /vendors/:id` - Update vendor (Admin)

### Menu
- `GET /menu` - List menu items
- `GET /menu/search` - Search items
- `GET /menu/recommendations` - Get recommendations
- `GET /menu/:id` - Get item details
- `POST /menu` - Create item (Admin)
- `PUT /menu/:id` - Update item (Admin)
- `POST /menu/:id/stock` - Update stock (Admin)

### Orders
- `POST /orders` - Create order
- `GET /orders` - List user orders
- `GET /orders/:id` - Get order details
- `POST /orders/:id/cancel` - Cancel order
- `GET /orders/:id/token-status` - Get token status

### Payments
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment
- `GET /payments/:orderId` - Get payment status

### Group Orders
- `POST /group-orders` - Create group order
- `GET /group-orders/join/:code` - Join group order
- `POST /group-orders/:id/lock` - Lock group order
- `GET /group-orders/:id` - Get group order details

### Reviews & Favorites
- `POST /reviews` - Create review
- `GET /reviews/menu-item/:id` - Get item reviews
- `POST /reviews/favorites` - Add to favorites
- `GET /reviews/favorites` - Get favorites
- `DELETE /reviews/favorites/:id` - Remove favorite

### Admin
- `PUT /admin/orders/:id/status` - Update order status
- `GET /admin/orders/queue` - Get order queue
- `GET /admin/analytics` - Get analytics
- `POST /admin/surplus-food` - Manage surplus food
- `GET /admin/idle-slots` - Get idle time slots

**See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed examples.**

## 🗃️ Database Schema

### Key Tables
- **users** - User profiles (extends Supabase Auth)
- **vendors** - Food vendors/restaurants
- **menu_items** - Food items with stock tracking
- **orders** - Customer orders with token numbers
- **order_items** - Items in each order
- **tokens** - Real-time token tracking
- **payments** - Razorpay payment records
- **reviews** - Customer reviews and ratings
- **favorites** - User favorite items
- **group_orders** - Shared group orders
- **surplus_food** - Surplus inventory tracking
- **time_slots** - Peak/idle hour management
- **admin_actions** - Admin activity audit log

### Features
- ✅ Normalized schema with proper foreign keys
- ✅ Indexes on high-traffic queries
- ✅ Soft deletes for data retention
- ✅ Database triggers for automatic updates
- ✅ Row Level Security (RLS) policies
- ✅ Views for complex queries

## 🔐 Authentication Flow

1. User enters phone number
2. Backend sends OTP via Supabase Auth
3. User enters OTP
4. Backend verifies OTP and creates/updates user profile
5. Backend returns JWT access token
6. Client includes token in Authorization header for protected routes

## 🎯 Recommendation Engine

The system provides recommendations based on:

1. **Personalized** - User's past order history
2. **Best Sellers** - Most ordered items globally
3. **Time-based** - Breakfast/lunch/dinner/snacks
4. **Today's Special** - Admin-flagged special items

Algorithm uses SQL-based heuristics (no ML model required).

## 📊 Real-time Features

### Supabase Realtime Integration

Monitor real-time updates for:
- Order status changes
- Token status (WAITING → PREPARING → READY)
- Stock quantity updates
- Queue position updates

### Client-side Implementation

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Subscribe to order updates
supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'orders' },
    (payload) => console.log('Order updated', payload)
  )
  .subscribe();
```

## 💳 Payment Integration

### Razorpay Test Mode

1. Create order → Get `razorpay_order_id`
2. Open Razorpay checkout with order ID
3. Complete payment
4. Verify signature on backend
5. Update payment and order status

**Test Cards:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## 🔒 Security

- **Helmet.js** - Security headers
- **CORS** - Configured allowed origins
- **Rate Limiting** - 100 requests per 15 minutes
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - express-validator
- **SQL Injection Prevention** - Parameterized queries
- **Row Level Security** - Database-level access control
- **Admin Action Logging** - Audit trail for admin activities

## 📈 Scalability

- **Multi-vendor Support** - Vendor-scoped queries
- **Indexed Queries** - Optimized database performance
- **Connection Pooling** - Supabase handles connections
- **Stateless API** - Easy horizontal scaling
- **Caching Ready** - Can add Redis for caching
- **API Versioning** - `/api/v1` for backward compatibility

## 🧪 Testing

```bash
# Test OTP flow
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'

# Check server health
curl http://localhost:5000/api/v1/health
```

## 📝 Logging

Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🚀 Deployment

### Recommended Platforms
- **Railway.app** - Easy Node.js deployment
- **Render** - Free tier available
- **Heroku** - Classic PaaS
- **DigitalOcean App Platform** - Good performance
- **AWS EC2** - Full control

### Environment Variables
Ensure all production environment variables are set:
- Use strong `JWT_SECRET`
- Use production Supabase keys
- Use production Razorpay keys
- Set `NODE_ENV=production`
- Configure proper `CORS_ORIGIN`

## 📖 API Documentation

Complete API documentation with examples available in:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Or generate Swagger docs (future enhancement).

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use meaningful commit messages
3. Add JSDoc comments to functions
4. Update API documentation
5. Test before committing

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions:
- Check logs in `backend/logs/`
- Review `supabase_schema.sql` for database structure
- See `API_DOCUMENTATION.md` for endpoint details
- Contact: dev@smartfoodorder.com

---

**Built with ❤️ by GenSpark AI**

**Version:** 1.0.0  
**Last Updated:** 2026-02-02
