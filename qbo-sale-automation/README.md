# QBO Sale Automation CLI Tool

Automates the creation of QuickBooks (QBO) sales by generating all required artifacts from a single input, eliminating repetitive manual work across Dealer, FireConsole, and BO systems.

## Problem Solved

Every QBO sale generates a new Offer ID, forcing manual updates across:
- **Dealer**: Sale Offering creation
- **FireConsole**: Coupon creation with RPC
- **BO**: Product updates
- **FED**: Dependencies

This tool generates all artifacts from one input, reducing creation time from hours to minutes and preventing common mistakes.

## Installation

```bash
# Clone or download the tool
cd qbo-sale-automation

# Make executable (Unix/Mac)
chmod +x cli.js

# Or use with node directly
node cli.js --help
```

## Usage

### Basic Example: Simple Percent Discount

```bash
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE50
```

### Multi-Cycle Discount Example

For discounts that apply to multiple billing cycles:

```bash
node cli.js \
  --sale-type SEASONAL_SALE \
  --discount-percent 50 \
  --valid-from 2025-01-01 \
  --expires-on 2025-12-31 \
  --product-group-sbs-id abc123def456 \
  --offering-id xyz789uvw012 \
  --coupon-code SALE50 \
  --cycles 2 \
  --interval YEARLY \
  --count 2
```

This creates a `multi_cycle_percent` discount rule that applies 50% off for the first 2 yearly billing cycles.

### Dry Run (Preview Only)

```bash
node cli.js \
  --sale-type PERSONAL_SALE \
  --discount-percent 70 \
  --valid-from 2025-01-01 \
  --expires-on 2025-01-31 \
  --product-group-sbs-id abc123 \
  --offering-id xyz789 \
  --coupon-code SALE70 \
  --dry-run
```

## Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--sale-type` | Sale type: `PERSONAL_SALE` or `SEASONAL_SALE` | `PERSONAL_SALE` |
| `--discount-percent` | Discount percentage (1-100) | `50` |
| `--valid-from` | Start date (YYYY-MM-DD or ISO8601) | `2025-01-01` |
| `--expires-on` | End date (YYYY-MM-DD or ISO8601) | `2025-01-31` |
| `--product-group-sbs-id` | Product Group SBS ID | `abc123def456` |
| `--offering-id` | Dealer offering ID | `xyz789uvw012` |
| `--coupon-code` | Coupon code | `SALE50` |

## Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--coupon-name` | Custom coupon name | Auto-generated |
| `--coupon-description` | Custom coupon description | Auto-generated |
| `--offering-name` | Custom offering name | Auto-generated |
| `--offering-description` | Custom offering description | Auto-generated |
| `--offering-manager-email` | Offering manager email | `[REQUIRED: Add offering manager email]` |
| `--max-time-hours` | Max time in hours | `null` |
| `--bulk-id` | Bulk ID for coupon | Not set |
| `--created-by-category` | Created by category (user/admin) | Not set |
| `--created-by-id` | Created by ID | Not set |
| `--targeting` | Targeting configuration | `[TO BE DEFINED]` |
| `--status` | Status: `DRAFT`, `LIVE`, `ARCHIVED` | `DRAFT` |
| `--qbo-offer-id` | QBO Offer ID (if known) | `[WILL BE SET AFTER QBO SALE CREATION]` |
| `--notes` | Additional notes | Auto-generated timestamp |
| `--output-dir` | Output directory | `./output` |
| `--dry-run` | Preview only, don't save files | `false` |

## Multi-Cycle Discount Parameters

Use these together to create `multi_cycle_percent` discounts:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--cycles` | Number of recurring cycles | `2` |
| `--interval` | Cycle interval: `MONTHLY` or `YEARLY` | `YEARLY` |
| `--count` | Number of cycles | `2` |

## Output

The tool generates two files:

1. **FireConsole RPC JSON Payload** (`*_fireconsole.json`)
   - Ready-to-use JSON for FireConsole RPC (admin-signed)
   - Includes correct `discount_rule` logic
   - Metadata with `isSale=true` and `saleId=<offering_id>`
   - Proper `applies_to` structure with Product Group SBS ID

2. **Dealer Offering Template** (`*_dealer.json`)
   - Template with all required Dealer offering fields
   - Sale type, manager email, coupon code linkage
   - Placeholders for QBO Offer ID (to be updated after QBO sale creation)

### Example Output Structure

**FireConsole Payload:**
```json
{
  "coupon": {
    "code": "SALE50",
    "name": "PERSONAL_SALE - 50%",
    "description": "Sale coupon for PERSONAL_SALE offering",
    "enabled": true,
    "use_limit": 1,
    "valid_from": "2025-01-01T00:00:00Z",
    "expires_on": "2025-01-31T00:00:00Z",
    "discount_rule": {
      "percent": 50
    },
    "applies_to": [
      {
        "category": "product_group",
        "id": "abc123def456"
      }
    ],
    "metadata": {
      "isSale": "true",
      "saleId": "xyz789uvw012"
    }
  }
}
```

**Dealer Template:**
```json
{
  "internal_name": "PERSONAL_SALE - 50% Sale",
  "description": "Sale offering for PERSONAL_SALE with 50% discount",
  "sale_type": "PERSONAL_SALE",
  "offering_manager_email": "[REQUIRED: Add offering manager email]",
  "coupon_code": "SALE50",
  "max_time_hours": null,
  "targeting": "[TO BE DEFINED]",
  "status": "DRAFT",
  "qbo_offer_id": "[WILL BE SET AFTER QBO SALE CREATION]",
  "notes": "Created via QBO Sale Automation CLI on 2025-01-15T10:30:00Z"
}
```

## Validation

The tool validates:
- ✅ Required fields are present
- ✅ Sale type is valid (`PERSONAL_SALE` or `SEASONAL_SALE`)
- ✅ Discount percent is between 1-100
- ✅ Dates are valid and `expires_on` is after `valid_from`
- ✅ Multi-cycle parameters are valid when provided
- ✅ All numeric fields are valid integers

## Workflow

1. **Run the CLI tool** with sale parameters
2. **Review generated files** (use `--dry-run` first)
3. **Update QBO Offer ID** in Dealer template after QBO sale creation
4. **Create FireConsole coupon** using the RPC payload
5. **Create Dealer offering** using the template
6. **Verify** all systems are in sync

## Next Steps

- **Short Term**: Use generated artifacts to create sales in minutes instead of hours
- **Long Term**: Integrate with QBO API to automatically fetch Offer IDs and update templates

## Troubleshooting

### Validation Errors
If you see validation errors, check:
- All required parameters are provided
- Date format is correct (YYYY-MM-DD or ISO8601)
- Discount percent is between 1-100
- Sale type matches exactly: `PERSONAL_SALE` or `SEASONAL_SALE`

### Multi-Cycle Discount Issues
When using multi-cycle discounts:
- Provide all three: `--cycles`, `--interval`, and `--count`
- `--interval` must be `MONTHLY` or `YEARLY`
- All numeric values must be positive integers

## License

ISC

