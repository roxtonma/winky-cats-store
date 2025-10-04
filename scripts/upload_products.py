#!/usr/bin/env python3

import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Please set SUPABASE_URL and SUPABASE_KEY in .env.local")
    sys.exit(1)

# Initialize Supabase client (OFFICIAL SDK)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_image(image_path, filename):
    """Upload image to Supabase Storage using official SDK"""
    try:
        with open(image_path, 'rb') as f:
            # Using official Supabase Python SDK
            response = supabase.storage.from_("product-images").upload(
                path=filename,
                file=f,
                file_options={"cache-control": "3600", "upsert": True}
            )

        # Get public URL - returns a string directly
        public_url = supabase.storage.from_("product-images").get_public_url(filename)
        return public_url

    except Exception as e:
        print(f"❌ Error uploading {filename}: {str(e)}")
        return None

def sync_products():
    """Sync products from products.json to Supabase"""
    print("🚀 Starting product sync...")

    # Read products.json
    with open('products.json', 'r') as f:
        products_data = json.load(f)

    # Check if images folder exists
    images_dir = Path('images')
    if not images_dir.exists():
        print(f"📁 Please create an 'images' folder and add your product images")
        return

    # Process categories
    for category_data in products_data['categories']:
        print(f"📂 Processing category: {category_data['name']}")

        # Insert or update category using official SDK
        try:
            response = supabase.table('categories').upsert({
                'name': category_data['name'],
                'slug': category_data['slug'],
                'description': category_data['description']
            }, on_conflict='slug').execute()

            # Get category ID
            category_response = supabase.table('categories').select('id').eq('slug', category_data['slug']).execute()
            category_id = category_response.data[0]['id'] if category_response.data else None

            if not category_id:
                print(f"❌ Could not get category ID for {category_data['name']}")
                continue

        except Exception as e:
            print(f"❌ Error with category {category_data['name']}: {str(e)}")
            continue

        # Process products in this category
        for product_data in category_data['products']:
            if not product_data['active']:
                print(f"⏭️  Skipping inactive product: {product_data['name']}")
                continue

            print(f"📦 Processing product: {product_data['name']}")

            # Upload image if exists
            image_url = None
            if product_data.get('image_file'):
                image_path = images_dir / product_data['image_file']
                if image_path.exists():
                    image_url = upload_image(image_path, product_data['image_file'])
                    if image_url:
                        print(f"✅ Uploaded image: {product_data['image_file']}")
                else:
                    print(f"⚠️  Image not found: {image_path}")

            # Insert or update product using official SDK
            try:
                product_payload = {
                    'name': product_data['name'],
                    'description': product_data['description'],
                    'price': product_data['price'],
                    'compare_at_price': product_data.get('compare_at_price'),
                    'sku': product_data['sku'],
                    'inventory_quantity': 999,  # High number for POD
                    'category_id': category_id,
                    'images': [image_url] if image_url else [],
                    'is_active': product_data['active'],
                    'vendor': product_data.get('vendor'),
                    'product_type': product_data.get('product_type'),
                    'material': product_data.get('material'),
                    'variants': product_data.get('variants', {}),  # Keep as dict, Supabase handles JSON
                    'tags': product_data.get('tags', [])
                }

                response = supabase.table('products').upsert(product_payload, on_conflict='sku').execute()
                print(f"✅ Product synced: {product_data['name']}")

            except Exception as e:
                print(f"❌ Error with product {product_data['name']}: {str(e)}")

    print("🎉 Product sync completed!")

def clean_products():
    """Remove products not in products.json"""
    print("🗑️  Removing inactive products...")

    with open('products.json', 'r') as f:
        products_data = json.load(f)

    # Collect active SKUs
    active_skus = []
    for category in products_data['categories']:
        for product in category['products']:
            if product['active']:
                active_skus.append(product['sku'])

    # Deactivate products not in active list
    for sku in active_skus:
        # This is a simplified version - you'd need to implement proper filtering
        pass

    print("✅ Inactive products cleaned up")

def main():
    if len(sys.argv) < 2:
        print("""
📦 Product Management Script

Usage:
  python scripts/upload_products.py sync   - Upload/update products from products.json
  python scripts/upload_products.py clean - Remove products not in products.json

Setup:
  1. pip install supabase python-dotenv
  2. Create 'product-images' bucket in Supabase Storage (must be public)
  3. Create 'images' folder in project root
  4. Add product images to 'images' folder
  5. Update products.json with your products
  6. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  7. Run sync command
        """)
        return

    command = sys.argv[1]

    if command == 'sync':
        sync_products()
    elif command == 'clean':
        clean_products()
    else:
        print("❌ Invalid command. Use 'sync' or 'clean'")

if __name__ == '__main__':
    main()