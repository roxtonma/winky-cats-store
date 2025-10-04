# Product Upload Script

This script uploads products from `products.json` to your Supabase database and handles image uploads to Supabase Storage.

## Prerequisites

1. **Python Dependencies**
   ```bash
   pip install supabase python-dotenv
   ```

2. **Supabase Setup**
   - Create a `product-images` bucket in Supabase Storage
   - Make the bucket **public** (Settings → Make public)
   - Ensure your Supabase project has the `products` and `categories` tables

3. **Environment Variables**
   - Make sure `.env.local` contains:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

## Setup

1. **Create images folder**
   ```bash
   mkdir images
   ```

2. **Add product images**
   - Place your product images in the `images/` folder
   - Make sure image filenames match the `image_file` field in `products.json`

3. **Update products.json**
   - Edit `products.json` with your product information
   - Set `active: true` for products you want to upload

## Usage

### Sync Products
Upload/update all active products from `products.json`:
```bash
python scripts/upload_products.py sync
```

This will:
- Create/update categories
- Upload product images to Supabase Storage
- Create/update products in the database

### Clean Products
Remove inactive products (not fully implemented):
```bash
python scripts/upload_products.py clean
```

## How It Works

1. **Categories**: Creates categories if they don't exist (matched by `slug`)
2. **Images**: Uploads images to the `product-images` bucket (overwrites existing with same filename)
3. **Products**: Creates/updates products (matched by `sku`)

## How Products Render on Site

- **Products Page**: Shows `product.images[0]` (first image in array)
- **Cart**: Shows `item.image` from the first image
- **Variants**: Currently not displayed on frontend (sizes/colors from JSON are stored but not selectable)

## Troubleshooting

**"Upload failed" error**
- Check that `product-images` bucket exists and is public
- Verify image files exist in `images/` folder

**"Could not get category ID" error**
- Check database connection
- Verify `categories` table exists

**"Error with product" error**
- Check that all required fields are in `products.json`
- Verify `products` table schema matches the payload

## Notes

- Images are stored as arrays: `["url"]`
- Inventory is set to 999 by default (good for print-on-demand)
- The `upsert` option allows re-running the script to update existing products
