#!/usr/bin/env ts-node
/**
 * Script to import Qikink SKUs from CSV into database
 *
 * Usage:
 *   npx ts-node scripts/import-qikink-skus.ts
 *
 * This script:
 * 1. Reads Qikink_skus.csv
 * 2. Parses each row and extracts SKU components
 * 3. Inserts into qikink_products table with conflict handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CSVRow {
  'S.no': string;
  'Gender Name': string;
  'Category Name': string;
  'Color Name': string;
  'SKU': string;
  'Product Description': string;
  'Base Price': string;
  'Shipping Weight': string;
  'Tax Rate %': string;
}

interface QikinkProduct {
  qikink_sku: string;
  product_type: string;
  gender: string;
  style_code: string;
  color_code: string;
  color_name: string;
  size: string;
  base_price: number;
  metadata: {
    shipping_weight: number;
    tax_rate: number;
    description: string;
  };
}

/**
 * Parse SKU to extract components
 * Format: {Gender}{StyleCode}-{ColorCode}-{Size}
 * Example: MVnHs-Rd-L = Male, VnHs (V Neck), Rd (Red), L
 */
function parseSKU(sku: string): { gender: string; styleCode: string; colorCode: string; size: string } {
  // Extract gender (first character)
  const gender = sku.charAt(0);

  // Split by hyphen
  const parts = sku.split('-');

  if (parts.length !== 3) {
    throw new Error(`Invalid SKU format: ${sku}`);
  }

  // First part contains gender + style code
  const styleCode = parts[0].substring(1); // Remove gender character
  const colorCode = parts[1];
  const size = parts[2];

  return { gender, styleCode, colorCode, size };
}

/**
 * Map gender code to full name
 */
function mapGender(genderCode: string): string {
  const mapping: Record<string, string> = {
    'M': 'Male',
    'F': 'Female',
    'B': 'Baby/Kids',
    'U': 'Unisex'
  };
  return mapping[genderCode] || genderCode;
}

/**
 * Clean product type (remove SKU codes like "| UV34")
 */
function cleanProductType(categoryName: string): string {
  return categoryName.replace(/\s*\|\s*[A-Z0-9]+\s*$/, '').trim();
}

/**
 * Parse CSV row into QikinkProduct
 */
function parseCSVRow(row: CSVRow): QikinkProduct {
  const sku = row.SKU.trim();
  const { gender, styleCode, colorCode, size } = parseSKU(sku);

  return {
    qikink_sku: sku,
    product_type: cleanProductType(row['Category Name']),
    gender: mapGender(gender),
    style_code: styleCode,
    color_code: colorCode,
    color_name: row['Color Name'].trim(),
    size: size,
    base_price: parseFloat(row['Base Price']) || 0,
    metadata: {
      shipping_weight: parseFloat(row['Shipping Weight']) || 0,
      tax_rate: parseFloat(row['Tax Rate %']) || 0,
      description: row['Product Description'].trim()
    }
  };
}

/**
 * Main import function
 */
async function importQikinkSKUs() {
  console.log('🚀 Starting Qikink SKU import...\n');

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'Qikink_skus.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📁 Reading CSV from: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as CSVRow[];

  console.log(`📊 Found ${rows.length} rows in CSV\n`);

  // Parse and validate
  const products: QikinkProduct[] = [];
  const errors: { row: number; error: string }[] = [];

  rows.forEach((row, index) => {
    try {
      const product = parseCSVRow(row);
      products.push(product);
    } catch (error) {
      errors.push({
        row: index + 2, // +2 for header row and 0-index
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  if (errors.length > 0) {
    console.log('⚠️  Parsing errors:');
    errors.forEach(({ row, error }) => {
      console.log(`   Row ${row}: ${error}`);
    });
    console.log('');
  }

  console.log(`✅ Successfully parsed ${products.length} products`);
  console.log(`❌ Failed to parse ${errors.length} rows\n`);

  // Insert into database in batches
  const BATCH_SIZE = 100;
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  console.log('💾 Inserting into database...');

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('qikink_products')
        .upsert(batch, {
          onConflict: 'qikink_sku',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        failed += batch.length;
      } else {
        inserted += batch.length;
        process.stdout.write(`   Progress: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length}\r`);
      }
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} exception:`, error);
      failed += batch.length;
    }
  }

  console.log('\n');
  console.log('📊 Import Summary:');
  console.log(`   ✅ Inserted/Updated: ${inserted}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Parse Errors: ${errors.length}`);
  console.log('');

  // Show product type summary
  const productTypes = new Set(products.map(p => p.product_type));
  console.log(`📦 Product Types (${productTypes.size}):`);
  Array.from(productTypes).sort().forEach(type => {
    const count = products.filter(p => p.product_type === type).length;
    console.log(`   - ${type}: ${count} variants`);
  });

  console.log('\n✨ Import complete!');
}

// Run the import
importQikinkSKUs().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
