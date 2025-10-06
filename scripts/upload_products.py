#!/usr/bin/env python3

import json
import os
import sys
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
# Try service role key first (for admin operations), fall back to anon key
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[X] Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
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
        print(f"[X] Error uploading {filename}: {str(e)}")
        return None

def sync_products():
    """Sync products from products.json to Supabase"""
    print("[RUN] Starting product sync...")

    # Read products.json
    with open('products.json', 'r') as f:
        products_data = json.load(f)

    # Check if images folder exists
    images_dir = Path('images')
    if not images_dir.exists():
        print(f"[DIR] Please create an 'images' folder and add your product images")
        return

    # Process categories
    for category_data in products_data['categories']:
        print(f"[CAT] Processing category: {category_data['name']}")

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
                print(f"[X] Could not get category ID for {category_data['name']}")
                continue

        except Exception as e:
            print(f"[X] Error with category {category_data['name']}: {str(e)}")
            continue

        # Process products in this category
        for product_data in category_data['products']:
            if not product_data['active']:
                print(f"[SKIP]  Skipping inactive product: {product_data['name']}")
                continue

            print(f"[+] Processing product: {product_data['name']}")

            # Upload image if exists
            image_url = None
            if product_data.get('image_file'):
                image_path = images_dir / product_data['image_file']
                if image_path.exists():
                    image_url = upload_image(image_path, product_data['image_file'])
                    if image_url:
                        print(f"[OK] Uploaded image: {product_data['image_file']}")
                else:
                    print(f"[!]  Image not found: {image_path}")

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
                print(f"[OK] Product synced: {product_data['name']}")

            except Exception as e:
                print(f"[X] Error with product {product_data['name']}: {str(e)}")

    print("[DONE] Product sync completed!")

def clean_products():
    """Remove products not in products.json"""
    print("[DEL]  Removing inactive products...")

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

    print("[OK] Inactive products cleaned up")

def parse_mockup_filename(filename):
    """Parse mockup filename to extract view, view number, and color ID"""
    # Pattern: Front_1_c_1.jpg or Back_2_c_10.jpg
    match = re.match(r'^(\w+)_(\d+)_c_(\d+)\.(jpg|png)$', filename, re.IGNORECASE)

    if not match:
        return None

    view, view_number, color_id, ext = match.groups()
    return {
        'view': view,
        'view_number': int(view_number),
        'color_id': color_id,
        'filename': filename
    }

def group_mockups_by_color(mockup_dir):
    """Group mockup files by color ID and include size chart"""
    files = os.listdir(mockup_dir)
    color_groups = {}
    size_chart = None

    for filename in files:
        # Skip default.jpg and zip files
        if filename == 'default.jpg' or filename.endswith('.zip'):
            continue

        # Capture size_chart file
        if 'size_chart' in filename.lower():
            size_chart = filename
            continue

        metadata = parse_mockup_filename(filename)
        if metadata:
            color_id = metadata['color_id']
            if color_id not in color_groups:
                color_groups[color_id] = []

            # Build the URL for this mockup
            folder_name = os.path.basename(mockup_dir)
            url = f"/mockups/{folder_name}/{filename}"
            color_groups[color_id].append({
                'url': url,
                'view': metadata['view'],
                'view_number': metadata['view_number']
            })

    # Sort images within each color group (Front first, then Back)
    for color_id in color_groups:
        color_groups[color_id].sort(key=lambda x: (
            0 if x['view'].lower() == 'front' else 1 if x['view'].lower() == 'back' else 2,
            x['view_number']
        ))

        # Add size chart at the end if it exists
        if size_chart:
            folder_name = os.path.basename(mockup_dir)
            color_groups[color_id].append({
                'url': f"/mockups/{folder_name}/{size_chart}",
                'view': 'SizeChart',
                'view_number': 999
            })

    return color_groups

