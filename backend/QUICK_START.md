# Quick Start Guide - Smart Food Pre-Order Backend

## 🚀 Get Started in 5 Minutes

### Prerequisites

Make sure you have:
- ✅ Node.js v18+ installed
- ✅ npm or yarn
- ✅ A Supabase account (free tier works)
- ✅ A Razorpay account in test mode (optional for payment testing)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready (~2 minutes)

### Step 3: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase_schema.sql`
4. Paste into the editor
5. Click "Run" to execute

This creates:
- All 16 tables
- Indexes for performance
- Triggers for automation
- RLS policies for security
- Views for complex queries

### Step 4: Configure Environment

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Fill in your Supabase credentials:

```env
# Get these from Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Generate a random secret for JWT
JWT_SECRET=your_random_secret_key_here

# Razorpay (optional - for payment testing)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# Other settings (defaults are fine)
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Step 5: Run the Server

```bash
# Development mode with hot reload
npm run dev
```

You should see:

```
╔═══════════════════════════════════════════════════════╗
║   Smart Food Pre-Order Backend Server                ║
║                                                       ║
║   Environment: development                            ║
║   Port:        5000                                   ║
║   API Version: v1                                     ║
║                                                       ║
║   Status:      🚀 Server is running!                  ║
╚═══════════════════════════════════════════════════════╝
```

### Step 6: Test the API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Send OTP (use your phone number)
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'
```

## ✅ You're All Set!

The backend is now running and ready to accept requests.

## 📚 Next Steps

1. **Read the API Documentation**: Check `API_DOCUMENTATION.md` for all endpoints
2. **Import to Postman**: Use the examples in the docs to test APIs
3. **Create Test Data**: Use admin APIs to add vendors and menu items
4. **Connect Frontend**: Point your React app to `http://localhost:5000/api/v1`

## 🔧 Common Issues

### Port Already in Use

```bash
# Change PORT in .env file
PORT=5001
```

### Supabase Connection Error

- Check if SUPABASE_URL and keys are correct
- Make sure the Supabase project is active
- Verify internet connection

### OTP Not Receiving

- Configure phone auth in Supabase dashboard
- Set up SMS provider (Twilio/MessageBird)
- Check phone number format (10 digits, Indian number)

## 🎯 Creating Your First Vendor

After the server is running, you'll need an admin account to create vendors and menu items.

### Option 1: Via Database

1. Go to Supabase Dashboard > Table Editor
2. Open `users` table
3. Find your user (created after OTP login)
4. Change `role` from `USER` to `ADMIN`

### Option 2: Via SQL

```sql
-- Run in Supabase SQL Editor
UPDATE users 
SET role = 'ADMIN' 
WHERE phone_number = '9876543210';
```

Now you can use admin APIs to create vendors and menu items!

## 📊 Testing with Sample Data

Use the admin APIs to populate your database:

```bash
# Create a vendor (requires admin token)
curl -X POST http://localhost:5000/api/v1/vendors \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tasty Bites",
    "phone_number": "9876543211",
    "opening_time": "09:00",
    "closing_time": "22:00"
  }'

# Create a menu item
curl -X POST http://localhost:5000/api/v1/menu \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "your_vendor_id",
    "name": "Paneer Butter Masala",
    "price": 250,
    "food_type": "VEG",
    "stock_quantity": 50
  }'
```

## 🔍 Monitoring Logs

Check logs in the `logs/` directory:

```bash
# View all logs
tail -f logs/combined.log

# View only errors
tail -f logs/error.log
```

## 🚀 Production Deployment

When ready to deploy:

1. Set `NODE_ENV=production` in environment
2. Use production Supabase project
3. Use production Razorpay keys
4. Set strong JWT_SECRET
5. Configure proper CORS_ORIGIN
6. Deploy to Railway, Render, or Heroku

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- See `API_DOCUMENTATION.md` for API reference
- Review `supabase_schema.sql` for database structure
- Contact: dev@smartfoodorder.com

---

**Happy Coding! 🎉**
