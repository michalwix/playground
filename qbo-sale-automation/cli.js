#!/usr/bin/env node

/**
 * QBO Sale Automation CLI Tool
 * 
 * Automates creation of QuickBooks sales by generating:
 * - FireConsole RPC JSON payload for coupon creation
 * - Dealer offering field template
 * 
 * Usage:
 *   node cli.js --sale-type PERSONAL_SALE --discount-percent 50 \
 *     --valid-from 2025-01-01 --expires-on 2025-01-31 \
 *     --product-group-sbs-id abc123 --offering-id xyz789 \
 *     --coupon-code SALE50
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  saleTypes: ['PERSONAL_SALE', 'SEASONAL_SALE'],
  discountTypes: ['percent', 'multi_cycle_percent'],
  cycleUnits: ['MONTH', 'YEAR'],
  cycleDurations: ['MONTHLY', 'YEARLY'],
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle flags without values (like --dry-run, --help)
    if (arg.startsWith('--') && !arg.includes('=')) {
      const key = arg.replace(/^--/, '');
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Check if next arg is also a flag (starts with --) or doesn't exist
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('--')) {
        // Flag without value, set to true
        params[camelKey] = true;
      } else {
        // Flag with value
        params[camelKey] = nextArg;
        i++; // Skip next arg as we've consumed it
      }
    }
  }
  
  return params;
}

/**
 * Validate input parameters
 */
function validateParams(params) {
  const errors = [];
  
  // Required fields
  if (!params.saleType) {
    errors.push('--sale-type is required');
  } else if (!CONFIG.saleTypes.includes(params.saleType)) {
    errors.push(`--sale-type must be one of: ${CONFIG.saleTypes.join(', ')}`);
  }
  
  if (!params.discountPercent) {
    errors.push('--discount-percent is required');
  } else {
    const percent = parseInt(params.discountPercent, 10);
    if (isNaN(percent) || percent < 1 || percent > 100) {
      errors.push('--discount-percent must be between 1 and 100');
    }
  }
  
  if (!params.validFrom) {
    errors.push('--valid-from is required (format: YYYY-MM-DD or ISO8601)');
  }
  
  if (!params.expiresOn) {
    errors.push('--expires-on is required (format: YYYY-MM-DD or ISO8601)');
  }
  
  if (!params.productGroupSbsId) {
    errors.push('--product-group-sbs-id is required');
  }
  
  if (!params.offeringId) {
    errors.push('--offering-id is required');
  }
  
  if (!params.couponCode) {
    errors.push('--coupon-code is required');
  }
  
  // Validate dates
  if (params.validFrom && params.expiresOn) {
    const validFrom = new Date(params.validFrom);
    const expiresOn = new Date(params.expiresOn);
    
    if (isNaN(validFrom.getTime())) {
      errors.push('--valid-from must be a valid date');
    }
    
    if (isNaN(expiresOn.getTime())) {
      errors.push('--expires-on must be a valid date');
    }
    
    if (validFrom >= expiresOn) {
      errors.push('--expires-on must be after --valid-from');
    }
  }
  
  // Optional multi-cycle validation
  if (params.cycles) {
    const cycles = parseInt(params.cycles, 10);
    if (isNaN(cycles) || cycles < 1) {
      errors.push('--cycles must be a positive integer');
    }
  }
  
  if (params.interval) {
    if (!CONFIG.cycleDurations.includes(params.interval)) {
      errors.push(`--interval must be one of: ${CONFIG.cycleDurations.join(', ')}`);
    }
  }
  
  if (params.count) {
    const count = parseInt(params.count, 10);
    if (isNaN(count) || count < 1) {
      errors.push('--count must be a positive integer');
    }
  }
  
  return errors;
}

/**
 * Normalize date to ISO8601 format
 */
function normalizeDate(dateStr) {
  // If it's just YYYY-MM-DD, add time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T00:00:00Z`;
  }
  return dateStr;
}

/**
 * Build discount rule based on parameters
 */
