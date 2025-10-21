# Product Sync Workflow

Simple workflow to sync products from `products-config.json` to your Supabase database.

## Quick Start

1. **Edit `products-config.json`** with your product details
2. **Add mockup images** to `mockups/{mockup_folder}/`
3. **Run the sync:** `python scripts/upload_products.py sync-config`

That's it!

## File Structure

```
winky-cats-store/
├── products-config.json          # Your product configurations
├── mockups/
│   └── hoodie_fox/              # Mockup images for each product
│       ├── Front_1_c_1.jpg      # Front view, color ID 1 (White)
│       ├── Front_1_c_10.jpg     # Front view, color ID 10 (Red)
│       ├── Back_2_c_1.jpg       # Back view, color ID 1
│       ├── default.jpg          # (Optional) Default product image
│       └── size_chart.png       # (Optional) Size chart
└── scripts/
    └── upload_products.py       # Sync script
```

## products-config.json Format

### Minimal Example

```json
{
  "defaults": {
    "vendor": "qikink",
    "product_type": "hoodie",
    "material": "cotton-blend",
    "category": "apparel",
    "variants": {
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "price_by_size": {
        "S": 1299,
        "M": 1299,
        "L": 1329,
        "XL": 1359,
        "XXL": 1399
      }
    }
  },
  "products": [
    {
      "name": "Fox Spirit Hoodie",
      "description": "Mystical fox design on premium hoodie",
      "sku": "HOODIE-FOX-001",
      "base_price": 1299,
      "mockup_folder": "hoodie_fox",
      "tags": ["animals", "mystical", "fox"],
      "active": true
    }
  ]
}
```

## Fields Explained

### Defaults Section
These values apply to all products unless overridden:

- `vendor` - Supplier name (e.g., "qikink")
- `product_type` - Type of product (e.g., "hoodie", "t-shirt")
- `material` - Fabric type (e.g., "cotton-blend", "cotton")
- `category` - Category slug for filtering (e.g., "apparel", "hoodies", "t-shirts")
- `variants.sizes` - Available sizes
- `variants.price_by_size` - Price per size

### Product Fields

**Required:**
- `name` - Product name
- `sku` - Unique identifier (e.g., "HOODIE-FOX-001")
- `mockup_folder` - Folder name in `mockups/` directory
- `active` - `true` to sync, `false` to skip

**Optional:**
- `description` - Product description
- `base_price` - Base price (overrides size pricing if no variants)
- `compare_at_price` - Original price for "sale" display
- `tags` - Array of tags for filtering
- Override any defaults by specifying them in the product

## Mockup File Naming

Mockups must follow this pattern: `{View}_{ViewNumber}_c_{ColorID}.{ext}`

**Examples:**
- `Front_1_c_1.jpg` - Front view, color ID 1 (White)
- `Front_1_c_10.jpg` - Front view, color ID 10 (Red)
- `Back_2_c_1.jpg` - Back view, color ID 1 (White)

**Special Files:**
- `default.jpg` - Used as the main product image
- `size_chart.png` - Displayed in product gallery

### Color IDs (Qikink)

| ID | Color | Hex |
|----|-------|-----|
| 1  | White | #FFFFFF |
| 3  | Black | #000000 |
| 4  | Grey | #6b7280 |
| 9  | Navy | #1e3a8a |
| 10 | Red | #dc2626 |
| 25 | Maroon | #7f1d1d |
| 41 | Olive Green | #6b7c3e |
| 43 | Yellow | #eab308 |
| 45 | Pink | #ec4899 |
| 49 | Lavender | #c4b5fd |
| 52 | Coral | #ff7f7f |
| 53 | Mint | #98d8c8 |
| 54 | Baby Blue | #a7c7e7 |

## Workflow

### Adding a New Product