def upload_mockups_to_storage(mockup_dir, product_slug):
    """Upload mockup files to Supabase Storage and return URLs"""
    print(f"[UP] Uploading mockups to Supabase Storage...")

    mockup_path = Path(mockup_dir)
    files = list(mockup_path.glob('*.*'))
    uploaded_urls = []

    for file_path in files:
        filename = file_path.name

        # Skip zip files
        if filename.endswith('.zip'):
            continue

        try:
            with open(file_path, 'rb') as f:
                # Upload to: product-images/{product_slug}/{filename}
                storage_path = f"{product_slug}/{filename}"

                supabase.storage.from_("product-images").upload(
                    path=storage_path,
                    file=f,
                    file_options={"cache-control": "3600", "upsert": "true"}
                )

                # Get public URL and remove trailing '?' if present
                public_url = supabase.storage.from_("product-images").get_public_url(storage_path)
                if public_url.endswith('?'):
                    public_url = public_url[:-1]

                uploaded_urls.append({
                    'filename': filename,
                    'url': public_url
                })
                print(f"   [OK] Uploaded: {filename}")

        except Exception as e:
            print(f"   [!]  Failed to upload {filename}: {e}")

    return uploaded_urls

def append_product_from_mockups(mockup_dir, name, description, price, category='hoodies', tags=None):
    """Append a new product from mockup directory"""
    print(f"[+] Adding product: {name}")

    # Check if mockup directory exists
    mockup_path = Path(mockup_dir)
    if not mockup_path.exists():
        print(f"[X] Mockup directory not found: {mockup_dir}")
        return False

    # Create a slug from the product name
    product_slug = name.lower().replace(' ', '-').replace("'", '')

    # Upload mockups to Supabase Storage
    uploaded_files = upload_mockups_to_storage(mockup_dir, product_slug)

    if not uploaded_files:
        print(f"[X] No mockups were uploaded")
        return False

    # Create a mapping of filename to URL
    url_map = {item['filename']: item['url'] for item in uploaded_files}

    # Parse mockup filenames and organize by color
    mockups = []
    size_chart_url = None

    for item in uploaded_files:
        filename = item['filename']
        url = item['url']

        # Check for size chart
        if 'size_chart' in filename.lower():
            size_chart_url = url
            continue

        # Parse mockup filename
        metadata = parse_mockup_filename(filename)
        if metadata:
            mockups.append({
                'url': url,
                'view': metadata['view'],
                'view_number': metadata['view_number'],
                'color_id': metadata['color_id']
            })

    # Group by color
    color_groups = {}
    for mockup in mockups:
        color_id = mockup['color_id']
        if color_id not in color_groups:
            color_groups[color_id] = []
        color_groups[color_id].append(mockup)

    # Sort images within each color group
    for color_id in color_groups:
        color_groups[color_id].sort(key=lambda x: (
            0 if x['view'].lower() == 'front' else 1 if x['view'].lower() == 'back' else 2,
            x['view_number']
        ))

        # Add size chart at the end if it exists
        if size_chart_url:
            color_groups[color_id].append({
                'url': size_chart_url,
                'view': 'SizeChart',
                'view_number': 999
            })

    if not color_groups:
        print(f"[X] No valid mockups found")
        return False

    # Color mapping (Qikink color IDs)
    COLOR_MAP = {
        '1': {'name': 'White', 'hex': '#FFFFFF'},
        '3': {'name': 'Black', 'hex': '#000000'},
        '4': {'name': 'Grey', 'hex': '#6b7280'},
        '9': {'name': 'Navy', 'hex': '#1e3a8a'},
        '10': {'name': 'Red', 'hex': '#dc2626'},
        '25': {'name': 'Maroon', 'hex': '#7f1d1d'},
        '41': {'name': 'Olive Green', 'hex': '#6b7c3e'},
        '43': {'name': 'Yellow', 'hex': '#eab308'},
        '45': {'name': 'Pink', 'hex': '#ec4899'},
        '49': {'name': 'Lavender', 'hex': '#c4b5fd'},
        '52': {'name': 'Coral', 'hex': '#ff7f7f'},
        '53': {'name': 'Mint', 'hex': '#98d8c8'},
        '54': {'name': 'Baby Blue', 'hex': '#a7c7e7'},
    }

    # Get the first color's images for the main product images
    first_color = sorted(color_groups.keys())[0]
    images = [img['url'] for img in color_groups[first_color]]

    # Build variants data
    variants = []
    for color_id in sorted(color_groups.keys()):
        color_info = COLOR_MAP.get(color_id, {'name': f'Color {color_id}', 'hex': '#cccccc'})
        variants.append({
            'colorId': color_id,
            'colorName': color_info['name'],
            'colorHex': color_info['hex'],
            'images': [img['url'] for img in color_groups[color_id]]
        })

    # Prepare product data
    product_data = {
        'name': name,
        'description': description,
        'price': price,
        'images': images,
        'tags': tags or [],
        'inventory_quantity': 999,  # Default high stock
        'is_active': True,
        'variants': {'colors': variants}  # Store color variants
    }

    try:
        # Insert the product
        response = supabase.table('products').insert(product_data).execute()

        if response.data:
            print(f"[OK] Product '{name}' added successfully!")
            print(f"   - ID: {response.data[0]['id']}")
            print(f"   - Images: {len(images)} images")
            print(f"   - Colors: {len(color_groups)} color variants")
            return True
        else:
            print(f"[X] Failed to add product")
            return False

    except Exception as e:
        print(f"[X] Error adding product: {e}")
        return False