function buildDiscountRule(params) {
  const discountPercent = parseInt(params.discountPercent, 10);
  
  // Simple percent discount
  if (!params.cycles && !params.interval && !params.count) {
    return {
      percent: discountPercent
    };
  }
  
  // Multi-cycle percent discount
  if (params.cycles || params.interval || params.count) {
    const cycles = parseInt(params.cycles || '1', 10);
    const interval = params.interval || 'YEARLY';
    const count = parseInt(params.count || '1', 10);
    
    // Map interval to cycle unit
    const cycleUnit = interval === 'YEARLY' ? 'YEAR' : 'MONTH';
    
    return {
      multi_cycle_percent: {
        percent: [
          {
            percent: discountPercent,
            recurring_cycles_number: cycles,
            cycle_duration: interval,
            number_of_cycles: count,
            cycle: {
              unit: cycleUnit,
              count: count
            }
          }
        ]
      }
    };
  }
  
  // Default to simple percent
  return {
    percent: discountPercent
  };
}

/**
 * Generate FireConsole RPC JSON payload
 */
function generateFireConsolePayload(params) {
  const discountRule = buildDiscountRule(params);
  
  const payload = {
    coupon: {
      code: params.couponCode,
      name: params.couponName || `${params.saleType} - ${params.discountPercent}%`,
      description: params.couponDescription || `Sale coupon for ${params.saleType} offering`,
      enabled: true,
      use_limit: 1,
      valid_from: normalizeDate(params.validFrom),
      expires_on: normalizeDate(params.expiresOn),
      discount_rule: discountRule,
      applies_to: [
        {
          category: 'product_group',
          id: params.productGroupSbsId
        }
      ],
      metadata: {
        isSale: 'true',
        saleId: params.offeringId
      }
    }
  };
  
  // Add optional fields
  if (params.bulkId) {
    payload.coupon.bulk_id = params.bulkId;
  }
  
  if (params.createdByCategory && params.createdById) {
    payload.coupon.created_by = {
      category: params.createdByCategory,
      id: params.createdById
    };
  }
  
  return payload;
}

/**
 * Generate Dealer offering template
 */
function generateDealerOfferingTemplate(params) {
  const template = {
    // Basic Information
    internal_name: params.offeringName || `${params.saleType} - ${params.discountPercent}% Sale`,
    description: params.offeringDescription || `Sale offering for ${params.saleType} with ${params.discountPercent}% discount`,
    
    // Sale Configuration
    sale_type: params.saleType,
    offering_manager_email: params.offeringManagerEmail || '[REQUIRED: Add offering manager email]',
    
    // Coupon Linkage
    coupon_code: params.couponCode,
    
    // Optional Fields
    max_time_hours: params.maxTimeHours || null,
    
    // Targeting (to be defined)
    targeting: params.targeting || '[TO BE DEFINED]',
    
    // Status
    status: params.status || 'DRAFT', // DRAFT, LIVE, ARCHIVED
    
    // QBO Integration
    qbo_offer_id: params.qboOfferId || '[WILL BE SET AFTER QBO SALE CREATION]',
    
    // Notes
    notes: params.notes || `Created via QBO Sale Automation CLI on ${new Date().toISOString()}`
  };
  
  return template;
}

/**
 * Main execution
 */