1. Create a folder in `mockups/` with your images:
   ```
   mockups/
   └── hoodie_cat/
       ├── Front_1_c_1.jpg
       ├── Front_1_c_3.jpg
       ├── Back_2_c_1.jpg
       ├── Back_2_c_3.jpg
       └── size_chart.png
   ```

2. Add product to `products-config.json`:
   ```json
   {
     "name": "Cat Lover Hoodie",
     "description": "Adorable cat design",
     "sku": "HOODIE-CAT-001",
     "base_price": 1299,
     "mockup_folder": "hoodie_cat",
     "tags": ["cats", "animals", "cute"],
     "active": true
   }
   ```

3. Run sync:
   ```bash
   python scripts/upload_products.py sync-config
   ```

### Updating a Product

1. Edit the product in `products-config.json`
2. Run sync again - it will upsert based on SKU
3. Changes are reflected immediately

### Deactivating a Product

Set `"active": false` in the config and run sync. The product will be skipped.

## Commands

```bash
# Sync from config (recommended)
python scripts/upload_products.py sync-config

# List all products in database
python scripts/upload_products.py list

# Delete a product
python scripts/upload_products.py delete <product_id>

# Add sizes to existing product
python scripts/upload_products.py add-sizes <product_id> "S,M,L,XL,XXL"
```

## Tips

- **Use defaults** for common fields to avoid repetition
- **SKUs must be unique** - use a consistent naming scheme
- **⚠️ NEVER CHANGE SKUs** - Once set, treat SKUs as permanent IDs (see below)
- **Test with one product** before syncing multiple
- **Keep mockup folders organized** - one folder per product
- **Image quality** - Use high-res mockups (at least 1000px)
- **Colors auto-detected** - Just name files correctly

## ⚠️ Important: SKU Permanence

**SKUs are permanent identifiers. DO NOT change them after creation.**

### Why SKUs Should Never Change:

Images are stored in Supabase Storage using the SKU as the folder name:
- `HOODIE-FOX-001` → Storage folder: `hoodie-fox-001/`
- `TSHIRT-CAT-001` → Storage folder: `tshirt-cat-001/`

**If you change a SKU:**
1.  Script creates a NEW folder with the new SKU
2.  All images are re-uploaded to the new folder
3.  Old folder remains in storage (orphaned files)
4.  Wastes storage space and upload time

### Best Practices:

**Choose SKUs carefully from the start:**
```json
{
  "sku": "HOODIE-FOX-001",  // Good: Clear, descriptive, unique
  "sku": "PRODUCT-001",      // Bad: Not descriptive
  "sku": "TEST",             // Bad: Will want to change later
}
```

**Use a consistent naming scheme:**
```
{PRODUCT_TYPE}-{DESIGN_NAME}-{NUMBER}

Examples:
  HOODIE-FOX-001
  HOODIE-WOLF-001
  TSHIRT-CAT-001
  TSHIRT-CAT-002  (variant/different design)
```

### If You Need to Replace a Product:

**DON'T:** Change the SKU
**DO:** Create a new product with a new SKU

```json
{
  "sku": "HOODIE-FOX-001",
  "active": false  // Deactivate old product
},
{
  "sku": "HOODIE-FOX-002",  // New SKU for replacement
  "active": true
}
```

### Cleanup Orphaned Storage:

If you accidentally changed a SKU and have orphaned files:
1. Go to Supabase Dashboard → Storage → product-images
2. Manually delete the old folder
3. The script doesn't auto-cleanup (safety measure)

## Troubleshooting

**"Mockup directory not found"**
- Check `mockup_folder` matches the actual folder name in `mockups/`

**"No valid color variants found"**
- Ensure filenames follow the pattern: `Front_1_c_1.jpg`
- Check that color IDs are in the filename

**"Failed to upload mockups"**
- Verify Supabase credentials in `.env.local`
- Check Supabase storage bucket "product-images" exists

**Product not showing on site**
- Run `python scripts/upload_products.py list` to verify it synced
- Check `is_active` is true in database
- Clear browser cache
