# Winky Store site

A simple online store built with Next.js and Supabase. Ready for Qikink integration.

## Getting Started

1. Clone this repo
2. Run `npm install`
3. Copy your Supabase credentials to `.env.local`
4. Run `npm run dev`
5. Visit http://localhost:3000

## Recent Updates

**Live Site**: https://winky-cats-store-ckzoauav2-roxtonmas-projects.vercel.app

**Database**:
- URL: https://oaxmkxesjpwombjemuum.supabase.co
- Tables: categories, products, orders, order_items with print-on-demand fields

**Major Features Added**:
- Working shopping cart with localStorage persistence
- Dark pastel theme with proper mobile responsiveness
- 1-hour caching (L1: React Query, L2: Next.js API routes)
- **Color variant selector** - Customers can switch between product colors with visual swatches
- **Product image carousel** - Multiple images per product with navigation arrows
- **Image lightbox** - Click images for full-screen view
- **Enhanced product upload script** - Automatically uploads mockups to Supabase Storage CDN
- **Filtering system** - Filter products by price, tags, and stock availability

**Cart System**:
- Add/remove items, quantity controls, cart icon with count
- Stores in browser, persists between sessions
- Free shipping over ₹1000

**Product Variants**:
- Each product can have multiple color options
- Clicking a color swatch updates the product images
- Color data stored with hex codes for accurate display
- Supports 13+ standard colors (White, Black, Navy, Red, etc.)

## Adding Products

### Method 1: Upload from Mockup Directory (Recommended for POD)
```bash
# Install dependencies
pip install supabase python-dotenv

# Add a product with mockups
python scripts/upload_products.py append mockups/your-product "Product Name" 999 "Description" hoodies "tag1,tag2"

# List all products
python scripts/upload_products.py list

# Delete a product
python scripts/upload_products.py delete <product-id>

# Update product fields
python scripts/upload_products.py update <product-id> price=1299 tags="new,tags"
```

**How it works**:
- Place mockup images in `mockups/product-name/` folder
- Files must follow naming: `Front_1_c_1.jpg`, `Back_2_c_3.jpg` (view_number_c_colorId.jpg)
- Script automatically:
  - Uploads all images to Supabase Storage CDN
  - Groups by color variants
  - Adds size chart if present (name file `size_chart.png`)
  - Creates product with proper variant data

### Method 2: Bulk Upload Script
```bash
python scripts/upload_products.py sync
```
- Edit `products.json` for product data
- Add images to `images/` folder
- Creates Supabase Storage bucket and uploads automatically

### Method 3: Manual via Dashboard
- Supabase > Table Editor > products > Insert row
- Or import CSV data directly

## Managing Categories

Same as products - use the "categories" table in Supabase. Keep it simple:
- Name (what customers see)
- Slug (for URLs, no spaces)
- Description (optional)

## Checking Orders

Orders show up in the "orders" table when customers buy stuff. You can:
- Export to CSV for fulfillment
- Update status (pending → shipped → delivered)
- Add tracking numbers

## Updating Prices

Just edit the "price" field in the products table. The site updates automatically thanks to caching.

## Site Maintenance

### If the site is slow:
- Check Supabase dashboard for database issues
- Restart the Vercel deployment

### If products aren't showing:
- Check the "is_active" field is set to true
- Make sure images URLs are working

### If you get errors:
- Check the browser console (F12)
- Look at Vercel function logs in your dashboard

## File Structure

```
src/
├── app/              # Pages (home, products, cart)
├── lib/              # Database connection
├── hooks/            # Data fetching with caching
├── providers/        # App-wide settings
└── api/              # Server endpoints
```

## Deployment

**Current**: Deployed on Vercel, auto-deploys from GitHub pushes
**Domain**: Using free .vercel.app URL (custom domain can be added later)

Push changes to main branch - Vercel handles the rest.

## Environment Variables

Keep these secret and don't share them:
```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## Caching

The site caches data for 1 hour to keep it fast and reduce database load. If you need immediate updates after changing products, wait an hour or restart the Vercel deployment.

## Integrating with Qikink

The database is ready for Qikink. Key fields:
- `vendor_product_id` - Qikink's product ID
- `vendor_order_id` - Qikink's order ID
- `variants` - Size/color options as JSON
- `production_status` - Printing status from Qikink

## Common Tasks

**Add new product**: Use Supabase dashboard or CSV import
**Change prices**: Edit products table directly
**Track orders**: Check orders table, update status
**Add category**: Insert into categories table
**Take product offline**: Set `is_active` to false

## Support

If something breaks, check:
1. Supabase dashboard for database issues
2. Vercel dashboard for deployment issues
3. Browser console for frontend errors

Most issues are either database connection problems or invalid product data.
