# Smart Food Pre-Order System - Backend API Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Real-time Features](#real-time-features)
- [Error Handling](#error-handling)

## 🎯 Overview

This is the backend API for the Smart Food Pre-Order Web Application with multi-vendor support, real-time order tracking, and AI-driven recommendations.

**Base URL:** `http://localhost:5000/api/v1`

**Technology Stack:**
- Node.js + Express.js + TypeScript
- Supabase (PostgreSQL + Auth + Realtime)
- Razorpay (Payment Gateway)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account
- Razorpay account (test mode)

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Create `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Setup

1. Create a Supabase project
2. Run the SQL migration file:

```bash
# Copy the contents of supabase_schema.sql
# Execute in Supabase SQL Editor
```

### Running the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header.

### Flow:

1. **Send OTP** → User enters phone number
2. **Verify OTP** → User enters OTP, receives access token
3. **Use Token** → Include token in subsequent requests

### Example:

```javascript
// Request headers
{
  "Authorization": "Bearer <your_access_token>",
  "Content-Type": "application/json"
}
```

## 📡 API Endpoints

### Authentication

#### Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone_number": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phone_number": "9876543210"
  },
  "message": "OTP sent successfully"
}
```

#### Verify OTP
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone_number": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone_number": "9876543210",
      "role": "USER"
    },
    "access_token": "jwt_token_here"
  }
}
```

#### Get Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

---

### Vendors

#### Get All Vendors
```http
GET /api/v1/vendors?is_active=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tasty Bites",
      "description": "Best food in town",
      "opening_time": "09:00",
      "closing_time": "22:00",
      "average_prep_time_minutes": 15
    }
  ]
}
```

#### Get Vendor by ID
```http
GET /api/v1/vendors/:vendorId
```

---

### Menu

#### Get Menu Items
```http
GET /api/v1/menu?vendor_id=uuid&page=1&limit=20
```

**Query Parameters:**
- `vendor_id` (optional) - Filter by vendor
- `category_id` (optional) - Filter by category
- `food_type` (optional) - VEG | NON_VEG | VEGAN | UPWAS
- `is_special` (optional) - true | false
- `is_best_seller` (optional) - true | false
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Paneer Butter Masala",
        "price": 250,
        "discount_price": 200,
        "food_type": "VEG",
        "stock_quantity": 50,
        "is_available": true,
        "average_rating": 4.5,
        "total_orders": 120
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Search Menu Items
```http
GET /api/v1/menu/search?q=paneer&vendor_id=uuid
```

#### Get Recommendations
```http
GET /api/v1/menu/recommendations?vendor_id=uuid
Authorization: Bearer <token> (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "personalized": [...],
    "best_sellers": [...],
    "today_special": [...],
    "based_on_time": [...]
  }
}
```

---

### Orders

#### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendor_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "special_instructions": "Less spicy"
    }
  ],
  "pickup_time": "2026-02-02T18:30:00Z",
  "special_instructions": "Call when ready",
  "group_order_id": "uuid" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "token_number": 42,
      "status": "PLACED",
      "total_amount": 500,
      "final_amount": 500
    },
    "token_number": 42,
    "queue_position": 3,
    "estimated_ready_time": "2026-02-02T18:15:00Z"
  },
  "message": "Order created successfully"
}
```

#### Get User Orders
```http
GET /api/v1/orders?page=1&limit=20&status=PLACED
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/v1/orders/:orderId
Authorization: Bearer <token>
```

#### Cancel Order
```http
POST /api/v1/orders/:orderId/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancellation_reason": "Changed mind"
}
```

#### Get Token Status (Real-time)
```http
GET /api/v1/orders/:orderId/token-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token_number": 42,
    "status": "READY",
    "queue_position": 0,
    "estimated_time_minutes": 0,
    "is_ready": true,
    "should_blink": true
  }
}
```

---

### Payments

#### Create Payment Order
```http
POST /api/v1/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": "uuid",
  "amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpay_order_id": "order_xxx",
    "amount": 50000,
    "currency": "INR",
    "key_id": "rzp_test_xxx"
  }
}
```