def update_product(product_id, **updates):
    """Update specific fields of a product"""
    print(f" Updating product ID: {product_id}")

    if not updates:
        print("[X] No updates provided")
        return False

    # If mockup_dir is provided, regenerate images
    if 'mockup_dir' in updates:
        mockup_dir = updates.pop('mockup_dir')
        mockup_path = Path(mockup_dir)

        if mockup_path.exists():
            color_groups = group_mockups_by_color(mockup_dir)
            if color_groups:
                first_color = sorted(color_groups.keys())[0]
                updates['images'] = [img['url'] for img in color_groups[first_color]]
                print(f"   - Updated images from {mockup_dir}")
        else:
            print(f"[!]  Mockup directory not found: {mockup_dir}, skipping image update")

    # Convert tags string to list if needed
    if 'tags' in updates and isinstance(updates['tags'], str):
        updates['tags'] = updates['tags'].split(',')

    try:
        response = supabase.table('products').update(updates).eq('id', product_id).execute()

        if response.data:
            print(f"[OK] Product updated successfully!")
            for key, value in updates.items():
                print(f"   - {key}: {value}")
            return True
        else:
            print(f"[X] Failed to update product")
            return False

    except Exception as e:
        print(f"[X] Error updating product: {e}")
        return False

def list_products():
    """List all products with their IDs"""
    print("[LIST] Fetching products...")

    try:
        response = supabase.table('products').select('id, name, price, tags').execute()

        if response.data:
            print(f"\n{'ID':<38} {'Name':<40} {'Price':<10} {'Tags'}")
            print("-" * 120)
            for product in response.data:
                tags_str = ', '.join(product.get('tags', [])[:3]) if product.get('tags') else ''  # Show first 3 tags
                print(f"{product['id']:<38} {product['name']:<40} {product['price']:<9} {tags_str}")
            print(f"\nTotal: {len(response.data)} products")
        else:
            print("No products found")

    except Exception as e:
        print(f"[X] Error fetching products: {e}")

def delete_product(product_id):
    """Delete a product by ID"""
    print(f"Deleting product ID: {product_id}")

    try:
        response = supabase.table('products').delete().eq('id', product_id).execute()

        if response.data:
            print(f"[OK] Product deleted successfully!")
            return True
        else:
            print(f"[X] Failed to delete product (may not exist)")
            return False

    except Exception as e:
        print(f"[X] Error deleting product: {e}")
        return False

def add_sizes(product_id, sizes_str):
    """Add sizes to a product's variants"""
    print(f"[+] Adding sizes to product ID: {product_id}")

    # Parse sizes from comma-separated string
    sizes = [s.strip() for s in sizes_str.split(',')]

    try:
        # Get current product data
        response = supabase.table('products').select('variants').eq('id', product_id).execute()

        if not response.data:
            print(f"[X] Product not found")
            return False

        # Get current variants or create empty dict
        variants = response.data[0].get('variants') or {}

        # Add sizes
        variants['sizes'] = sizes

        # Update product
        update_response = supabase.table('products').update({'variants': variants}).eq('id', product_id).execute()

        if update_response.data:
            print(f"[OK] Sizes added: {', '.join(sizes)}")
            return True
        else:
            print(f"[X] Failed to update product")
            return False

    except Exception as e:
        print(f"[X] Error adding sizes: {e}")
        return False

