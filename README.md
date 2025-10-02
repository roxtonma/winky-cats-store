# Winky Store site

A simple online store built with Next.js and Supabase. Ready for Qikink integration.

## Getting Started

1. Clone this repo
2. Run `npm install`
3. Copy your Supabase credentials to `.env.local`
4. Run `npm run dev`
5. Visit http://localhost:3000

## Adding Products

### Method 1: Through Supabase Dashboard
- Go to your Supabase project
- Click "Table Editor"
- Find the "products" table
- Click "Insert row"
- Fill in the details and save

### Method 2: Import from CSV
- Prepare a CSV with your product data
- Go to Supabase > Table Editor > products
- Click the three dots > Import data via CSV

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

## Deploying Updates

1. Make your changes
2. Push to GitHub
3. Vercel deploys automatically

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
