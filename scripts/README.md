# Product Management Script

This script syncs products from `products-config.json` to your Supabase database and handles mockup image uploads to Supabase Storage.

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
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional, for admin operations
     ```

## Setup

1. **Create mockups folder structure**
   ```bash
   mkdir mockups
   ```

2. **Organize product mockups**
   - Create a folder for each product inside `mockups/` (e.g., `mockups/hoodie_fox/`)
   - Add mockup images with the naming pattern: `{View}_{ViewNumber}_c_{ColorId}.jpg`
     - Example: `Front_1_c_1.jpg` (Front view, image 1, color ID 1/White)
     - Example: `Back_1_c_3.jpg` (Back view, image 1, color ID 3/Black)
   - Optionally add `size_chart.jpg` for size reference
   - Optionally add `default.jpg` as a fallback image

3. **Configure products in `products-config.json`**
   - Edit `products-config.json` with your product information
   - Set `active: true` for products you want to sync
   - Specify the `mockup_folder` name for each product

## Config File Structure

The `products-config.json` file organizes products by category with shared defaults:

```json
{
  "categories": {
    "hoodies": {
      "name": "Hoodies",
      "description": "Cozy hoodies with custom designs",
      "defaults": {
        "vendor": "qikink",
        "material": "cotton",
        "product_type": "hoodie",
        "variants": {
          "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
          "price_by_size": {
            "XS": 999,
            "S": 999,
            "M": 999
          }
        }
      },
      "products": [
        {
          "name": "Fox Spirit Hoodie",
          "description": "Mystical fox design",
          "sku": "HOODIE-FOX-001",
          "base_price": 999,
          "mockup_folder": "hoodie_fox",
          "tags": ["animals", "hoodie", "fox"],
          "active": true
        }
      ]
    }
  }
}
```

## Usage

### Sync Products (Recommended)
Upload/update all active products from `products-config.json`:
```bash
python scripts/upload_products.py sync-config
```

This will:
- Create/update categories from the config
- Upload mockup images to Supabase Storage (skips existing files)
- Parse mockup filenames to create color variants
- Create/update products in the database with variants
- Use upsert to update existing products (matched by SKU)

**To sync changes:** Simply edit `products-config.json` and run `sync-config` again. The script will:
- Update product details (name, description, price, etc.)
- Add new products
- Skip re-uploading images that already exist in storage
- Products marked with `active: false` will be skipped

### Other Commands

**List all products:**
```bash
python scripts/upload_products.py list
```

**Add a new product from mockups:**
```bash
python scripts/upload_products.py append mockups/hoodie_fox "Fox Spirit Hoodie" 1299 "Mystical fox design" hoodies "animals,mystical"
```

**Update a product:**
```bash
# Update product tags
python scripts/upload_products.py update <product_id> tags="nature,wildlife,cool"

# Update multiple fields
python scripts/upload_products.py update <product_id> price=999 name="New Name"
```

**Add sizes to a product:**
```bash
python scripts/upload_products.py add-sizes <product_id> "S,M,L,XL,XXL"
```

**Delete a product:**
```bash
python scripts/upload_products.py delete <product_id>
```

**Legacy sync from products.json** (if you still have the old format):
```bash
python scripts/upload_products.py sync
```

## How It Works

1. **Categories**:
   - Reads category definitions from `products-config.json`
   - Creates categories if they don't exist (matched by `slug`)
   - Each category can have default values for all its products

2. **Mockup Images**:
   - Uploads mockups from `mockups/{mockup_folder}/` to Supabase Storage
   - Parses filenames to determine view, color, and order
   - Skips files already in storage for faster syncing
   - Groups images by color ID to create variants

3. **Color Variants**:
   - Automatically creates color variants based on color IDs in filenames
   - Maps color IDs to names and hex values (e.g., `1` = White, `3` = Black)
   - Each color variant gets its own set of images

4. **Products**:
   - Creates/updates products using upsert (matched by `sku`)
   - Merges category defaults with product-specific config
   - Stores variants (colors, sizes, price_by_size) as JSON

## How Products Render on Site

- **Products Page**: Shows `product.images[0]` (first image from first color)
- **Product Detail**: Displays color selector with variants
- **Cart**: Shows selected color's image
- **Size Selection**: Shows available sizes with dynamic pricing
- **Lightbox**: Shows all images for selected color variant

## Syncing Changes

To update products after making changes:

1. **Edit `products-config.json`**:
   - Update product details (name, description, price, tags, etc.)
   - Add new products to a category's `products` array
   - Set `active: false` to skip products without deleting them

2. **Add/update mockups** (if needed):
   - Add new mockup files to `mockups/{product_folder}/`
   - Follow naming convention: `{View}_{Number}_c_{ColorId}.jpg`

3. **Run sync:**
   ```bash
   python scripts/upload_products.py sync-config
   ```

4. **What happens:**
   - Products with existing SKUs are updated with new data
   - New images are uploaded, existing ones are skipped
   - New products are added to the database
   - Changes appear immediately on your site

## Troubleshooting

**"Upload failed" error**
- Check that `product-images` bucket exists and is public
- Verify mockup files exist in `mockups/{mockup_folder}/`
- Ensure filenames follow the naming pattern

**"Could not get category ID" error**
- Check database connection
- Verify `categories` table exists in Supabase

**"No valid mockups found"**
- Check mockup filename format: `{View}_{Number}_c_{ColorId}.jpg`
- Ensure at least one properly named mockup file exists
- Color ID must be in the COLOR_MAP (script line 588)

**"products-config.json not found"**
- Ensure the file is in the project root directory
- Check the filename spelling and extension

## Color ID Reference

The script recognizes these Qikink color IDs:
- `1` - White (#FFFFFF)
- `3` - Black (#000000)
- `4` - Grey (#6b7280)
- `9` - Navy (#1e3a8a)
- `10` - Red (#dc2626)
- `25` - Maroon (#7f1d1d)
- `41` - Olive Green (#6b7c3e)
- `43` - Yellow (#eab308)
- `45` - Pink (#ec4899)
- `49` - Lavender (#c4b5fd)
- `52` - Coral (#ff7f7f)
- `53` - Mint (#98d8c8)
- `54` - Baby Blue (#a7c7e7)

## Notes

- Products are matched by `sku` for updates
- Images are stored as arrays of URLs
- The script uses upsert, so it's safe to re-run multiple times
- Inactive products (`active: false`) are skipped but not deleted