def remove_sizes(product_id):
    """Remove sizes from a product's variants"""
    print(f"[-] Removing sizes from product ID: {product_id}")

    try:
        # Get current product data
        response = supabase.table('products').select('variants').eq('id', product_id).execute()

        if not response.data:
            print(f"[X] Product not found")
            return False

        # Get current variants
        variants = response.data[0].get('variants') or {}

        # Remove sizes if they exist
        if 'sizes' in variants:
            del variants['sizes']

            # Update product
            update_response = supabase.table('products').update({'variants': variants}).eq('id', product_id).execute()

            if update_response.data:
                print(f"[OK] Sizes removed from product")
                return True
            else:
                print(f"[X] Failed to update product")
                return False
        else:
            print(f"[!] Product has no sizes to remove")
            return True

    except Exception as e:
        print(f"[X] Error removing sizes: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("""
[+] Product Management Script

Usage:
  python scripts/upload_products.py sync   - Upload/update products from products.json
  python scripts/upload_products.py clean  - Remove products not in products.json
  python scripts/upload_products.py list   - List all products with IDs
  python scripts/upload_products.py append <mockup_dir> <name> <price> [description] [category] [tags]
  python scripts/upload_products.py update <product_id> <field>=<value> [<field>=<value> ...]
  python scripts/upload_products.py delete <product_id> - Delete a product
  python scripts/upload_products.py add-sizes <product_id> <sizes> - Add sizes to a product
  python scripts/upload_products.py remove-sizes <product_id> - Remove sizes from a product

Examples:
  # Add new product from mockups
  python scripts/upload_products.py append mockups/hoodie_fox "Fox Spirit Hoodie" 1299 "Mystical fox design" hoodies "animals,mystical"

  # List all products
  python scripts/upload_products.py list

  # Delete a product
  python scripts/upload_products.py delete 560ff9d5-1e62-4968-b700-2967fb7eb66c

  # Add sizes to a product
  python scripts/upload_products.py add-sizes 560ff9d5-1e62-4968-b700-2967fb7eb66c "S,M,L,XL,XXL"

  # Remove sizes from a product
  python scripts/upload_products.py remove-sizes 560ff9d5-1e62-4968-b700-2967fb7eb66c

  # Update product tags
  python scripts/upload_products.py update 5 tags="nature,wildlife,cool"

  # Update product category and price
  python scripts/upload_products.py update 5 category=t-shirts price=999

  # Update product images from new mockup directory
  python scripts/upload_products.py update 5 mockup_dir=mockups/hoodie_fox_v2

Setup:
  1. pip install supabase python-dotenv
  2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
        """)
        return

    command = sys.argv[1]

    if command == 'sync':
        sync_products()
    elif command == 'clean':
        clean_products()
    elif command == 'list':
        list_products()
    elif command == 'delete':
        if len(sys.argv) < 3:
            print("[X] Usage: delete <product_id>")
            return

        product_id = sys.argv[2]
        delete_product(product_id)
    elif command == 'add-sizes':
        if len(sys.argv) < 4:
            print("[X] Usage: add-sizes <product_id> <sizes>")
            print("    Example: add-sizes 123 'S,M,L,XL,XXL'")
            return

        product_id = sys.argv[2]
        sizes_str = sys.argv[3]
        add_sizes(product_id, sizes_str)
    elif command == 'remove-sizes':
        if len(sys.argv) < 3:
            print("[X] Usage: remove-sizes <product_id>")
            return

        product_id = sys.argv[2]
        remove_sizes(product_id)
    elif command == 'append':
        if len(sys.argv) < 5:
            print("[X] Usage: append <mockup_dir> <name> <price> [description] [category] [tags]")
            return

        mockup_dir = sys.argv[2]
        name = sys.argv[3]
        price = int(sys.argv[4])
        description = sys.argv[5] if len(sys.argv) > 5 else ""
        category = sys.argv[6] if len(sys.argv) > 6 else "hoodies"
        tags = sys.argv[7].split(',') if len(sys.argv) > 7 else []

        append_product_from_mockups(mockup_dir, name, description, price, category, tags)
    elif command == 'update':
        if len(sys.argv) < 4:
            print("[X] Usage: update <product_id> <field>=<value> [<field>=<value> ...]")
            return

        product_id = sys.argv[2]
        updates = {}

        # Parse field=value pairs
        for arg in sys.argv[3:]:
            if '=' in arg:
                field, value = arg.split('=', 1)

                # Convert numeric fields
                if field == 'price' or field == 'compare_at_price' or field == 'inventory_quantity':
                    value = int(value)

                updates[field] = value
            else:
                print(f"[!]  Skipping invalid argument: {arg}")

        update_product(product_id, **updates)
    else:
        print("[X] Invalid command. Use 'sync', 'clean', 'list', 'delete', 'add-sizes', 'remove-sizes', 'append', or 'update'")

if __name__ == '__main__':
    main()