function main() {
  const params = parseArgs();
  const dryRun = params.dryRun === true || params.dryRun === 'true' || params.dryRun === '1';
  
  // Show help
  if (params.help || Object.keys(params).length === 0) {
    console.log(`
QBO Sale Automation CLI Tool

Usage:
  node cli.js [options]

Required Options:
  --sale-type <TYPE>              Sale type: PERSONAL_SALE or SEASONAL_SALE
  --discount-percent <NUMBER>     Discount percentage (1-100)
  --valid-from <DATE>             Start date (YYYY-MM-DD or ISO8601)
  --expires-on <DATE>             End date (YYYY-MM-DD or ISO8601)
  --product-group-sbs-id <ID>     Product Group SBS ID
  --offering-id <ID>              Dealer offering ID
  --coupon-code <CODE>            Coupon code

Optional Options:
  --coupon-name <NAME>            Custom coupon name
  --coupon-description <DESC>     Custom coupon description
  --offering-name <NAME>           Custom offering name
  --offering-description <DESC>   Custom offering description
  --offering-manager-email <EMAIL> Offering manager email
  --max-time-hours <HOURS>        Max time in hours
  --bulk-id <ID>                  Bulk ID for coupon
  --created-by-category <CAT>      Created by category (user/admin)
  --created-by-id <ID>             Created by ID
  --targeting <TARGETING>          Targeting configuration
  --status <STATUS>               Status (DRAFT/LIVE/ARCHIVED)
  --qbo-offer-id <ID>             QBO Offer ID (if known)
  --notes <NOTES>                 Additional notes
  
Multi-Cycle Discount Options (use together):
  --cycles <NUMBER>               Number of recurring cycles
  --interval <INTERVAL>           Cycle interval: MONTHLY or YEARLY
  --count <NUMBER>                Number of cycles

Other Options:
  --dry-run                       Show output without saving files
  --output-dir <DIR>              Output directory (default: ./output)
  --help                          Show this help message

Examples:
  # Simple 50% sale
  node cli.js \\
    --sale-type PERSONAL_SALE \\
    --discount-percent 50 \\
    --valid-from 2025-01-01 \\
    --expires-on 2025-01-31 \\
    --product-group-sbs-id abc123 \\
    --offering-id xyz789 \\
    --coupon-code SALE50

  # Multi-cycle discount (50% off for first 2 yearly cycles)
  node cli.js \\
    --sale-type SEASONAL_SALE \\
    --discount-percent 50 \\
    --valid-from 2025-01-01 \\
    --expires-on 2025-12-31 \\
    --product-group-sbs-id abc123 \\
    --offering-id xyz789 \\
    --coupon-code SALE50 \\
    --cycles 2 \\
    --interval YEARLY \\
    --count 2

  # Dry run (preview only)
  node cli.js \\
    --sale-type PERSONAL_SALE \\
    --discount-percent 70 \\
    --valid-from 2025-01-01 \\
    --expires-on 2025-01-31 \\
    --product-group-sbs-id abc123 \\
    --offering-id xyz789 \\
    --coupon-code SALE70 \\
    --dry-run
`);
    process.exit(0);
  }
  
  // Validate parameters
  const errors = validateParams(params);
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  // Generate outputs
  const fireConsolePayload = generateFireConsolePayload(params);
  const dealerTemplate = generateDealerOfferingTemplate(params);
  
  // Display results
  console.log('\n=== FireConsole RPC JSON Payload ===\n');
  console.log(JSON.stringify(fireConsolePayload, null, 2));
  
  console.log('\n=== Dealer Offering Template ===\n');
  console.log(JSON.stringify(dealerTemplate, null, 2));
  
  // Save to files if not dry-run
  if (!dryRun) {
    const outputDir = params.outputDir || './output';
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const baseFilename = `${params.couponCode}_${timestamp}`;
    
    const fireConsoleFile = path.join(outputDir, `${baseFilename}_fireconsole.json`);
    const dealerFile = path.join(outputDir, `${baseFilename}_dealer.json`);
    
    fs.writeFileSync(fireConsoleFile, JSON.stringify(fireConsolePayload, null, 2), 'utf-8');
    fs.writeFileSync(dealerFile, JSON.stringify(dealerTemplate, null, 2), 'utf-8');
    
    console.log(`\n✓ Files saved:`);
    console.log(`  - ${fireConsoleFile}`);
    console.log(`  - ${dealerFile}`);
  } else {
    console.log('\n[DRY RUN] Files not saved. Remove --dry-run to save files.');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateFireConsolePayload,
  generateDealerOfferingTemplate,
  validateParams,
  buildDiscountRule
};

