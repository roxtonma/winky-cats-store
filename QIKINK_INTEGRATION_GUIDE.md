# Qikink Print-on-Demand Integration Guide

## Overview
This integration automatically forwards confirmed orders to Qikink for fulfillment after successful payment. Orders are forwarded asynchronously to avoid delaying the checkout process.

## Setup Instructions

### 1. Run Database Migration
Execute the consolidated schema that includes Qikink fields:

```bash
# Connect to your Supabase database and run:
migrations/consolidated_schema.sql
```

This adds to the orders table:
- `qikink_order_id` - Qikink's internal order ID
- `qikink_forwarded_at` - Timestamp of successful forwarding
- `qikink_error_log` - JSON log of any errors

### 2. Add Environment Variables
Add your Qikink credentials to `.env.local`:

```bash
# Qikink Configuration
QIKINK_CLIENT_ID=your_actual_client_id
QIKINK_CLIENT_SECRET=your_actual_client_secret
QIKINK_API_URL=https://sandbox.qikink.com
```

**For Production:**
```bash
QIKINK_API_URL=https://api.qikink.com
```

**Where to find credentials:**
1. Go to https://dashboard.qikink.com
2. Navigate to **Integration → Custom API** section
3. Copy your **ClientId** (same for sandbox and live)
4. Copy your **Client Secret** (different for sandbox and live)

**Important Notes:**
- The `ClientId` remains the same for both sandbox and production
- The `Client Secret` is different for sandbox vs production environments
- The integration automatically generates access tokens using these credentials
- Access tokens are cached and automatically refreshed when expired

### 3. Configure Products for Qikink

Each product should have the following fields in your database:

```typescript
{
  sku: string              // Product SKU
  vendor: "qikink"         // Vendor identifier
  vendor_product_id: string // Qikink's product SKU (optional)
  design_url: string       // URL to design file (optional)
  images: string[]         // Product mockup images
}
```

**Two Modes:**

**Mode 1: Use Qikink's Product Catalog**
- Set `vendor_product_id` to Qikink's SKU (e.g., "MVnHs-Wh-S")
- Leave `design_url` empty
- Order transformer will set `search_from_my_products: 1`

**Mode 2: Custom Design**
- Provide `design_url` with link to your design
- Order transformer will set `search_from_my_products: 0`
- Defaults to DTG printing (can be customized)

### 4. Test the Integration

**A. Testing with Sandbox:**
1. Keep `QIKINK_API_URL=https://sandbox.qikink.com`
2. Create a test order in your store
3. Complete payment with Razorpay test mode
4. Check logs for "Order forwarded to Qikink"
5. Verify order appears in Qikink sandbox dashboard

**B. Manual Testing:**
```bash
# Forward an existing order manually
curl -X POST http://localhost:3000/api/qikink/forward-order \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-id-here"}'
```

## How It Works

### Order Flow
1. Customer completes payment via Razorpay
2. Payment verification succeeds → order status = "confirmed"
3. Order confirmation email sent to customer
4. **Order automatically forwarded to Qikink** (non-blocking)
5. Qikink processes order and handles fulfillment

### Authentication Flow
The integration uses a two-step authentication process:

1. **Token Generation** (automatic):
   - When an order needs to be forwarded, the system checks if it has a valid access token
   - If no token exists or the token has expired, it calls `POST /api/token` with your `ClientId` and `Client Secret`
   - Qikink returns an `Accesstoken` with an expiration time

2. **Token Usage**:
   - The access token is cached in memory and reused for subsequent requests
   - Tokens are automatically refreshed 1 minute before expiration
   - All API calls use this generated access token in the `Accesstoken` header

**No manual token management needed!** The system handles all token generation and refresh automatically.

### Error Handling
- **Retry Logic**: Failed requests retry 3 times with exponential backoff
- **Error Logging**: All errors logged to `orders.qikink_error_log`
- **Slack Alerts**: Failed forwards trigger Slack notifications (if configured)
- **Manual Retry**: Use the forward-order API to retry failed orders

### Slack Notifications
Configure Slack webhook in `.env.local` to receive alerts:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**You'll receive notifications for:**
- Failed order forwarding with error details
- Validation errors from Qikink API
- Order information for manual retry

## API Endpoints

### POST `/api/qikink/forward-order`
Forwards an order to Qikink for fulfillment.

**Request:**
```json
{
  "orderId": "uuid-of-order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order successfully forwarded to Qikink",
  "orderId": "uuid",
  "orderNumber": "ORD-20250109-0001",
  "qikinkOrderId": "qikink-internal-id"
}
```

**Error Response:**
```json
{
  "error": "Qikink API Error",
  "message": "Error message from Qikink",
  "details": {
    "field": ["validation error"]
  }
}
```

## Files Created

### Core Integration
- `src/types/qikink.ts` - TypeScript types for Qikink API
- `src/lib/qikinkClient.ts` - API client with retry logic
- `src/lib/qikinkOrderTransformer.ts` - Order format transformer

### API Routes
- `src/app/api/qikink/forward-order/route.ts` - Main forwarding endpoint

### Database
- `migrations/003_qikink_integration.sql` - Database schema changes

### Configuration
- `.env.local.example` - Updated with Qikink variables

### Modified Files
- `src/app/api/orders/verify/route.ts` - Added auto-forwarding after payment

## Monitoring & Debugging

### Check Order Status
```sql
SELECT
  order_number,
  qikink_order_id,
  qikink_forwarded_at,
  qikink_error_log
FROM orders
WHERE payment_status = 'paid'
ORDER BY created_at DESC;
```

### Find Failed Orders
```sql
SELECT
  order_number,
  customer_name,
  total_amount,
  qikink_error_log
FROM orders
WHERE payment_status = 'paid'
  AND qikink_order_id IS NULL
  AND qikink_error_log IS NOT NULL;
```

### Retry Failed Orders
```bash
# Get failed order IDs from database, then:
curl -X POST http://localhost:3000/api/qikink/forward-order \
  -H "Content-Type: application/json" \
  -d '{"orderId": "failed-order-id"}'
```

## Production Checklist

- [ ] Run migration 003_qikink_integration.sql
- [ ] Add Qikink credentials to production environment
- [ ] Change QIKINK_API_URL to production URL
- [ ] Configure Slack webhook for error alerts
- [ ] Update product data with correct Qikink SKUs or design URLs
- [ ] Test with a real order in sandbox first
- [ ] Monitor logs after going live
- [ ] Set up dashboard for monitoring failed orders

## Troubleshooting

### Order Not Forwarding
- Check that QIKINK_CLIENT_ID and QIKINK_ACCESS_TOKEN are set
- Verify payment_status = 'paid' in orders table
- Check server logs for errors
- Ensure products have valid SKUs

### Qikink API Errors
- Verify credentials are correct
- Check product SKUs exist in Qikink dashboard
- Ensure design URLs are publicly accessible
- Validate shipping address format

### No Slack Notifications
- Confirm SLACK_WEBHOOK_URL is set
- Test webhook URL manually
- Check Slack app permissions

## Support
- Qikink Documentation: https://rest.docs.qik.dev/
- Qikink Dashboard: https://dashboard.qikink.com
- Qikink Support: Contact through dashboard

## Next Steps (Optional Enhancements)

1. **Webhook Integration**: Implement Qikink webhooks to receive order status updates
2. **Admin Dashboard**: Create UI to view/retry failed Qikink orders
3. **Product Sync**: Build tool to sync product catalog from Qikink
4. **Tracking Updates**: Auto-update orders with tracking info from Qikink
5. **Inventory Sync**: Keep product availability in sync with Qikink
