# Qikink SKU Integration Setup Guide

This guide walks you through fixing the "Invalid SKU" error by implementing proper SKU mapping.

## Overview

The solution stores all 2,668 Qikink SKUs in a database table and maps your product variants (color + size) to the correct Qikink SKUs at order time.

## Step 1: Run the Database Migration

1. Open your Supabase SQL Editor:
   https://app.supabase.co/project/oaxmkxesjpwombjemuum/sql/new

2. Open the file `migrations/consolidated_schema.sql`

3. Copy the entire contents and paste into the SQL editor

4. Click "Run" to apply all schema changes (including the `qikink_products` table)

5. Verify the table was created by running:
   ```sql
   SELECT COUNT(*) FROM qikink_products;
   ```
   (Should return 0 rows)

**Note:** If you've already run the consolidated schema before, you can safely run it again - all statements use `IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS` for idempotency.

## Step 2: Import Qikink SKUs

After the migration completes successfully, run:

```bash
npx ts-node scripts/import-qikink-skus.ts
```

Expected output:
- ✅ Successfully parsed 2668 products
- ✅ Inserted/Updated: 2668
- 📦 132 Product Types imported

If you see errors, check:
- Migration completed successfully
- Environment variables are set in `.env.local`
- Supabase service role key has proper permissions

## Step 3: Map Your Products to Qikink

For each product you sell, you need to set the `qikink_product_type` and optionally `qikink_gender` fields.

### Available Product Types

Run this to see all available product types:
```bash
curl "http://localhost:3000/api/admin/qikink-skus?action=product-types"
```

Example product types:
- `V Neck T-Shirt`
- `Classic Crew T-Shirt`
- `Hoodie`
- `Oversized Hoodie`
- `Polo`
- etc.

### Update Your Products

In your Supabase dashboard, update your products table:

```sql
-- Example: Update a product to use Qikink's "V Neck T-Shirt"
UPDATE products
SET
  qikink_product_type = 'V Neck T-Shirt',
  qikink_gender = 'Male'
WHERE id = 'your-product-id';
```

Or bulk update for similar products:
```sql
-- Update all t-shirts
UPDATE products
SET
  qikink_product_type = 'Classic Crew T-Shirt',
  qikink_gender = 'Male'
WHERE name ILIKE '%t-shirt%';
```

## Step 4: Test SKU Mapping

### Test API Endpoint

Test if a specific variant can be mapped:

```bash
curl -X POST http://localhost:3000/api/admin/qikink-skus \
  -H "Content-Type: application/json" \
  -d '{
    "productType": "V Neck T-Shirt",
    "colorName": "Red",
    "size": "L",
    "gender": "Male"
  }'
```

Expected response:
```json
{
  "success": true,
  "found": true,
  "data": {
    "qikinkSku": "MVnHs-Rd-L",
    "lookupTimeMs": 15
  }
}
```

### Search Available SKUs

Search for available colors/sizes:

```bash
# Get available colors for a product type
curl "http://localhost:3000/api/admin/qikink-skus?action=colors&productType=V%20Neck%20T-Shirt&gender=Male"

# Get available sizes for a product + color
curl "http://localhost:3000/api/admin/qikink-skus?action=sizes&productType=V%20Neck%20T-Shirt&colorName=Red&gender=Male"
```

## Step 5: Test End-to-End Order Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a test order with:
   - Product that has `qikink_product_type` set
   - Variant with `color_name` and `size`

3. Check the console logs when the order is forwarded to Qikink:
   - ✓ Should show: "Mapped to Qikink SKU: MVnHs-Rd-L"
   - ⚠️ Should NOT show: "No Qikink SKU found"

4. Verify in Qikink dashboard that order was accepted

## Troubleshooting

### "No Qikink SKU found" Warning

This means the exact combination of (product_type, color, size) doesn't exist in the Qikink catalog.

**Solutions:**
1. Check available colors: Does "Red" exist, or is it "Maroon"?
2. Check available sizes: Does "L" exist, or only "XL"?
3. Verify `qikink_product_type` exactly matches catalog (case-sensitive)

**Test with API:**
```bash
curl -X POST http://localhost:3000/api/admin/qikink-skus \
  -H "Content-Type: application/json" \
  -d '{
    "productType": "YOUR_PRODUCT_TYPE",
    "colorName": "YOUR_COLOR",
    "size": "YOUR_SIZE"
  }'
```

If `found: false`, the response includes suggestions for available options.

### Color Name Mismatch

Common mismatches:
- Your product: "Red" → Qikink: "Maroon"
- Your product: "Grey" → Qikink: "Grey Melange" or "Charcoal Melange"
- Your product: "Blue" → Qikink: "Navy Blue" or "Royal Blue"

**Solution:** Use the exact color name from Qikink's catalog, or update your product's color names to match.

### Missing qikink_product_type

If you see:
```
⚠️  Missing variant info or qikink_product_type for product abc-123
```

You need to update the product:
```sql
UPDATE products
SET qikink_product_type = 'Classic Crew T-Shirt'
WHERE id = 'abc-123';
```

## File Structure

```
migrations/
  └── consolidated_schema.sql               # Complete database schema (includes qikink_products)

scripts/
  └── import-qikink-skus.ts                # CSV import script

src/
  ├── lib/
  │   ├── qikinkSkuMapper.ts               # SKU lookup functions
  │   ├── qikinkOrderTransformer.ts         # Order transformer (updated)
  │   └── qikinkClient.ts                   # Qikink API client
  └── app/api/
      ├── admin/qikink-skus/route.ts       # Admin API for testing
      └── qikink/forward-order/route.ts    # Order forwarding (updated)

Qikink_skus.csv                             # Source data (2,668 SKUs)
QIKINK_SKU_SETUP.md                         # This guide
```

## Cache Behavior

The SKU mapper includes a 5-minute in-memory cache for performance. If you update the `qikink_products` table, the cache will refresh automatically after 5 minutes, or restart your Next.js server to clear it immediately.

## Support

If you encounter issues:
1. Check console logs for specific error messages
2. Test the SKU mapping API endpoint
3. Verify your product's color/size names match Qikink's catalog
4. Check the `qikink_products` table has data: `SELECT COUNT(*) FROM qikink_products;`
