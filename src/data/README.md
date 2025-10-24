# Amazon Products Data Guide

## How to Add Products

You can easily add Amazon products by extracting the ASIN from any Amazon link.

### Method 1: Extract ASIN Manually

Given this link:
```
https://www.amazon.in/OnePlus-Snapdragon-Stable-Flagship-Powered/dp/B0FCMKSP7V?pf_rd_r=...
```

1. Find the ASIN after `/dp/` → **B0FCMKSP7V**
2. Note the domain → **amazon.in**
3. Add to `amazonProducts.json`:

```json
{
  "id": "amz-001",
  "asin": "B0FCMKSP7V",
  "name": "OnePlus 13 Snapdragon 8 Elite",
  "description": "Flagship smartphone with Snapdragon 8 Elite",
  "category": "electronics",
  "images": ["https://m.media-amazon.com/images/I/61OtOTTpzxL._SX679_.jpg"],
  "affiliateLink": "",
  "estimatedPrice": "₹54,999",
  "marketplace": "amazon.in",
  "tags": ["smartphone", "flagship", "android"]
}
```

### Method 2: Use the Utility Function (Developer)

```typescript
import { processAmazonUrl } from '@/lib/amazonUtils'

const url = "https://www.amazon.in/OnePlus-Snapdragon-Stable-Flagship-Powered/dp/B0FCMKSP7V?..."
const result = processAmazonUrl(url)

// Result: { asin: "B0FCMKSP7V", marketplace: "amazon.in" }
```

## Field Reference

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `id` | Yes | Unique identifier | `"amz-001"` |
| `asin` | Yes | Amazon product ID (10 characters) | `"B0FCMKSP7V"` |
| `name` | Yes | Product name | `"OnePlus 13"` |
| `description` | Yes | Short description | `"Flagship smartphone"` |
| `category` | Yes | Product category | `"electronics"` |
| `imageUrl` | Yes | Amazon product image URL | Full URL |
| `affiliateLink` | Yes | Leave empty `""` (generated automatically) | `""` |
| `estimatedPrice` | No | Display price | `"₹54,999"` or `"$49.99"` |
| `marketplace` | No | Amazon domain (defaults to `amazon.com`) | `"amazon.in"` |
| `tags` | No | Array of searchable tags | `["smartphone", "flagship"]` |

## Supported Marketplaces

- `amazon.com` (USA) - Default
- `amazon.in` (India)
- `amazon.co.uk` (UK)
- `amazon.ca` (Canada)
- `amazon.de` (Germany)
- `amazon.fr` (France)
- `amazon.es` (Spain)
- `amazon.it` (Italy)
- `amazon.co.jp` (Japan)

## Tips

1. **Associate ID**: Set once at the top level (`associateId: "dealsloveus-21"`)
2. **Affiliate Links**: Always leave `affiliateLink: ""` - they're generated dynamically
3. **ASIN Format**: Always 10 alphanumeric characters (e.g., `B0FCMKSP7V`)
4. **Tags**: Use for filtering - keep them lowercase and descriptive
5. **Images**: Use Amazon's CDN URLs (`https://m.media-amazon.com/images/I/...`)

## Categories

Keep categories consistent across products for better filtering:
- `electronics`
- `fashion`
- `home`
- `books`
- `toys`
- etc.
