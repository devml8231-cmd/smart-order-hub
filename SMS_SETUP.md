# Environment Variables for Twilio SMS Integration

Add the following environment variables to your `.env` file to enable SMS notifications:

```bash
# SMS Service Configuration (optional - defaults to main server)
VITE_SMS_SERVICE_URL=http://localhost:3000

# Twilio Configuration (for backend service)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Setup Instructions

### 1. Create a Twilio Account
Sign up at https://www.twilio.com/try-twilio

### 2. Get a Twilio Phone Number
- Go to Twilio Console > Phone Numbers > Buy a Number
- Choose a number with SMS capabilities
- For Indian numbers, you may need additional verification

### 3. Find Your Credentials
- Account SID: Available in Twilio Console > Home
- Auth Token: Available in Twilio Console > Home (click "show" to reveal)

### 4. Update Environment Variables
Copy your Account SID, Auth Token, and Twilio phone number to your `.env` file as shown above

### 5. Start the Server
The SMS functionality is now integrated into your main server. Simply start your server with:

```bash
node backend/server.cjs
```

The server will run on port 3000 and handle all API requests including SMS notifications.

### 6. Test SMS Functionality
You can test the SMS service by:
- Using the test page at `/sms-test` (if you add the route)
- Or calling the health endpoint: `http://localhost:3000/api/sms/health`

## Architecture

The SMS system now uses an **integrated backend architecture**:

1. **Frontend** (`src/services/sms.ts`): Makes HTTP requests to the main server
2. **Main Server** (`backend/server.cjs`): Handles all API requests including SMS sending
3. **Twilio API**: Actually sends the SMS messages

This approach avoids browser compatibility issues with the Twilio SDK and keeps your credentials secure on the server side.

## SMS Features

The system now sends SMS notifications for:

1. **Order Confirmation**: When an order is successfully placed
   - Includes token number, wait time, total amount, and item count
   - Sent to the phone number provided during checkout

2. **Order Ready**: When the order status changes to "READY"
   - Notifies the customer that their order is ready for pickup
   - Includes token number for easy collection

## API Endpoints

The SMS service provides the following endpoints:

- `POST /api/sms/order-confirmation` - Send order confirmation SMS
- `POST /api/sms/order-ready` - Send order ready notification
- `POST /api/sms/test` - Send test SMS
- `GET /api/sms/health` - Check service health and Twilio configuration

## Important Notes

- Phone numbers are automatically formatted to Indian format (+91)
- SMS failures won't prevent order completion (graceful fallback)
- Check browser console for SMS delivery status
- Check SMS service console for detailed error logs
- Twilio charges apply for each SMS sent
- Ensure your Twilio account has sufficient balance

## Troubleshooting

If SMS notifications aren't working:

1. **Check Server Status**: 
   - Verify the main server is running: `http://localhost:3000/api/sms/health`
   - Check the server console for errors

2. **Verify Environment Variables**:
   - Ensure all Twilio credentials are set correctly in `.env`
   - Check that `VITE_SMS_SERVICE_URL` matches the service URL

3. **Network Issues**:
   - Ensure the main server port (3000) is not blocked
   - Check CORS settings if running from different domains

4. **Twilio Issues**:
   - Verify your Twilio account has SMS capabilities enabled
   - Ensure the phone number is in valid format (10 digits for India)
   - Check Twilio account balance and permissions

5. **Browser Console**: Check for frontend API call errors
6. **Server Console**: Check the main server terminal for backend errors

## Development Workflow

1. Start the main server: `node backend/server.cjs`
2. Start your frontend application: `npm run dev`
3. Test SMS functionality using the test page or direct API calls
4. Monitor both browser console and server console for any issues