#### Verify Payment
```http
POST /api/v1/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

---

### Group Orders

#### Create Group Order
```http
POST /api/v1/group-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendor_id": "uuid",
  "group_name": "Office Lunch",
  "pickup_time": "2026-02-02T13:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "shared_code": "ABC12345",
    "group_name": "Office Lunch",
    "is_locked": false
  }
}
```

#### Join Group Order
```http
GET /api/v1/group-orders/join/:groupCode
```

#### Lock Group Order
```http
POST /api/v1/group-orders/:groupId/lock
Authorization: Bearer <token>
```

---

### Reviews & Favorites

#### Create Review
```http
POST /api/v1/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": "uuid",
  "menu_item_id": "uuid",
  "rating": 5,
  "comment": "Excellent food!",
  "is_anonymous": false
}
```

#### Get Menu Item Reviews
```http
GET /api/v1/reviews/menu-item/:itemId?page=1&limit=20
```

#### Add to Favorites
```http
POST /api/v1/reviews/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "menu_item_id": "uuid"
}
```

#### Get User Favorites
```http
GET /api/v1/reviews/favorites
Authorization: Bearer <token>
```

#### Remove from Favorites
```http
DELETE /api/v1/reviews/favorites/:itemId
Authorization: Bearer <token>
```

---

### Admin APIs

All admin routes require `ADMIN` role.

#### Update Order Status
```http
PUT /api/v1/admin/orders/:orderId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "PREPARING"
}
```

**Status Values:** `PLACED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`

#### Get Order Queue
```http
GET /api/v1/admin/orders/queue?vendor_id=uuid&date=2026-02-02
Authorization: Bearer <admin_token>
```

#### Get Analytics
```http
GET /api/v1/admin/analytics?vendor_id=uuid&start_date=2026-02-01&end_date=2026-02-28
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_orders": 150,
    "total_revenue": 75000,
    "average_order_value": 500,
    "best_selling_items": [...],
    "peak_hours": [...],
    "user_feedback_summary": {
      "average_rating": 4.5,
      "total_reviews": 80
    }
  }
}
```

#### Manage Surplus Food
```http
POST /api/v1/admin/surplus-food
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "menu_item_id": "uuid",
  "surplus_quantity": 20,
  "discount_percentage": 30
}
```

#### Get Idle Time Slots
```http
GET /api/v1/admin/idle-slots?vendor_id=uuid&date=2026-02-02
Authorization: Bearer <admin_token>
```

#### Create Menu Item
```http
POST /api/v1/menu
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "vendor_id": "uuid",
  "category_id": "uuid",
  "name": "Special Thali",
  "description": "Complete meal",
  "price": 200,
  "food_type": "VEG",
  "stock_quantity": 50,
  "preparation_time_minutes": 20
}
```

#### Update Stock
```http
POST /api/v1/menu/:itemId/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "quantity": 100,
  "reason": "Restocked"
}
```

---

## 🔄 Real-time Features

### Supabase Realtime Subscriptions

Subscribe to real-time updates for:

1. **Order Status Changes**
2. **Token Status Updates**
3. **Stock Updates**

**Client-side example:**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to order updates
const orderSubscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order updated:', payload.new);
    }
  )
  .subscribe();

// Subscribe to token updates
const tokenSubscription = supabase
  .channel('tokens')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'tokens' },
    (payload) => {
      console.log('Token updated:', payload.new);
    }
  )
  .subscribe();
```

---

## ⚠️ Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // Only in development
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - 100 requests per 15 minutes
- **CORS** - Configured origins
- **JWT Authentication** - Supabase Auth
- **Row Level Security** - Database level
- **Input Validation** - express-validator
- **SQL Injection Prevention** - Parameterized queries

---

## 📊 API Rate Limits

- **Public Endpoints:** 100 requests / 15 minutes
- **Authenticated Endpoints:** 100 requests / 15 minutes
- **Admin Endpoints:** No limit

---

## 🧪 Testing

```bash
# Example using curl
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'
```

---

## 📝 Postman Collection

Import the API into Postman:

1. Base URL: `http://localhost:5000/api/v1`
2. Add environment variable: `token` for authentication
3. Use Bearer Token authentication type

---

## 🤝 Support

For issues or questions:
- Check the logs in `backend/logs/`
- Review database schema in `supabase_schema.sql`
- Contact: dev@smartfoodorder.com

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-02
